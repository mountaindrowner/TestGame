import { Assets } from './assetManifest';
import { EnemyTune, CrawlerTune, SparkTune, StrikerTune, GuardianTune } from './Tunables';

/** The biome's enemy family, as data. The game spawns from this and (later) the
 *  level editor reads it to populate its palette — one registration per enemy,
 *  so adding a type never touches the spawn/scene code. This is the seam the
 *  future dev-kit reuses. */
export type EnemyKind =
  | 'runner'
  | 'crawler'
  | 'spark'
  | 'striker'
  | 'guardian'
  | 'mirrorboss'
  // BIO-02 House of Mirrors roster
  | 'mirrorDouble'
  | 'reflectionHound'
  | 'glassWitch'
  | 'falseFace'
  | 'fractureWisp'
  | 'fractureShard'
  | 'lookingGlass'
  // ranged archetypes (general)
  | 'archer'
  | 'bomber';

export type BehaviorTag = 'lunger' | 'pursuer' | 'flyer_ranged' | 'heavy_telegraph' | 'mirror_double' | 'archer' | 'bomber';

/** The gameplay-number shape every enemy tune satisfies (behaviour-specific
 *  fields are optional and only read by the matching behaviour). */
export interface EnemyTuneBase {
  maxHealth: number;
  patrolSpeed: number;
  chaseSpeed: number;
  aggroRange: number;
  aggroVertical: number;
  windupMs: number;
  contactDamage: number;
  knockbackTaken: number;
  coreStunMs: number;
  edgeCheck: boolean;
  stickyAggro?: boolean; // pursuer never disengages
  hoverOffset?: number; // flyer float height above player
  standoff?: number; // flyer horizontal keep-away distance
  fireEveryMs?: number; // flyer fire cadence
  lingerMs?: number; // flyer post-shot drift — the window to close in and punish
  strikeMs?: number; // heavy committed-strike duration
  recoveryMs?: number; // heavy punishable recovery window
  damageReduction?: number; // heavy armor (0..1 of incoming chipped)
  projectile?: { speed: number; damage: number; count: number; spreadDeg: number; lifespanMs: number };
  // Boss slam (a second, close-range attack: an overhead smash that sends a
  // jumpable ground shockwave outward). Only the elite reads these.
  slamRange?: number; // if the player is closer than this, slam instead of charging
  slamWindupMs?: number; // overhead raise telegraph
  slamMs?: number; // the smash / impact window
  slamRecoveryMs?: number; // punish window after the slam
  slamDamage?: number; // shockwave contact damage
  walkSpeed?: number; // heavy approach gait (elite stalks you in)
  attackRange?: number; // within this it commits; beyond it walks closer first
}

export interface EnemyConfig {
  kind: EnemyKind;
  displayName: string;
  behavior: BehaviorTag;
  spriteKey: string;
  anims: {
    run: string; windup: string; hurt: string;
    strike?: string; fire?: string; recovery?: string;
    idle?: string; taunt?: string; slam?: string; death?: string;
  };
  tune: EnemyTuneBase;
  body: { w: number; h: number; offX: number; offY: number };
  hasCore: boolean; // shows the molten core glow + a windup weak point
  coreBonusMult: number; // blade-damage multiplier on a weak-point hit
  flying?: boolean;
  elite?: boolean; // the Guardian — defeat sets RunState.guardianDefeated
  scale?: number;
  depth?: number;
  tint?: number; // interim visual identity while sharing placeholder art (P2 swaps real sheets)
  // BIO-02 mechanics ---------------------------------------------------------
  shatter?: boolean; // dies in a burst of glass shards (the Mirror Double)
  frontImmune?: boolean; // blades glance off the front; flank or punish its recovery (the Sentinel)
  splitInto?: { kind: EnemyKind; count: number }; // on death, fractures into smaller foes (the Wisp)
}

export const ENEMY_KINDS: EnemyKind[] = [
  'runner', 'crawler', 'spark', 'striker', 'guardian', 'mirrorboss',
  'mirrorDouble', 'reflectionHound', 'glassWitch', 'falseFace', 'fractureWisp', 'fractureShard', 'lookingGlass',
  'archer', 'bomber',
];

export function isEnemyKind(t: string): t is EnemyKind {
  return (ENEMY_KINDS as string[]).includes(t);
}

// NOTE: crawler/spark/striker/guardian temporarily reuse the runner sprite + anims
// as placeholders. P2 generates their PixelLab art and swaps spriteKey/anims here.
const RUNNER_ANIMS = { run: 'runner-run', windup: 'runner-windup', hurt: 'runner-hurt' };

export const ENEMY_REGISTRY: Record<EnemyKind, EnemyConfig> = {
  runner: {
    kind: 'runner',
    displayName: 'Impulse Runner',
    behavior: 'lunger',
    spriteKey: Assets.runner.key,
    anims: RUNNER_ANIMS,
    tune: EnemyTune,
    body: { w: EnemyTune.bodyW, h: EnemyTune.bodyH, offX: EnemyTune.bodyOffsetX, offY: EnemyTune.bodyOffsetY },
    hasCore: true,
    coreBonusMult: EnemyTune.coreBonusMult,
  },
  crawler: {
    kind: 'crawler',
    displayName: 'Regret Crawler',
    behavior: 'pursuer',
    spriteKey: Assets.crawler.key,
    anims: { run: 'crawler-run', windup: 'crawler-run', hurt: 'crawler-hurt' },
    tune: CrawlerTune,
    body: { w: 24, h: 24, offX: 10, offY: 25 }, // frame 43x49
    hasCore: false,
    coreBonusMult: 2.0,
    scale: 0.62,
  },
  spark: {
    kind: 'spark',
    displayName: 'Shame Spark',
    behavior: 'flyer_ranged',
    spriteKey: Assets.spark.key,
    anims: { run: 'spark-run', windup: 'spark-windup', hurt: 'spark-hurt', fire: 'spark-windup' },
    tune: SparkTune,
    body: { w: 16, h: 16, offX: 8, offY: 14 }, // frame 31x45
    hasCore: false,
    coreBonusMult: 1.0,
    flying: true,
    scale: 0.55,
  },
  striker: {
    kind: 'striker',
    displayName: 'Hollow Striker',
    behavior: 'heavy_telegraph',
    spriteKey: Assets.striker.key,
    anims: { run: 'striker-run', windup: 'striker-windup', hurt: 'striker-hurt', strike: 'striker-strike' },
    tune: StrikerTune,
    body: { w: 22, h: 40, offX: 16, offY: 13 }, // frame 54x53
    hasCore: false,
    coreBonusMult: 1.6, // big reward for striking in its recovery window
    scale: 0.9,
  },
  guardian: {
    kind: 'guardian',
    displayName: 'THE WARDEN OF THE FALL', // armored kin of the Impulse Runner
    behavior: 'heavy_telegraph',
    spriteKey: Assets.warden.key,
    anims: {
      run: 'warden-run',
      windup: 'warden-windup',
      hurt: 'warden-hurt',
      strike: 'warden-strike',
      recovery: 'warden-recovery',
      idle: 'warden-idle', // looms/breathes when out of range + after the intro taunt
      taunt: 'warden-taunt', // the Mega-Man intro roar
      slam: 'warden-slam', // close-range overhead smash -> jumpable ground shockwave
      death: 'warden-death', // collapse on defeat
    },
    tune: GuardianTune,
    body: { w: 28, h: 52, offX: 21, offY: 19 }, // frame 70x71 (wide bbox: taunt arms-out + slam)
    hasCore: false,
    coreBonusMult: 2.0, // weaving in during its recovery is the whole fight
    elite: true,
    scale: 1.2,
    depth: 46,
  },
  // BIO-02 mini-boss — your reflection at its worst. Reuses the Warden's armored
  // telegraph kit (charge / overhead slam / punishable recovery) themed as a cold
  // mirror-image (icy tint); its own RunState flag so it's independent of the Warden.
  mirrorboss: {
    kind: 'mirrorboss',
    displayName: 'THE UNTRUE IMAGE',
    behavior: 'heavy_telegraph',
    spriteKey: Assets.warden.key,
    anims: {
      run: 'warden-run',
      windup: 'warden-windup',
      hurt: 'warden-hurt',
      strike: 'warden-strike',
      recovery: 'warden-recovery',
      idle: 'warden-idle',
      taunt: 'warden-taunt',
      slam: 'warden-slam',
      death: 'warden-death',
    },
    tune: GuardianTune,
    body: { w: 28, h: 52, offX: 21, offY: 19 },
    hasCore: false,
    coreBonusMult: 2.0,
    elite: true,
    scale: 1.2,
    depth: 46,
    tint: 0x9fc0ff, // cold mirror-glass cast
  },

  // ── BIO-02 House of Mirrors roster ──────────────────────────────────────
  // THE MIRROR DOUBLE — the signature. Your own reflection given chase: it wears
  // the player sprite (icy), shadows you relentlessly and leaps with YOUR finisher,
  // but it's glass — it shatters in a hit or two.
  mirrorDouble: {
    kind: 'mirrorDouble',
    displayName: 'Mirror Double',
    behavior: 'mirror_double',
    spriteKey: Assets.player.key,
    anims: { run: 'player-run', windup: 'player-attack1', strike: 'player-attack3', hurt: 'player-hurt' },
    tune: { ...EnemyTune, maxHealth: 26, chaseSpeed: 162, aggroRange: 280, aggroVertical: 110, windupMs: 170, contactDamage: 16, knockbackTaken: 210, coreStunMs: 220, strikeMs: 200, edgeCheck: true },
    body: { w: 12, h: 28, offX: 16, offY: 15 }, // the player's own body box (frame 45x43)
    hasCore: false,
    coreBonusMult: 1.6,
    scale: 1,
    depth: 47,
    tint: 0x9fd8ff,
    shatter: true,
  },
  // REFLECTION HOUND — a fast, relentless pursuer that runs you down.
  reflectionHound: {
    kind: 'reflectionHound',
    displayName: 'Reflection Hound',
    behavior: 'pursuer',
    spriteKey: Assets.reflectionHound.key,
    anims: { run: 'reflectionHound-run', windup: 'reflectionHound-run', hurt: 'reflectionHound-hurt' },
    tune: { ...CrawlerTune, maxHealth: 40, chaseSpeed: 132, aggroRange: 220, aggroVertical: 60 },
    body: { w: 34, h: 18, offX: 16, offY: 17 }, // low, long quadruped (frame 65x35)
    hasCore: false,
    coreBonusMult: 2.0,
    scale: 0.8,
  },
  // GLASS WITCH — a floating caster that hurls a fan of glass shards.
  glassWitch: {
    kind: 'glassWitch',
    displayName: 'Glass Witch',
    behavior: 'flyer_ranged',
    spriteKey: Assets.glassWitch.key,
    anims: { run: 'glassWitch-run', windup: 'glassWitch-fire', hurt: 'glassWitch-hurt', fire: 'glassWitch-fire' },
    tune: { ...SparkTune, maxHealth: 40, standoff: 150, hoverOffset: 72, fireEveryMs: 2100, windupMs: 360, projectile: { speed: 132, damage: 13, count: 3, spreadDeg: 42, lifespanMs: 2400 } },
    body: { w: 14, h: 34, offX: 17, offY: 18 }, // tall robed caster (frame 48x52)
    hasCore: false,
    coreBonusMult: 1.0,
    flying: true,
    scale: 0.78,
  },
  // FALSE-FACE DUELIST — a quick telegraphing duelist; punish the recovery.
  falseFace: {
    kind: 'falseFace',
    displayName: 'False-Face Duelist',
    behavior: 'heavy_telegraph',
    spriteKey: Assets.falseFace.key,
    anims: { run: 'falseFace-run', windup: 'falseFace-run', hurt: 'falseFace-hurt', strike: 'falseFace-strike' },
    tune: { ...StrikerTune, maxHealth: 72, windupMs: 360, strikeMs: 230, recoveryMs: 430, chaseSpeed: 172, damageReduction: 0.2 },
    body: { w: 16, h: 36, offX: 18, offY: 16 }, // agile duelist (frame 51x52)
    hasCore: false,
    coreBonusMult: 1.8,
    scale: 0.82,
  },
  // FRACTURE WISP — a frail floater that bursts into shards when destroyed.
  fractureWisp: {
    kind: 'fractureWisp',
    displayName: 'Fracture Wisp',
    behavior: 'flyer_ranged',
    spriteKey: Assets.fractureWisp.key,
    anims: { run: 'fractureWisp-run', windup: 'fractureWisp-run', hurt: 'fractureWisp-hurt', fire: 'fractureWisp-run' },
    tune: { ...SparkTune, maxHealth: 28, fireEveryMs: 1700, projectile: { speed: 140, damage: 10, count: 1, spreadDeg: 0, lifespanMs: 2200 } },
    body: { w: 14, h: 24, offX: 10, offY: 20 }, // small floater (frame 34x44)
    hasCore: false,
    coreBonusMult: 1.0,
    flying: true,
    scale: 0.7,
    shatter: true,
    splitInto: { kind: 'fractureShard', count: 3 },
  },
  // the Wisp's children — tiny, fast, weak; do not split again.
  fractureShard: {
    kind: 'fractureShard',
    displayName: 'Fracture Shard',
    behavior: 'flyer_ranged',
    spriteKey: Assets.fractureWisp.key,
    anims: { run: 'fractureWisp-run', windup: 'fractureWisp-run', hurt: 'fractureWisp-hurt', fire: 'fractureWisp-run' },
    tune: { ...SparkTune, maxHealth: 8, chaseSpeed: 108, standoff: 70, hoverOffset: 40, fireEveryMs: 1300, windupMs: 200, projectile: { speed: 168, damage: 7, count: 1, spreadDeg: 0, lifespanMs: 1500 } },
    body: { w: 12, h: 18, offX: 11, offY: 24 }, // tiny shard (the wisp's children)
    hasCore: false,
    coreBonusMult: 1.0,
    flying: true,
    scale: 0.42,
    tint: 0xd6fff4, // a paler, brighter shard than the parent wisp
    shatter: true,
  },
  // LOOKING-GLASS SENTINEL — armoured; blades glance off its face. Flank it, or
  // punish its recovery — Grace Burst behind it is the answer.
  lookingGlass: {
    kind: 'lookingGlass',
    displayName: 'Looking-Glass Sentinel',
    behavior: 'heavy_telegraph',
    spriteKey: Assets.lookingGlass.key,
    anims: { run: 'lookingGlass-run', windup: 'lookingGlass-run', hurt: 'lookingGlass-hurt', strike: 'lookingGlass-strike' },
    tune: { ...StrikerTune, maxHealth: 110, windupMs: 700, strikeMs: 280, recoveryMs: 560, chaseSpeed: 130, damageReduction: 0.4 },
    body: { w: 22, h: 44, offX: 20, offY: 21 }, // bulky shield sentinel (frame 62x65)
    hasCore: false,
    coreBonusMult: 2.0,
    scale: 1.0,
    frontImmune: true,
  },

  // ── Ranged archetypes — real PixelLab side-view art ─────────────────────
  // BONE ARCHER — grounded; kites to a standoff and looses a fast straight bolt.
  // The `fire` clip draws and releases a bow (the ranged-ground telegraph).
  archer: {
    kind: 'archer',
    displayName: 'Bone Archer',
    behavior: 'archer',
    spriteKey: Assets.archer.key,
    anims: { run: 'archer-run', windup: 'archer-fire', hurt: 'archer-hurt', fire: 'archer-fire' },
    tune: { ...StrikerTune, maxHealth: 46, patrolSpeed: 52, aggroRange: 240, aggroVertical: 80, windupMs: 420, standoff: 150, fireEveryMs: 1700, damageReduction: 0, projectile: { speed: 250, damage: 14, count: 1, spreadDeg: 0, lifespanMs: 1800 } },
    body: { w: 18, h: 44, offX: 11, offY: 8 }, // slim undead archer (frame 47x52)
    hasCore: false,
    coreBonusMult: 1.6,
    scale: 0.9,
  },
  // CINDER BOMBER — grounded; lobs an arcing timed bomb that bursts in a blast.
  // The `fire` clip winds up and hurls the bomb (the ranged-ground telegraph).
  bomber: {
    kind: 'bomber',
    displayName: 'Cinder Bomber',
    behavior: 'bomber',
    spriteKey: Assets.bomber.key,
    anims: { run: 'bomber-run', windup: 'bomber-fire', hurt: 'bomber-hurt', fire: 'bomber-fire' },
    tune: { ...StrikerTune, maxHealth: 60, patrolSpeed: 46, aggroRange: 230, aggroVertical: 96, windupMs: 520, standoff: 175, fireEveryMs: 2300, damageReduction: 0, projectile: { speed: 0, damage: 26, count: 1, spreadDeg: 0, lifespanMs: 0 } },
    body: { w: 18, h: 48, offX: 18, offY: 9 }, // flame-wreathed bomber (frame 53x57)
    hasCore: false,
    coreBonusMult: 1.6,
    scale: 0.85,
  },
};
