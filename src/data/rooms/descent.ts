import { RoomData } from '../roomData';
import { Room } from './build';

// Room 2 — descending ledges; the impulse to keep falling. First real fights.
export function descent(): RoomData {
  const r = new Room('THE DESCENT', 48, 30).shell();
  r.solid(2, 8, 12, 2); // top-left landing (entry from the first fall)
  r.platform(16, 12, 5);
  r.solid(22, 15, 12, 2); // mid ledge
  r.platform(36, 18, 5);
  r.solid(30, 21, 10, 2);
  r.solid(4, 24, 12, 2); // lower-left ledge (exit shelf)

  r.at('door', 4, 7, { id: 'from-fall', to: 'first-fall', toEntry: 'exit' });
  r.at('door', 8, 23, { id: 'to-cross', to: 'crossroads', toEntry: 'from-descent' });
  r.at('runner', 28, 14);
  r.at('crawler', 34, 20);
  r.at('torch', 6, 7);
  r.at('torch', 40, 17);
  return r.build('descent');
}
