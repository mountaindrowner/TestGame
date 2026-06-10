import { PlayerTune } from './Tunables';

/** The Sanctuary economy. ALTAR graces are persistent, leveled (spend souls to
 *  kindle). The STRANGER's pacts are one-time % boons, lifetime-capped. Both the
 *  Sanctuary UI and the gameplay apply-logic read this one catalog. */

export type GraceId = 'vigor' | 'edge' | 'grace' | 'gather';

export interface GraceDef {
  id: GraceId;
  name: string;
  max: number;
  cost: (level: number) => number; // souls to go from `level` → level+1
  blurb: (level: number) => string; // what the NEXT level grants
}

export const GRACES: GraceDef[] = [
  { id: 'vigor', name: 'VIGOR', max: 5, cost: (l) => 12 + l * 8, blurb: () => '+20 max life' },
  { id: 'edge', name: 'EDGE', max: 5, cost: (l) => 14 + l * 9, blurb: () => '+12% strength' },
  { id: 'grace', name: 'GRACE', max: 2, cost: (l) => 22 + l * 18, blurb: () => '+1 air-dash per leap' },
  { id: 'gather', name: 'GATHER', max: 4, cost: (l) => 12 + l * 8, blurb: () => 'wider soul-draw, +1 soul each' },
];

export interface PactDef {
  id: string;
  name: string;
  cost: number;
  blurb: string;
}

/** The Stranger draws from this pool (he gives a few; you may keep up to PACT_CAP). */
export const PACT_CAP = 4;
export const PACTS: PactDef[] = [
  { id: 'fury', name: 'PACT OF FURY', cost: 30, blurb: '+25% strength' },
  { id: 'swift', name: 'PACT OF SWIFTNESS', cost: 28, blurb: '+15% movement' },
  { id: 'leech', name: 'PACT OF HUNGER', cost: 34, blurb: 'heal 4 on each kill' },
  { id: 'fortune', name: 'PACT OF FORTUNE', cost: 26, blurb: '+1 soul per pickup' },
  { id: 'bulwark', name: 'PACT OF THE BULWARK', cost: 32, blurb: '+15% max life' },
  { id: 'resolve', name: 'PACT OF RESOLVE', cost: 40, blurb: '+10% strength & life' },
];

export interface DerivedUpgrades {
  maxHealth: number;
  damageMult: number;
  moveMult: number;
  airDashes: number;
  magnetRange: number;
  soulBonus: number; // extra souls per pickup
  leechOnKill: number;
}

/** Fold the run's graces + pacts into the concrete stats the engine applies. */
export function deriveUpgrades(
  graces: { vigor: number; edge: number; grace: number; gather: number },
  pacts: string[],
): DerivedUpgrades {
  const has = (id: string) => pacts.includes(id);
  let maxHealth = PlayerTune.maxHealth + graces.vigor * 20;
  if (has('bulwark')) maxHealth = Math.round(maxHealth * 1.15);
  if (has('resolve')) maxHealth = Math.round(maxHealth * 1.1);
  let damageMult = 1 + graces.edge * 0.12;
  if (has('fury')) damageMult *= 1.25;
  if (has('resolve')) damageMult *= 1.1;
  return {
    maxHealth,
    damageMult,
    moveMult: has('swift') ? 1.15 : 1,
    airDashes: 1 + graces.grace,
    magnetRange: 52 + graces.gather * 22,
    soulBonus: graces.gather + (has('fortune') ? 1 : 0),
    leechOnKill: has('leech') ? 4 : 0,
  };
}
