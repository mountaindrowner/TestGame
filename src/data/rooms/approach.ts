import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 3.5 — THE LONG APPROACH: BIO-01's breather (§3.6). A quiet, enemy-free
// vaulted colonnade you climb gently up through toward the light (continuing the
// spine's ascent), past two great hanging columns. Winding but gentle (the trough
// of the wave — 3-up steps, no combat). Seam mouths single-opening; the east mouth
// sits higher than the west (the climb toward the Warden's gate).
export function approach(): RoomData {
  const r = new Room('THE LONG APPROACH', 40, 22).fill();

  // ── low west arrival ─────────────────────────────────────────────────────────
  r.carve(0, 14, 14, 4); //   west mouth rows 14-17, x0-13 (floor row 18)
  // ── the vaulted colonnade you climb up through ───────────────────────────────
  r.carve(6, 4, 30, 14); //   the great vault (rows 4-17, x6-35)
  r.solid(11, 4, 2, 7); //    two ancient columns hang into the vault…
  r.solid(23, 4, 2, 7);
  r.solid(6, 15, 11, 1); //   step 1 — a broad rise from the west floor (stand row 14)
  r.solid(16, 12, 11, 1); //  step 2 — the colonnade landing (stand row 11)
  // ── higher east landing → the mouth toward the gate ──────────────────────────
  r.carve(26, 8, 14, 4); //   rows 8-11, x26-39 (east mouth; floor row 12 = step 2's level)

  // ── the torch line — walking up toward the light ─────────────────────────────
  r.at('torch', 4, 17);
  r.at('torch', 10, 14);
  r.at('torch', 21, 11);
  r.at('torch', 33, 11);
  r.at('jar', 9, 14);
  r.at('jar', 22, 11);

  r.link('west', 'crossroads');
  r.link('east', 'gate');
  return r.build('approach');
}
