import { Sem } from '../assetManifest';
import { RoomData } from '../roomData';
import { Room } from './build';

// BIO-01 opener — THE FIRST FALL. The signature image made literal: the run BEGINS
// mid-air. You drop down a 40-tile carved shaft past guttering torches and land
// among the stones of a broken altar — the moment of collapse — then walk the
// teaching corridor east: first runner (roll through its lunge), the molten scar
// taught safely (2 tiles, lit) then escalated (4 tiles, a real jump), an optional
// double-jump shelf holding the run's first GRACE EMBER. East edge → Lower Vaults.
// Feet row = 44 (h-4) so edge entries land on the corridor floor.
export function firstFall(): RoomData {
  const r = new Room('THE FIRST FALL', 46, 48).fill();

  // The fall shaft (x4-12) — you wake mid-air at the top and drop the full height.
  r.carve(4, 2, 9, 43); // open y2..44; shaft floor = rock at y45

  // The teaching corridor east from the shaft floor (open to the east edge).
  r.carve(12, 37, 34, 8); // x12..45, y37..44

  // The broken altar at the landing — collapse made visible (knee-high ruins;
  // the landing centre x7-9 stays clear).
  r.solid(5, 43, 1, 2, Sem.CRACKED); //  a snapped pillar stub
  r.solid(10, 44, 2, 1, Sem.CRACKED); // a fallen lintel
  r.solid(12, 42, 1, 3, Sem.CRACKED); // the doorway edge you walk out through

  // A ceiling outcrop with a side shelf — the optional EMBER perch. Reaching it
  // demands the double jump (feet row 44 → 40), the room's one skill ask.
  r.solid(29, 37, 2, 4); // the hanging rock mass (wall-attached, no floating island)
  r.solid(29, 41, 4, 1); // its shelf (top at y41; stand at feet row 40)

  // Teach → escalate: THE GRASPING DEPTHS (a recessed pit, not a surface scar).
  // The fallen claw up out of the dark to drag you down; leap the pit or be grabbed.
  // First a narrow pit (2 wide — hop it even from a walk), then the real jump
  // (4 wide — inside the ≤5-tile comfortable bound, with a clean run-up). Carved
  // DOWN through the floor so the hazard sits in a pit, hands reaching out of it.
  r.carve(24, 45, 2, 3); //  the teaching pit (x24-25, 2 deep)
  r.molten(24, 47, 2); //    the grasping depths at the bottom
  r.carve(35, 45, 4, 3); //  the escalation pit (x35-38, the real leap)
  r.molten(35, 47, 4);

  r.at('player', 8, 4); // the FALL — you enter the game falling

  // shaft torches: guttering waypoints you drop past
  r.at('torch', 5, 12);
  r.at('torch', 11, 22);
  r.at('torch', 5, 32);
  // the altar's flames still burn — grace was here first
  r.at('torch', 6, 44);
  r.at('torch', 10, 43);
  // corridor: each beat is lit before you commit
  r.at('torch', 23, 43); // the molten teach
  r.at('torch', 35, 43); // the escalation
  r.at('jar', 14, 44);
  r.at('runner', 20, 44); // the first foe — read it, roll through it
  r.at('runner', 42, 44); // guards the exit stretch past the wide scar
  r.at('ember', 31, 40); // the first Grace Ember, on the outcrop shelf

  r.link('east', 'descent');
  return r.build('first-fall');
}
