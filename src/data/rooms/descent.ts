import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 2 — THE LOWER VAULTS, re-cut as a SWITCHBACK ASCENT through carved
// catacomb passages (Dead-Cells winding). You arrive low at the west, fight east
// along the bottom tier, climb a laddered shaft, double BACK west along the middle
// tier, climb again, and run east along the top tier to the exit — netting a real
// climb out of the depths (the spine ascends, per WORLD_PLAN). A one-way chute
// drops the top straight back to the bottom (the loop). Tunnels through solid rock,
// not ledges in a void. Verified by the traversal gate.
export function descent(): RoomData {
  const r = new Room('THE LOWER VAULTS', 54, 30).fill();

  // ── T1  bottom tier — arrival from the west, fight east ──────────────────────
  r.carve(0, 22, 32, 4); //   rows 22-25, x0-31 (west mouth + floor row 26)
  // ── climb 1 — laddered shaft up at T1's east end ─────────────────────────────
  r.climbShaft(29, 13, 25); // x27-31, rows 13-25
  // ── T2  middle tier — switchback WEST ────────────────────────────────────────
  r.carve(6, 13, 26, 4); //   rows 13-16, x6-31
  // ── climb 2 — shaft up at T2's west end ──────────────────────────────────────
  r.climbShaft(9, 4, 16); //  x7-11, rows 4-16
  // ── T3  top tier — run EAST to the exit (east mouth at rows 4-7) ──────────────
  r.carve(6, 4, 48, 4); //    rows 4-7, x6-53

  // ── THE EMBER PERCH — an optional jump up off T3, highest + riskiest ─────────
  r.carve(20, 0, 10, 4); //   a pocket above T3 (rows 0-3, x20-29)
  r.solid(21, 3, 8, 1); //    its floor (stand row 2) — reached by a 5-up hop from T3

  // ── a sunken soul-pocket dips below T1 (drop in, hop out) ─────────────────────
  r.carve(13, 26, 6, 2);

  // ── enemies along the three tiers ────────────────────────────────────────────
  r.at('runner', 16, 25); //  T1 — read its lunge as you land
  r.at('crawler', 20, 15); // T2 — the switchback hunter
  r.at('runner', 26, 25); //  T1 east, guarding climb 1
  r.at('spark', 34, 6); //    harasses the top run from the open vault

  // ── reward + flavour ─────────────────────────────────────────────────────────
  r.at('ember', 25, 2); //    the GRACE EMBER in the high pocket (risk/reward, §3.5)
  r.at('jar', 15, 27); //     in the soul-pocket
  r.at('jar', 38, 6);
  r.at('jar', 12, 15);
  r.at('torch', 6, 25);
  r.at('torch', 30, 15);
  r.at('torch', 10, 6);
  r.at('torch', 49, 6);
  r.at('torch', 25, 2);

  r.link('west', 'first-fall');
  r.link('east', 'crossroads');
  return r.build('descent');
}
