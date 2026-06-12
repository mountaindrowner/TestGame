import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 3 — THE CROSSROADS, re-cut as a WINDING branch HUB. You climb in from
// the low west, up a shaft into the central junction; from there three ways open —
// **down** through THE PIT to the buried memory, **up** the nook shaft to the
// Hidden Vault, and **east** (over the pit) toward the Warden's approach. The spark
// owns the open air of the junction. Tunnels through rock; the through-path climbs
// west→east (the spine keeps ascending). Seam mouths single-opening; verified by
// the traversal gate (the down/up branches reachable + returnable).
export function crossroads(): RoomData {
  const r = new Room('THE CROSSROADS', 56, 26).fill();

  // ── low west arrival + the climb into the junction ───────────────────────────
  r.carve(0, 18, 16, 4); //   west mouth rows 18-21, x0-15
  r.climbShaft(13, 8, 21); // x11-15, rows 8-21 — climb up to the hub

  // ── THE JUNCTION — the central hub corridor (floor row 13), open to the east ─
  r.carve(8, 8, 48, 5); //    rows 8-12, x8-55 (reaches the east edge = the mouth)
  r.solid(18, 11, 6, 2); //   a raised plinth mid-junction — go up and over it…
  r.solid(17, 12, 1, 1); //   …stepped both ends so it's a beat, not a wall
  r.solid(24, 12, 1, 1);

  // ── THE PIT — down through the junction floor to A BURIED MEMORY (or jump it) ─
  // A LADDERED shaft (not a smooth hole): you can drop in for the Memory AND climb
  // back out — its footholds continue memory's own climb shaft across the seam, so
  // the column is climbable end-to-end. (Same width/centre as memory's shaft so the
  // compositor stacks them perfectly.) The 4-wide mouth at the top still jumps clean.
  r.climbShaft(29, 13, 25); //  x27-31, rows 13-25 → the bottom-edge opening (down link)
  r.solid(27, 24, 2, 1); //     a bridging foothold near the bottom of the pit, so the
  //                            ladder continues across the room seam into memory's shaft
  //                            (climbShaft leaves a margin at each end; two shafts meeting
  //                            would otherwise leave a >6-tile dead gap = a one-way drop)

  // ── THE NOOK SHAFT — up out of the junction to THE HIDDEN VAULT ──────────────
  r.climbShaft(42, 0, 12); // x40-44, rows 0-12 → the top-edge opening (up link)

  // ── enemies of the hub ───────────────────────────────────────────────────────
  r.at('runner', 11, 21); //  meets you in the low west
  r.at('spark', 22, 6); //    owns the junction's open air
  r.at('archer', 47, 12); //  looses bolts down the east approach

  // ── flavour ──────────────────────────────────────────────────────────────────
  r.at('torch', 6, 21);
  r.at('torch', 21, 12);
  r.at('torch', 36, 12);
  r.at('torch', 42, 4);
  r.at('jar', 10, 21);
  r.at('jar', 35, 12);
  r.at('jar', 47, 12);

  r.link('west', 'descent');
  r.link('east', 'approach'); // the quiet torch-lit hall before the Warden (the breather)
  r.link('down', 'memory'); //  drop through the pit into A BURIED MEMORY
  r.link('up', 'vault'); //     climb the nook shaft up into THE HIDDEN VAULT
  return r.build('crossroads');
}
