import type { RoomData } from './roomData';
import { allRoomIds, buildRoom, START_ROOM } from './levelGraph';

export type Severity = 'error' | 'note';
export interface RoomWarning {
  level: Severity;
  msg: string;
}

const DIRS = ['east', 'west', 'up', 'down'] as const;
const OPP = { east: 'west', west: 'east', up: 'down', down: 'up' } as const;

/** Static fairness/integrity checks over RoomData + the room graph — surfaced live
 *  in the editor so the Level Design Bible's structural rules enforce themselves
 *  while authoring (the higher-leverage version of a smoke test). `error` = a
 *  🔴 non-negotiable; `note` = a 🟢 guideline worth a look. See docs/LEVEL_DESIGN.md. */
export function validateRoom(room: RoomData): RoomWarning[] {
  const ids = new Set(allRoomIds());
  const out: RoomWarning[] = [];
  const err = (msg: string) => out.push({ level: 'error', msg });
  const note = (msg: string) => out.push({ level: 'note', msg });
  const id = room.id;
  const saved = !!id && ids.has(id); // graph checks only make sense for a saved room

  // --- doors: target exists + entry door exists (🔴 #10) ----------------
  const doors = room.spawns.filter((s) => s.type === 'door');
  for (const d of doors) {
    const label = d.id ? `door '${d.id}'` : `door @${d.tx},${d.ty}`;
    if (!d.to) {
      err(`${label}: no target room`);
      continue;
    }
    if (!ids.has(d.to)) {
      err(`${label} → unknown room '${d.to}'`);
      continue;
    }
    if (d.toEntry && !buildRoom(d.to).spawns.some((s) => s.type === 'door' && s.id === d.toEntry)) {
      err(`${label} → '${d.to}' has no door id '${d.toEntry}'`);
    }
  }

  // --- edge links: target exists + reciprocity (🔴 #10) -----------------
  const links = room.links ?? {};
  for (const dir of DIRS) {
    const to = links[dir];
    if (!to) continue;
    if (!ids.has(to)) {
      err(`link ${dir} → unknown room '${to}'`);
      continue;
    }
    if (saved && buildRoom(to).links?.[OPP[dir]] !== id) {
      note(`link ${dir} → '${to}' isn't mirrored ('${to}' ${OPP[dir]} should point back) — one-way edge`);
    }
  }

  // --- sanity -----------------------------------------------------------
  const players = room.spawns.filter((s) => s.type === 'player').length;
  if (players > 1) err(`${players} player spawns (expected 1)`);
  if (room.spawns.filter((s) => s.type === 'gate').length > 1) note('more than one gate in this room');
  for (const s of room.spawns) {
    if (s.tx < 0 || s.tx >= room.w || s.ty < 0 || s.ty >= room.h) err(`${s.type} spawn out of bounds @${s.tx},${s.ty}`);
  }
  if (id === START_ROOM && players === 0) err('start room has no player spawn');

  // --- reachability + dead-ends (graph; saved rooms only) ---------------
  if (saved && id) {
    const connections = DIRS.filter((d) => links[d]).length + doors.length;
    const hasReward = room.spawns.some((s) => s.type === 'key' || s.type === 'gate');

    let referenced = id === START_ROOM || players > 0;
    if (!referenced) {
      for (const other of ids) {
        if (other === id) continue;
        const r = buildRoom(other);
        if (DIRS.some((d) => r.links?.[d] === id) || r.spawns.some((s) => s.type === 'door' && s.to === id)) {
          referenced = true;
          break;
        }
      }
    }
    if (!referenced) err('unreachable: nothing links here and no player spawn');
    if (connections <= 1 && !hasReward && id !== START_ROOM) {
      note(`possible dead end: ${connections} connection(s) and no key/gate reward (🔴 #5)`);
    }
  }

  return out;
}
