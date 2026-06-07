// Browser-local room overrides written by the in-engine editor. buildRoom()
// prefers an override when present, so edited rooms play immediately without a
// rebuild. Export (editor) produces the same JSON for folding into the repo.
import type { RoomData } from './roomData';

const PREFIX = 'repentance.room.';

export function loadRoomOverride(id: string): RoomData | null {
  try {
    const raw = localStorage.getItem(PREFIX + id);
    if (!raw) return null;
    const data = JSON.parse(raw) as RoomData;
    if (!data || !Array.isArray(data.tiles) || !Array.isArray(data.spawns)) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveRoomOverride(id: string, room: RoomData): void {
  try {
    localStorage.setItem(PREFIX + id, JSON.stringify({ ...room, id }));
  } catch {
    /* quota/availability — non-fatal in the editor */
  }
}

export function clearRoomOverride(id: string): void {
  try {
    localStorage.removeItem(PREFIX + id);
  } catch {
    /* ignore */
  }
}

export function hasRoomOverride(id: string): boolean {
  try {
    return localStorage.getItem(PREFIX + id) != null;
  } catch {
    return false;
  }
}
