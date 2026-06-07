import type { RoomData } from './roomData';
import { allRoomIds, buildRoom } from './levelGraph';

/** Static checks on a room's connections — surfaced live in the editor so broken
 *  links are caught at edit time (the higher-leverage version of a smoke test).
 *  Returns human-readable warnings; empty = clean. */
export function validateRoom(room: RoomData): string[] {
  const ids = new Set(allRoomIds());
  const warns: string[] = [];

  for (const d of room.spawns.filter((s) => s.type === 'door')) {
    const label = d.id ? `door '${d.id}'` : `door @${d.tx},${d.ty}`;
    if (!d.to) {
      warns.push(`${label}: no target room`);
      continue;
    }
    if (!ids.has(d.to)) {
      warns.push(`${label} → unknown room '${d.to}'`);
      continue;
    }
    if (d.toEntry) {
      const target = buildRoom(d.to);
      if (!target.spawns.some((s) => s.type === 'door' && s.id === d.toEntry)) {
        warns.push(`${label} → '${d.to}' has no door id '${d.toEntry}'`);
      }
    }
  }

  const links = room.links ?? {};
  for (const dir of ['east', 'west', 'up', 'down'] as const) {
    const to = links[dir];
    if (to && !ids.has(to)) warns.push(`link ${dir} → unknown room '${to}'`);
  }
  return warns;
}
