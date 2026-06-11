// ─────────────────────────────────────────────────────────────────────────────
// THE LEVEL SCORE — intentful level design as a declarative timeline of beats.
//
// A roguevania level is not a pile of rooms; it is a CURATED SEQUENCE OF MOMENTS
// (Castlevania-style) authored toward an outcome. This module is the engineered
// version of WORLD_PLAN.md's per-room "role": each environment declares an ordered
// `LevelScore` — the timeline of beats the player will live through — and the logic
// gate (`scoreValidate.ts`) proves that timeline actually delivers teach→test,
// lock-and-key exploration, payoff, and a coherent tension/emotional arc.
//
// Authoring flow:  declare the Score  →  scaffold a greybox (`scoreScaffold.ts`)  →
//                  refine in the editor  →  validate (the logic gate)  →  build.
// See docs/LEVEL_GRAMMAR.md.
// ─────────────────────────────────────────────────────────────────────────────

/** The beat vocabulary — the kinds of MOMENT a level is built from. */
export type BeatRole =
  | 'arrival' //   easy entry; establish place + mood (lowest tension)
  | 'teach' //     introduce ONE mechanic/hazard SAFELY (over solid ground)
  | 'escalate' //  raise the stakes on a taught facet (over a pit/molten, combined)
  | 'branch' //    a fork / choice (critical path vs an optional detour)
  | 'gauntlet' //  a sustained demand — the hardest combat/traversal stretch
  | 'breather' //  downtime / set-piece / rest — the trough between tension waves
  | 'gate' //      a LOCK: needs a permanent ability/key to pass
  | 'reward' //    a PAYOFF: pickup / ability / lore / shortcut (often off-path)
  | 'finale'; //   the climax — the Warden / mini-boss

/** The repentance metaphor each beat carries (fall → grace → ascent). */
export type Emotion = 'collapse' | 'stalked' | 'choice' | 'struggle' | 'grace' | 'mastery' | 'ascent';

/** A facet of a mechanic/hazard/enemy — the unit of teach→escalate. Free-form
 *  strings (a small shared vocabulary), e.g. 'jump','combo','molten','grace-burst',
 *  'telegraph-heavy','front-immune'. Keys/abilities are facets too. */
export type Facet = string;

/** One MOMENT in the timeline. */
export interface Beat {
  room: string; //         the composed sub-room id this beat lives in
  role: BeatRole;
  intent: string; //       one line — what the player should feel/learn HERE
  emotion: Emotion;
  elevation: 'ascend' | 'descend' | 'lateral';
  tension: number; //      0..1 intensity (threat/difficulty) — drives the ramp + wave
  teaches?: Facet[]; //    facets first introduced (safely) here
  tests?: Facet[]; //      facets DEMANDED here (each must be taught/assumed earlier)
  lock?: Facet; //         this beat is gated: requires this key/ability to PASS
  grants?: Facet; //       this beat grants this key/ability (a reward/finale)
  payoff?: string; //      for branch/reward/optional/dead-end: the concrete prize
  optional?: boolean; //   off the critical path (a detour / planted come-back)
}

/** The whole timeline for one ENVIRONMENT (composed via `composeWorld(env)`). */
export interface LevelScore {
  env: string; //          the environment's start-room id (composeWorld key)
  title: string;
  premise: string; //      the intended OUTCOME/experience in one line
  assumed?: Facet[]; //    facets the player already owns on entry (taught upstream)
  beats: Beat[]; //        ORDERED — the timeline of moments
}

// ─── BIO-01 — "THE FIRST FALL" ───────────────────────────────────────────────
// The collapse and the first climb out. Teaches the whole kit (move→combat→
// traversal), plants the Grace-Burst come-back (the vault), pays the required key
// (the buried memory), and caps with the Warden. Critical path: first-fall →
// descent → crossroads → memory(key) → gate(Warden). Optional: the vault.
export const firstFallScore: LevelScore = {
  env: 'first-fall',
  title: 'THE FIRST FALL',
  premise: 'You hit the lowest place — then learn the kit and climb back up past the Warden.',
  beats: [
    {
      room: 'first-fall',
      role: 'arrival',
      intent: 'Wake mid-fall and land among a broken altar — the collapse made literal; learn to move, jump, dash.',
      emotion: 'collapse',
      elevation: 'descend',
      tension: 0.1,
      teaches: ['move', 'jump', 'dash', 'molten'],
    },
    {
      room: 'descent',
      role: 'teach',
      intent: 'First blade-work in the dark — read the runner’s lunge, weave the relentless crawler.',
      emotion: 'stalked',
      elevation: 'ascend',
      tension: 0.35,
      teaches: ['combo', 'telegraph-light', 'pursuer'],
      tests: ['jump', 'molten'],
    },
    {
      room: 'crossroads',
      role: 'branch',
      intent: 'A junction with an airborne harasser: drop into the pit to face the buried memory, or press on toward the gate.',
      emotion: 'choice',
      elevation: 'ascend',
      tension: 0.4,
      teaches: ['ranged-dodge'],
      tests: ['combo'],
    },
    {
      room: 'memory',
      role: 'reward',
      intent: 'Face what you buried — a heavy Striker guards the Broken Memory; take the key, climb back out the shaft.',
      emotion: 'struggle',
      elevation: 'descend',
      tension: 0.55,
      teaches: ['telegraph-heavy'],
      tests: ['combo'],
      grants: 'broken-memory',
      payoff: 'the Broken Memory key (required to open the gate)',
    },
    {
      room: 'vault',
      role: 'gate',
      intent: 'A hidden vault across a molten lake under a dropped ceiling — only the Grace Burst can cross. The planted come-back.',
      emotion: 'mastery',
      elevation: 'ascend',
      tension: 0.5,
      lock: 'grace-burst',
      payoff: 'a Grace Ember (a run-scoped boon)',
      optional: true,
    },
    {
      room: 'gate',
      role: 'finale',
      intent: 'The way up is guarded — read and weave the Warden of the Fall; the gate opens toward the light.',
      emotion: 'ascent',
      elevation: 'ascend',
      tension: 1.0,
      tests: ['telegraph-heavy', 'combo'],
      lock: 'broken-memory',
      grants: 'grace-burst',
    },
  ],
};

// ─── BIO-02 — "HOUSE OF MIRRORS" ─────────────────────────────────────────────
// Identity distortion; confront the lie. A vertical tower built around the
// Grace-Burst the player carries in from BIO-01. Critical path is linear (a climb)
// capped by the mini-boss. Everything from BIO-01 is assumed.
export const houseOfMirrorsScore: LevelScore = {
  env: 'mirror-hall',
  title: 'HOUSE OF MIRRORS',
  premise: 'Climb your own reflection — escalate the mirror roster and fell the Untrue Image at the top.',
  assumed: ['move', 'jump', 'dash', 'molten', 'combo', 'telegraph-light', 'telegraph-heavy', 'pursuer', 'ranged-dodge', 'double-jump', 'grace-burst', 'nova'],
  beats: [
    {
      room: 'mirror-hall',
      role: 'arrival',
      intent: 'You step into your own reflection — the Mirror Double wears your sprite and shadows your every move.',
      emotion: 'stalked',
      elevation: 'ascend',
      tension: 0.25,
      teaches: ['mirror-double'],
    },
    {
      room: 'mirror-gallery',
      role: 'escalate',
      intent: 'The gallery of false faces — a glass caster fans shards and a crystalline hound rushes you between the mirrors.',
      emotion: 'struggle',
      elevation: 'ascend',
      tension: 0.45,
      teaches: ['shatter'],
      tests: ['combo', 'ranged-dodge', 'pursuer'],
    },
    {
      room: 'mirror-rise',
      role: 'gauntlet',
      intent: 'The ascending glass — climb the laddered shafts and air-dash the Grace-Burst gap, harried by a splitting wisp.',
      emotion: 'mastery',
      elevation: 'ascend',
      tension: 0.6,
      tests: ['grace-burst', 'double-jump', 'shatter'],
    },
    {
      room: 'mirror-threshold',
      role: 'gauntlet',
      intent: 'The threshold — flank the front-immune Sentinel and punish the False-Face Duelist’s recovery.',
      emotion: 'struggle',
      elevation: 'ascend',
      tension: 0.75,
      teaches: ['front-immune'],
      tests: ['telegraph-heavy', 'combo'],
    },
    {
      room: 'untrue-image',
      role: 'finale',
      intent: 'The hall of the Untrue Image — fight your reflection at its worst; break the core, not the illusion.',
      emotion: 'ascent',
      elevation: 'ascend',
      tension: 1.0,
      tests: ['telegraph-heavy', 'grace-burst', 'combo'],
      grants: 'untrue-image-down',
    },
  ],
};

/** All authored scores, by environment id. */
export const LEVEL_SCORES: Record<string, LevelScore> = {
  [firstFallScore.env]: firstFallScore,
  [houseOfMirrorsScore.env]: houseOfMirrorsScore,
};

export const allScoreEnvs = (): string[] => Object.keys(LEVEL_SCORES);
export const scoreFor = (env: string): LevelScore | undefined => LEVEL_SCORES[env];
