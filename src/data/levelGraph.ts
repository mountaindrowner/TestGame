import { RoomData, buildFirstFall } from './roomData';
import { descent } from './rooms/descent';
import { crossroads } from './rooms/crossroads';
import { memory } from './rooms/memory';
import { gate } from './rooms/gate';
import { mirrorPreview } from './rooms/mirrorPreview';
import { catacombs } from './rooms/catacombs';
import { mirrorHall } from './rooms/mirrorHall';
import { mirrorGallery } from './rooms/mirrorGallery';
import { mirrorRise } from './rooms/mirrorRise';
import { mirrorThreshold } from './rooms/mirrorThreshold';
import { untrueImage } from './rooms/untrueImage';
import { loadRoomOverride, listOverrideRooms } from './roomStore';

/** BIO-01 "The First Fall" as a small connected level. Rooms are linked by their
 *  door spawns (door.to + door.toEntry); this just maps ids → builders. */
export const START_ROOM = 'first-fall';

const BUILDERS: Record<string, () => RoomData> = {
  'first-fall': () => ({ ...buildFirstFall(), id: 'first-fall' }),
  descent,
  crossroads,
  memory,
  gate,
  'mirror-preview': mirrorPreview,
  catacombs,
  // BIO-02 — the House of Mirrors (entered when the BIO-01 gate opens).
  'mirror-hall': mirrorHall,
  'mirror-gallery': mirrorGallery,
  'mirror-rise': mirrorRise,
  'mirror-threshold': mirrorThreshold,
  'untrue-image': untrueImage,
};

/** Built-in (code-authored) room ids. */
export const ROOM_IDS = Object.keys(BUILDERS);

/** True when a room has a code builder (vs an editor-created override-only room). */
export function isBuiltInRoom(id: string): boolean {
  return id in BUILDERS;
}

/** Every room the editor can open: built-ins + browser-saved (incl. new) rooms. */
export function allRoomIds(): string[] {
  return Array.from(new Set([...ROOM_IDS, ...listOverrideRooms()])).sort();
}

/** Resolve a room by id. A browser-local editor override wins over the built-in
 *  builder, so edits play immediately. */
export function buildRoom(id: string): RoomData {
  const override = loadRoomOverride(id);
  if (override) return { ...override, id };
  return (BUILDERS[id] ?? BUILDERS[START_ROOM])();
}
