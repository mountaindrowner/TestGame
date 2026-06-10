import { RoomData } from '../roomData';
import { Room } from './build';

// Branch (closed) — THE HIDDEN VAULT: BIO-01's planted Grace-Burst gate. The door
// in the crossroads nook is reachable from the first visit; what's inside is not:
// a wide molten lake under a LOW ceiling (the dropped roof flattens any jump arc),
// crossable only with the air-dash earned from the Warden. Come back here. The
// treasure shelf beyond pays an EMBER + urns. Falling in burns but never kills —
// you can always retreat (no softlock). Feet row = 11.
export function vault(): RoomData {
  const r = new Room('THE HIDDEN VAULT', 36, 14).fill();

  r.carve(2, 5, 32, 7); //  the chamber: open y5..11, floor rock y12+
  r.carve(3, 12, 3, 2); //  seamless: you climb UP into the near shore through this floor hole
  r.solid(8, 5, 14, 3); //  the dropped ceiling over the lake (passage y8-11 = jump arc capped)
  r.molten(8, 11, 14); //   the lake (x8-21) — too wide for any capped jump; Grace Burst crosses

  r.at('torch', 6, 11); //  the near shore
  r.at('torch', 24, 11); // the far shore — visible across the lake (the tease)
  r.at('ember', 28, 11); // the prize
  r.at('jar', 26, 11);
  r.at('jar', 31, 11);
  r.link('down', 'crossroads'); // climb up from the crossroads nook; drop back down anytime
  return r.build('vault');
}
