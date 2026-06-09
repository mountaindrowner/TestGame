import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 3 — open both sides (descent ↔ gate). A deliberate ↑ door drops to
// the buried-memory branch (central, so you don't trigger it just passing through).
export function crossroads(): RoomData {
  const r = new Room('THE CROSSROADS', 58, 20).frame({ left: true, right: true });
  r.solid(22, 12, 12, 2); // central ledge
  r.platform(12, 15, 5);
  r.platform(42, 15, 5);

  r.at('spark', 28, 8); // airborne harasser
  r.at('runner', 16, 16);
  r.at('archer', 48, 16); // ranged: looses bolts down the spine — close the gap or weave
  r.at('door', 29, 16, { id: 'cross-mem', to: 'memory', toEntry: 'from-cross' });
  r.at('torch', 6, 16);
  r.at('torch', 52, 16);
  r.at('jar', 10, 16);
  r.at('jar', 47, 16);

  r.link('west', 'descent');
  r.link('east', 'gate');
  return r.build('crossroads');
}
