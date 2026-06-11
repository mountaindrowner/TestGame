// ─────────────────────────────────────────────────────────────────────────────
// THE SCAFFOLDER — turn a declared LevelScore into a GREYBOX skeleton (intent →
// geometry). Each beat becomes a blocky, composable room carved in the catacomb
// grammar, seeded with role/facet-appropriate markers (the taught enemy over solid
// ground, the hazard over a pit, the gate barrier, the reward, the elite + gate).
// Critical beats chain east into a spine; optional beats hang below as drop-branches
// (a pit + a climb-out), mirroring our hand-built areas.
//
// It is a SKELETON, not a finished level: prove the beat sequence is fun as grey
// blocks (LEVEL_DESIGN §0.3 "greybox before art"), then refine in the editor. The
// rooms are written to the browser override store under `gb:<env>:<room>` ids, so
// they compose + play + edit immediately without touching the shipped rooms.
// ─────────────────────────────────────────────────────────────────────────────

import type { RoomData, SpawnType } from './roomData';
import type { Beat, LevelScore } from './levelScore';
import { Room } from './rooms/build';
import { saveRoomOverride } from './roomStore';

/** A taught/tested facet → the greybox enemy that embodies it (deduped on place). */
const FACET_ENEMY: Record<string, string> = {
  combo: 'runner',
  'telegraph-light': 'runner',
  pursuer: 'crawler',
  'ranged-dodge': 'spark',
  'telegraph-heavy': 'striker',
  'mirror-double': 'mirrorDouble',
  shatter: 'fractureWisp',
  'front-immune': 'lookingGlass',
};

/** Room footprint per role (greybox; the designer resizes to taste). */
const SIZE: Record<Beat['role'], { w: number; h: number }> = {
  arrival: { w: 30, h: 16 },
  teach: { w: 26, h: 14 },
  escalate: { w: 28, h: 14 },
  branch: { w: 26, h: 16 },
  gauntlet: { w: 34, h: 16 },
  breather: { w: 26, h: 12 },
  gate: { w: 28, h: 14 },
  reward: { w: 22, h: 14 },
  finale: { w: 40, h: 18 },
};

const gbId = (env: string, room: string) => `gb:${env}:${room}`;

/** The elite that caps this environment (greybox finale). */
const finaleElite = (env: string): string => (env.includes('mirror') ? 'mirrorboss' : 'guardian');

/** Build the greybox room for one beat. `place` carries the chain links + branch
 *  geometry decided by the caller. */
function scaffoldBeat(score: Beat, env: string, opts: { isFirst: boolean; biome?: string; eastTo?: string; downTo?: string; upTo?: string; isBranch: boolean }): RoomData {
  const { w, h } = SIZE[score.role];
  const feet = h - 4; // floor feet row (matches our rooms)
  const r = new Room(`GB · ${score.role.toUpperCase()} · ${score.room}`, w, h).fill();
  if (opts.biome) r.biome(opts.biome);
  r.carve(0, 3, w, h - 6); // open band rows 3..feet full width (side edges open for east/west chaining)

  if (opts.isFirst) r.at('player', 4, feet);
  r.at('torch', 3, feet);
  r.at('torch', w - 4, feet);

  // Markers: the enemies that embody the facets this beat teaches/tests (deduped).
  const facets = [...(score.teaches ?? []), ...(score.tests ?? [])];
  const enemies = [...new Set(facets.map((f) => FACET_ENEMY[f]).filter(Boolean))];
  enemies.forEach((kind, i) => r.at(kind as SpawnType, 8 + i * 6, feet));

  // Hazards: a taught hazard is SAFE (a patch with solid landing); an escalated one
  // sits over a pit.
  const usesMolten = facets.includes('molten');
  const usesPit = facets.includes('pit') || facets.includes('jump') || facets.includes('dash') || facets.includes('double-jump');
  const escalate = score.role === 'escalate' || score.role === 'gauntlet';
  if (usesMolten) {
    if (escalate) r.carve(Math.floor(w / 2) - 2, feet, 4, 4), r.molten(Math.floor(w / 2) - 2, feet + 1, 4); // molten in a pit
    else r.molten(Math.floor(w / 2) - 1, feet, 3); // a safe scar on solid ground
  } else if (usesPit && escalate) {
    r.carve(Math.floor(w / 2) - 2, feet, 4, 4); // a jumpable gap
  }

  // The lock barrier: a Grace-Burst gap (wide molten under a low ceiling) or a gate.
  if (score.lock === 'grace-burst') {
    r.carve(6, feet, w - 12, 4);
    r.molten(6, feet + 1, w - 12); // a lake too wide for a capped jump — air-dash only
    r.solid(8, 3, w - 16, 2); // a dropped ceiling caps the arc
  }

  // Reward / key.
  if (score.grants && score.grants !== finaleElite(env) + '-down' && !score.role.includes('finale')) {
    r.at('key', Math.floor(w / 2), feet - 4); // a granted key floats over a pedestal
    r.solid(Math.floor(w / 2) - 1, feet - 1, 3, 1);
  } else if (score.role === 'reward' || score.payoff) {
    r.at('ember', w - 6, feet);
  }
  if (score.role === 'breather') r.at('jar', Math.floor(w / 2), feet);

  // Finale: the elite + the gate out.
  if (score.role === 'finale') {
    r.at(finaleElite(env) as SpawnType, Math.floor(w * 0.7), feet);
    r.at('gate', w - 4, feet, { id: `${gbId(env, score.room)}-out`, to: '', toEntry: '' });
  }

  // Chain + branch openings.
  if (opts.eastTo) r.link('east', opts.eastTo);
  if (opts.downTo) {
    r.carve(Math.floor(w / 2) - 2, feet, 5, 4); // a 5-wide PIT down to the branch
    r.link('down', opts.downTo);
  }
  if (opts.upTo) {
    r.climbShaft(5, 0, feet - 1); // the climb-out shaft back up to the spine
    r.link('up', opts.upTo);
  }
  return r.build(gbId(env, score.room));
}

/** Scaffold a whole LevelScore into greybox rooms. Critical beats form an east
 *  spine; optional beats drop below the previous critical beat. */
export function scaffoldScore(score: LevelScore): RoomData[] {
  const env = score.env;
  const biome = env.includes('mirror') ? 'mirrors' : undefined;
  const rooms: RoomData[] = [];
  // index the spine (critical beats, in order) for east links + branch attachment.
  const critical = score.beats.filter((b) => !b.optional);
  let firstAssigned = false;
  for (let i = 0; i < score.beats.length; i++) {
    const b = score.beats[i];
    let eastTo: string | undefined;
    let downTo: string | undefined;
    let upTo: string | undefined;
    if (!b.optional) {
      const ci = critical.indexOf(b);
      const next = critical[ci + 1];
      if (next) eastTo = gbId(env, next.room);
      // any optional beats immediately following this critical beat hang below it
      const branch = score.beats.find((x, j) => j > i && x.optional && !score.beats.slice(i + 1, j).some((y) => !y.optional));
      if (branch) downTo = gbId(env, branch.room);
    } else {
      // a drop-branch: climb back up to the nearest preceding critical beat
      const prevCritical = [...score.beats.slice(0, i)].reverse().find((x) => !x.optional);
      if (prevCritical) upTo = gbId(env, prevCritical.room);
    }
    const isFirst = !firstAssigned && !b.optional;
    if (isFirst) firstAssigned = true;
    rooms.push(scaffoldBeat(b, env, { isFirst, biome, eastTo, downTo, upTo, isBranch: !!b.optional }));
  }
  return rooms;
}

/** Scaffold + write to the override store so the greybox composes/plays/edits now.
 *  Returns the start-room id to load (e.g. via `composeWorld` / `__gotoRoom`). */
export function scaffoldToStore(score: LevelScore): { startId: string; ids: string[] } {
  const rooms = scaffoldScore(score);
  const ids = rooms.map((r) => r.id as string);
  rooms.forEach((r) => saveRoomOverride(r.id as string, r));
  return { startId: ids[0], ids };
}
