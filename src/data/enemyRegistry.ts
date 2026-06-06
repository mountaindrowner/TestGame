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
}

export interface EnemyConfig {
  kind: EnemyKind;
  displayName: string;
  behavior: BehaviorTag;
  spriteKey: string;
  anims: { run: string; windup: string; hurt: string; strike?: string; fire?: string };
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
    spriteKey: Assets.runner.key, // placeholder until P2 art
    anims: RUNNER_ANIMS,
    tune: CrawlerTune,
    body: { w: 16, h: 16, offX: 16, offY: 28 },
    hasCore: false,
    coreBonusMult: 2.0,
    tint: 0x7bae5a, // sickly green
  },
  spark: {
    kind: 'spark',
    displayName: 'Shame Spark',
    behavior: 'flyer_ranged',
    spriteKey: Assets.runner.key, // placeholder until P2 art
    anims: RUNNER_ANIMS,
    tune: SparkTune,
    body: { w: 12, h: 12, offX: 18, offY: 18 },
    hasCore: false,
    coreBonusMult: 1.0,
    flying: true,
    tint: 0xffd76a, // shame-yellow flare
    scale: 0.7,
  },
  striker: {
    kind: 'striker',
    displayName: 'Hollow Striker',
    behavior: 'heavy_telegraph',
    spriteKey: Assets.runner.key, // placeholder until P2 art
    anims: RUNNER_ANIMS,
    tune: StrikerTune,
    body: { w: 18, h: 28, offX: 15, offY: 16 },
    hasCore: false,
    coreBonusMult: 1.6, // big reward for striking in its recovery window
    tint: 0x9aa0c8, // hollow steel
    scale: 1.2,
  },
  guardian: {
    kind: 'guardian',
    displayName: 'THE WARDEN OF THE FALL', // armored kin of the Impulse Runner
    behavior: 'heavy_telegraph',
    spriteKey: Assets.runner.key, // placeholder until real art (see docs/ENEMY_ART_SPEC.md)
    anims: RUNNER_ANIMS,
    tune: GuardianTune,
    body: { w: 26, h: 36, offX: 11, offY: 8 },
    hasCore: false,
    coreBonusMult: 2.0, // weaving in during its recovery is the whole fight
    elite: true,
    scale: 1.9,
    depth: 46,
    tint: 0xc85a7a, // ominous rose
  },
};
