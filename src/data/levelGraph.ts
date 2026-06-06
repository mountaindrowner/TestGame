import { RoomData, buildFirstFall } from './roomData';
import { descent } from './rooms/descent';
import { crossroads } from './rooms/crossroads';
import { memory } from './rooms/memory';
import { gate } from './rooms/gate';

/** BIO-01 "The First Fall" as a small connected level. Rooms are linked by their
 *  door spawns (door.to + door.toEntry); this just maps ids → builders. */
export const START_ROOM = 'first-fall';

const BUILDERS: Record<string, () => RoomData> = {
  'first-fall': () => ({ ...buildFirstFall(), id: 'first-fall' }),
  descent,
  crossroads,
  memory,
  gate,
};

export function buildRoom(id: string): RoomData {
  return (BUILDERS[id] ?? BUILDERS[START_ROOM])();
}
