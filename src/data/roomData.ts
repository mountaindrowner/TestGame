// Room data model: rooms hold SEMANTIC tile codes (the Autotiler turns them into
// edge-aware visual tiles) plus typed spawns and edge links. Authoring lives in
// src/data/rooms/* via the Room builder (build.ts).
export type SpawnType =
  | 'player'
  | 'door'
  | 'torch'
  | 'jar' // a breakable urn that sheds souls / a life orb
  | 'mirror' // House of Mirrors: a decorative ornate broken-mirror pane on the wall
  | 'key' // the Broken Memory pickup
  | 'ember' // a Grace Ember — run-scoped chosen boost (the in-level "scroll")
  | 'gate' // the locked exit gate (needs key + guardian down)
  | 'runner'
  | 'crawler'
  | 'spark'
  | 'striker'
  | 'guardian'
  | 'mirrorboss' // THE UNTRUE IMAGE — the House of Mirrors mini-boss (elite)
  // BIO-02 House of Mirrors roster
  | 'mirrorDouble'
  | 'reflectionHound'
  | 'glassWitch'
  | 'falseFace'
  | 'fractureWisp'
  | 'lookingGlass'
  | 'archer'
  | 'bomber'
  // BIO-03 Court of Condemnation — signature gimmicks (data-driven hazards)
  | 'gavel' //     a timed verdict-crusher: telegraph → slam to the floor → rest → rise
  | 'gaze' //      the verdict-gaze: a roaming spotlight; caught in it → a dodgeable strike
  | 'flameseal' // a barrier over a passage that only the Quiet Flame opens (BIO-03 come-back)
  | 'accuser'; //  THE ACCUSER — the Court's elite

export interface Spawn {
  type: SpawnType;
  tx: number;
  ty: number;
  id?: string; // door/gate identity within this room
  to?: string; // door/gate: destination room id
  toEntry?: string; // door/gate: id of the door to arrive at in the destination room
  scale?: number; // decor (mirror): render scale
  grant?: 'memory' | 'witness'; // key: which mark it grants (default 'memory')
  period?: number; // gavel: full cycle ms (default 2600)
  phase?: number; //  gavel: 0..1 cycle offset so rows of gavels alternate
  range?: number; //  gaze: sweep half-range in tiles (default 4)
}

export interface RoomData {
  name: string;
  id?: string; // room id (set by the level graph)
  w: number; // tiles
  h: number; // tiles
  tiles: number[][]; // [y][x] of Sem codes, -1 empty
  spawns: Spawn[];
  // Edge links: walking off this side enters the named room (seamless-ish travel).
  links?: { east?: string; west?: string; up?: string; down?: string };
  biome?: string; // tileset/background theme ('depths' default; 'mirrors' = House of Mirrors)
}
