import { Assets } from './assetManifest';
import { EnemyTune, CrawlerTune, SparkTune, StrikerTune, GuardianTune } from './Tunables';

/** The biome's enemy family, as data. The game spawns from this and (later) the
 *  level editor reads it to populate its palette — one registration per enemy,
 *  so adding a type never touches the spawn/scene code. This is the seam the
 *  future dev-kit reuses. */
export type EnemyKind = 'runner' | 'crawler' | 'spark' | 'striker' | 'guardian';

export type BehaviorTag = 'lunger' | 'pursuer' | 'flyer_ranged' | 'heavy_telegraph';

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
}

export const ENEMY_KINDS: EnemyKind[] = ['runner', 'crawler', 'spark', 'striker', 'guardian'];

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
};
