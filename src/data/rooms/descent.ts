import { RoomData } from '../roomData';
import { Room } from './build';

// Spine room 2 — open both sides; walk right to keep going right. Floor feet row 16.
export function descent(): RoomData {
  const r = new Room('THE DESCENT', 60, 20).frame({ left: true, right: true });
  r.platform(16, 12, 6);
  r.platform(30, 10, 6);
  r.platform(44, 12, 6);
  r.solid(50, 14, 7, 1);

  r.at('runner', 18, 16);
  r.at('crawler', 38, 16);
  r.at('runner', 52, 16);
  r.at('torch', 8, 16);
  r.at('torch', 46, 11);

  r.link('west', 'first-fall');
  r.link('east', 'crossroads');
  return r.build('descent');
}
