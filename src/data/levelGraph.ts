import { RoomData, buildFirstFall } from './roomData';
import { descent } from './rooms/descent';
import { crossroads } from './rooms/crossroads';
import { memory } from './rooms/memory';
import { gate } from './rooms/gate';
import { loadRoomOverride } from './roomStore';

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

/** All authored room ids (the editor's room picker lists these). */
export const ROOM_IDS = Object.keys(BUILDERS);

/** Resolve a room by id. A browser-local editor override wins over the built-in
 *  builder, so edits play immediately. */
export function buildRoom(id: string): RoomData {
  const override = loadRoomOverride(id);
  if (override) return { ...override, id };
  return (BUILDERS[id] ?? BUILDERS[START_ROOM])();
}
