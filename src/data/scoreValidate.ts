// ─────────────────────────────────────────────────────────────────────────────
// THE LOGIC GATE — validate a LevelScore against the composed world + the design
// contract (docs/LEVEL_DESIGN.md). Where `roomValidate.ts` proves the MAP is
// well-formed (doors/links/reachability), this proves the EXPERIENCE is well-formed:
// teach→test ordering, lock-and-key solvability (no softlock), payoff for every
// detour, and a coherent tension/emotional arc. Plus `describeScore` renders the
// timeline of moments so the intent is legible at a glance.
// ─────────────────────────────────────────────────────────────────────────────

import { Beat, Emotion, LevelScore } from './levelScore';
import { composeWorld } from './worldComposer';
import { allRoomIds } from './levelGraph';

export type Severity = 'error' | 'note';
export interface ScoreWarning {
  level: Severity;
  msg: string;
}

const EMOTION_ORDER: Record<Emotion, number> = {
  collapse: 0,
  stalked: 1,
  choice: 2,
  struggle: 3,
  grace: 4,
  mastery: 5,
  ascent: 6,
};

/** The logic gate. Returns [] when the level's intended experience is sound. */
export function validateScore(score: LevelScore): ScoreWarning[] {
  const out: ScoreWarning[] = [];
  const err = (msg: string) => out.push({ level: 'error', msg });
  const note = (msg: string) => out.push({ level: 'note', msg });
  const beats = score.beats;
  if (!beats.length) {
    err('empty score: no beats');
    return out;
  }
  const at = (b: Beat, i: number) => `beat ${i + 1} (${b.room}/${b.role})`;

  // --- coverage: every composed sub-room is a planned beat, and vice-versa ------
  // Only meaningful once the level's rooms actually exist. A brand-new SCORE-FIRST
  // level (rooms not built/scaffolded yet) composes a fallback world — skip coverage
  // until the rooms are real (the declare→scaffold→build flow checks it post-build).
  if (!allRoomIds().includes(score.env)) {
    note(`'${score.env}' isn't built yet — coverage unchecked (declare → scaffold → build, LEVEL_GRAMMAR §3)`);
  } else {
    let placements: { id: string }[] = [];
    try {
      placements = composeWorld(score.env).placements;
    } catch (e) {
      note(`could not compose '${score.env}' to check coverage: ${(e as Error).message}`);
    }
    const planned = new Set(beats.map((b) => b.room));
    const built = new Set(placements.map((p) => p.id));
    for (const p of placements) if (!planned.has(p.id)) note(`sub-room '${p.id}' is built but has no beat (nothing "random" — give it intent)`);
    for (const b of beats) if (!built.has(b.room)) err(`${at(b, beats.indexOf(b))} targets '${b.room}', which isn't in the composed world`);
  }

  // --- teach → test: a facet's FIRST appearance must be a teach, never a test ---
  const taught = new Set<string>(score.assumed ?? []);
  beats.forEach((b, i) => {
    for (const f of b.tests ?? []) {
      if (!taught.has(f)) err(`${at(b, i)} tests '${f}' before it is taught (teach-safely-then-test, §3.3/#8)`);
    }
    for (const f of b.teaches ?? []) taught.add(f);
  });

  // --- lock-and-key: solvable critical path, no softlock, no unobtainable key ---
  const grantIndex = new Map<string, number>(); // facet → first beat that grants it
  beats.forEach((b, i) => {
    if (b.grants && !grantIndex.has(b.grants)) grantIndex.set(b.grants, i);
  });
  const owned = new Set<string>(score.assumed ?? []); // keys/abilities along the critical path
  beats.forEach((b, i) => {
    const onCritical = !b.optional;
    if (b.lock) {
      const grantedAt = grantIndex.has(b.lock) ? grantIndex.get(b.lock)! : Infinity;
      const ownNow = owned.has(b.lock);
      if (onCritical && !ownNow) {
        err(`${at(b, i)} locks the critical path behind '${b.lock}' but it isn't earned yet — SOFTLOCK (#4)`);
      } else if (!onCritical && !ownNow) {
        // an optional gate whose key comes later = a planted "come back" barrier (§4.2)…
        if (grantedAt === Infinity && !(score.assumed ?? []).includes(b.lock)) err(`${at(b, i)} locks behind '${b.lock}', which is never granted (unobtainable, #5.5)`);
        else if (!b.payoff && !b.grants) note(`${at(b, i)} is a planted come-back (needs '${b.lock}' later) but declares no payoff (§4.2/#5)`);
      }
    }
    if (onCritical && b.grants) owned.add(b.grants);
  });
  // every lock must be obtainable somewhere
  beats.forEach((b, i) => {
    if (b.lock && !grantIndex.has(b.lock) && !(score.assumed ?? []).includes(b.lock)) {
      if (!out.some((w) => w.msg.includes(`'${b.lock}', which is never granted`))) err(`${at(b, i)} requires '${b.lock}', which no beat grants and the player doesn't bring in (unobtainable, #5.5)`);
    }
  });

  // --- payoff: every detour / reward / branch pays off (#5) ---------------------
  beats.forEach((b, i) => {
    const owes = b.optional || b.role === 'reward';
    if (owes && !b.payoff && !b.grants) note(`${at(b, i)} is a detour/reward with no declared payoff (every dead end pays off, #5)`);
  });

  // --- tension: ramp to the finale, with wave pacing (§3.2/§3.6) ----------------
  const tens = beats.map((b) => b.tension);
  const arrival = beats.find((b) => b.role === 'arrival');
  if (arrival && arrival.tension > 0.3) note(`arrival '${arrival.room}' opens at tension ${arrival.tension.toFixed(2)} — open gentler (§3.2: never start at the toughest)`);
  const finale = beats.find((b) => b.role === 'finale');
  if (finale && finale.tension < Math.max(...tens)) note(`finale '${finale.room}' isn't the tension peak (difficulty should rise to the end, §3.2)`);
  const critical = beats.filter((b) => !b.optional);
  if (critical.length >= 2 && critical[critical.length - 1].tension <= critical[0].tension) note('no rising arc: the critical path does not climb in tension (§3.2)');
  // a wave needs at least one trough in a longer level (short 5-beat areas are exempt)
  if (beats.length >= 6) {
    const hasBreather = beats.some((b, i) => i > 0 && i < beats.length - 1 && (b.role === 'breather' || b.tension <= 0.3));
    if (!hasBreather) note('no breather/trough between the peaks — pace tension like a wave (load → breathe → load, §3.6)');
  }
  // a long unbroken spike is fatiguing
  let runHi = 0;
  for (const t of tens) {
    runHi = t >= 0.6 ? runHi + 1 : 0;
    if (runHi > 3) {
      note('4+ high-tension beats in a row with no trough — insert downtime (§3.6)');
      break;
    }
  }

  // --- one new facet per room; no repeated beat (§5.3) --------------------------
  beats.forEach((b, i) => {
    const inert = !(b.teaches?.length || b.tests?.length || b.grants || b.lock || b.payoff);
    if (inert && b.role !== 'arrival' && b.role !== 'breather') note(`${at(b, i)} introduces/forces nothing new — give it a facet or make it a breather (§3.9/§5.3)`);
    if (i > 0) {
      const p = beats[i - 1];
      const sameTest = JSON.stringify([...(p.tests ?? [])].sort()) === JSON.stringify([...(b.tests ?? [])].sort());
      if (p.role === b.role && sameTest && !(b.teaches?.length) && b.role !== 'gauntlet') note(`${at(b, i)} repeats the previous beat (same role+test, nothing new) — vary it (§5.3)`);
    }
  });

  // --- emotional arc: the metaphor should progress, not whiplash ----------------
  beats.forEach((b, i) => {
    if (i === 0 && EMOTION_ORDER[b.emotion] >= EMOTION_ORDER.grace) note(`opens on '${b.emotion}' — the fall should begin low (collapse/stalked), not in grace`);
    if (i > 0) {
      const drop = EMOTION_ORDER[beats[i - 1].emotion] - EMOTION_ORDER[b.emotion];
      if (drop >= 3) note(`${at(b, i)} swings the emotional arc back from '${beats[i - 1].emotion}' to '${b.emotion}' (keep the metaphor moving forward)`);
    }
  });

  return out;
}

const SPARK = '▁▂▃▄▅▆▇█';
const spark = (t: number) => SPARK[Math.max(0, Math.min(7, Math.round(t * 7)))];
const pad = (s: string, n: number) => (s.length >= n ? s.slice(0, n) : s + ' '.repeat(n - s.length));

/** Render the score as a legible TIMELINE OF MOMENTS — the intent at a glance.
 *  Returned as a multi-line string (console via `__score`, or the editor panel). */
export function describeScore(score: LevelScore): string {
  const L: string[] = [];
  L.push(`${score.title}  ·  "${score.premise}"`);
  L.push(`  env=${score.env}   ${score.beats.length} beats   tension ${score.beats.map((b) => spark(b.tension)).join('')}`);
  L.push(`  ${pad('#', 3)}${pad('room', 16)}${pad('role', 10)}${pad('tens', 7)}${pad('emotion', 10)}moment`);
  score.beats.forEach((b, i) => {
    const t = `${spark(b.tension)} ${b.tension.toFixed(2)}`;
    const star = b.optional ? '*' : ' ';
    L.push(`  ${pad(String(i + 1) + star, 3)}${pad(b.room, 16)}${pad(b.role, 10)}${pad(t, 7)}${pad(b.emotion, 10)}${b.intent}`);
  });
  const keys = score.beats.filter((b) => b.grants).map((b, _i) => `${b.grants}@${b.room}`);
  const locks = score.beats.filter((b) => b.lock).map((b) => `${b.lock}→${b.room}${b.optional ? '*' : ''}`);
  if (keys.length) L.push(`  keys    ${keys.join('   ')}`);
  if (locks.length) L.push(`  locks   ${locks.join('   ')}   ${locks.some((l) => l.includes('*')) ? '(* = planted come-back, optional+paid-off)' : ''}`);
  const w = validateScore(score);
  const errs = w.filter((x) => x.level === 'error');
  const notes = w.filter((x) => x.level === 'note');
  L.push(`  verdict ${errs.length ? '✗ ' + errs.length + ' error(s)' : '✓ logic gate passed'}  ·  ${notes.length} note(s)`);
  w.forEach((x) => L.push(`    ${x.level === 'error' ? '✗' : '·'} ${x.msg}`));
  return L.join('\n');
}
