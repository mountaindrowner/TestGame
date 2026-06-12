// ─────────────────────────────────────────────────────────────────────────────
// THE TRAVERSAL GATE — the third validator, and the one that walks the TILES.
//
//   roomValidate   = the map GRAPH is sound (doors/links/reachability-by-id)
//   scoreValidate  = the EXPERIENCE is sound (beats/locks/pacing — the plan)
//   traverseValidate (this) = the GEOMETRY is sound — a player with our real
//   movement numbers can actually walk it, nothing is sealed off, nothing is a
//   one-way trap pocket, and the critical path isn't a flat featureless walk.
//
// Born from a live playtest softlock: a sealed ember nook in THE LOWER VAULTS
// passed every other gate (the plan was fine, the graph was fine) because no
// check ever simulated MOVING through the level. This one does: a coarse
// physics-aware flood fill over standable cells using the movement caps from
// docs/LEVEL_DESIGN.md Appendix A (kept conservative — required paths must be
// comfortable, not pixel-perfect, 🔴#2).
// ─────────────────────────────────────────────────────────────────────────────

import { Sem } from './assetManifest';
import { composeWorld } from './worldComposer';
import type { Spawn } from './roomData';

export type Severity = 'error' | 'note';
export interface TraverseWarning {
  level: Severity;
  msg: string;
}

// Movement caps in TILES — conservative "required path" numbers (App. A: single
// jump 3.3 up / ~6 across max → required ≤ 4 across; double-jump ~5.9 up → ≤ 5).
const UP_MAX = 6; //          double-jump (~5.9) + the auto-mantle grabbing the lip (proven on the memory climb)
const GAP_MAX = 5; //         required gap cap (≤5 with a clear run-up, App. A)
const GAP_MAX_BURST = 8; //   with the Grace Burst air-dash (optional detours only)

interface Grid {
  w: number;
  h: number;
  open: (x: number, y: number) => boolean;
  standable: (x: number, y: number) => boolean; // open with support below
}

function gridOf(tiles: number[][], w: number, h: number): Grid {
  const solid = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return true;
    const c = tiles[y][x];
    return c === Sem.SOLID || c === Sem.CRACKED;
  };
  const open = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    const c = tiles[y][x];
    // molten is passable (burns, never kills #4); one-way PLATFORMS are passable
    // from below/the sides (they only collide on top) — they are support, not wall.
    return c === Sem.EMPTY || c === Sem.MOLTEN || c === Sem.PLATFORM;
  };
  // The figure is ~2 tiles tall: a standable cell needs its own + head clearance.
  const support = (x: number, y: number) => {
    if (x < 0 || x >= w || y < 0 || y >= h) return true;
    const c = tiles[y][x];
    return solid(x, y) || c === Sem.MOLTEN || c === Sem.PLATFORM; // molten + platform tops hold you
  };
  const standable = (x: number, y: number) => open(x, y) && open(x, y - 1) && support(x, y + 1);
  return { w, h, open, standable };
}

/** All standable cells reachable from `starts`, with the given gap reach.
 *  Moves: walk/step (±1 col, up to 1 up / any drop), jump up ≤ UP_MAX through a
 *  clear column, horizontal jump over a gap ≤ gapMax (needs air clearance), and
 *  falling any depth (landing on the first support). */
function reachable(g: Grid, starts: Array<{ x: number; y: number }>, gapMax: number): Set<number> {
  const key = (x: number, y: number) => y * g.w + x;
  const seen = new Set<number>();
  const queue: Array<{ x: number; y: number }> = [];
  const push = (x: number, y: number) => {
    if (!g.standable(x, y)) return;
    const k = key(x, y);
    if (!seen.has(k)) {
      seen.add(k);
      queue.push({ x, y });
    }
  };
  const landFrom = (x: number, yTop: number) => {
    // fall straight down from (x, yTop) to the first standable cell
    for (let y = yTop; y < g.h - 1; y++) {
      if (!g.open(x, y)) return; // hit a ceiling-side wall — no landing here
      if (g.standable(x, y)) return push(x, y);
    }
  };
  for (const s of starts) {
    if (g.standable(s.x, s.y)) push(s.x, s.y);
    else landFrom(s.x, s.y); // a mid-air start (the opening fall) drops to ground
  }
  while (queue.length) {
    const { x, y } = queue.shift()!;
    for (const dx of [-1, 1]) {
      const nx = x + dx;
      // walk / step up 1 (needs headroom in the column you rise through)
      if (g.standable(nx, y)) push(nx, y);
      else if (g.standable(nx, y - 1) && g.open(x, y - 1) && g.open(x, y - 2)) push(nx, y - 1);
      // walk off the edge → fall to landing
      else if (g.open(nx, y) && g.open(nx, y - 1)) landFrom(nx, y);
    }
    // jump straight/diagonally up through a clear column, then mantle aside
    for (let up = 2; up <= UP_MAX; up++) {
      let clear = true;
      for (let i = 1; i <= up; i++) {
        if (!g.open(x, y - i)) {
          clear = false;
          break;
        }
      }
      if (!clear) break;
      const drift = up <= 3 ? 2 : 1; // short hops steer wider (real air control)
      for (let dx = -drift; dx <= drift; dx++) {
        push(x + dx, y - up); // push() validates standability (incl. head clearance)
      }
    }
    // RISING gap jump (up-and-across onto a shelf) — the parkour staple
    for (const dir of [-1, 1]) {
      for (let up = 1; up <= 4; up++) {
        for (let d = 2; d <= (up <= 2 ? (gapMax >= 8 ? 8 : 5) : 3); d++) { // burst kit dashes rising gaps; up 3-4 keeps d≤3
          const nx = x + dir * d;
          const ny = y - up;
          if (!g.standable(nx, ny)) continue;
          // own column clear to jump height + the air lane at landing height
          let clear = true;
          for (let i = 1; i <= up + 1; i++) if (!g.open(x, y - i)) clear = false;
          for (let i = 1; i <= d && clear; i++) if (!g.open(x + dir * i, ny) || !g.open(x + dir * i, ny - 1)) clear = false;
          if (clear) push(nx, ny);
        }
      }
    }
    // horizontal jump over a gap (same height or lower landing), needs air lane
    for (const dir of [-1, 1]) {
      for (let d = 2; d <= gapMax; d++) {
        const nx = x + dir * d;
        if (nx < 0 || nx >= g.w) break;
        // the lane two tiles above the feet must be clear the whole way
        let lane = true;
        for (let i = 1; i <= d; i++) {
          if (!g.open(x + dir * i, y - 1) || !g.open(x + dir * i, y - 2)) {
            lane = false;
            break;
          }
        }
        if (!lane) break;
        if (g.standable(nx, y)) push(nx, y);
        else if (g.open(nx, y)) landFrom(nx, y);
      }
    }
  }
  return seen;
}

function pathMetricsPath(g: Grid, from: { x: number; y: number }, reach: Set<number>, to: { x: number; y: number }) {
  const m = pathMetrics(g, from, reach, to);
  return m ? { path: m.path, rise: m.rise } : undefined;
}

/** Shortest path lengths (BFS over the same move set) — used for journey metrics. */
function pathMetrics(g: Grid, from: { x: number; y: number }, reach: Set<number>, to: { x: number; y: number }) {
  // BFS storing parents over reachable standable cells using walk+jump moves —
  // we reuse `reachable`'s rules implicitly by only stepping between cells that
  // are both in `reach` and within a move's distance. Coarse but honest.
  const key = (x: number, y: number) => y * g.w + x;
  const prev = new Map<number, number>();
  const start = key(from.x, from.y);
  const q = [start];
  const seen = new Set<number>([start]);
  const neighbors = (k: number) => {
    const x = k % g.w;
    const y = Math.floor(k / g.w);
    const out: number[] = [];
    for (let nx = Math.max(0, x - GAP_MAX); nx <= Math.min(g.w - 1, x + GAP_MAX); nx++) {
      for (let ny = Math.max(0, y - UP_MAX); ny < g.h; ny++) {
        if (nx === x && ny === y) continue; // (bounds-clamped: a negative nx would WRAP into the previous row)
        const nk = key(nx, ny);
        if (!reach.has(nk)) continue;
        const ddx = Math.abs(nx - x);
        const ddy = ny - y; // + = down
        if (ddx <= 1 && ddy >= -1) out.push(nk); // walk/step/fall-adjacent
        else if (ddx <= 1 && ddy >= -UP_MAX) out.push(nk); // jump straight up
        else if (ddx <= 3 && ddy >= -4) out.push(nk); // rising DIAGONAL hop (the switchback ledge)
        else if (ddx <= GAP_MAX && ddy >= 0) out.push(nk); // gap jump (level/lower)
        else if (ddx <= GAP_MAX && ddy >= -2) out.push(nk); // slight rising gap
      }
    }
    return out;
  };
  while (q.length) {
    const k = q.shift()!;
    if (k === key(to.x, to.y)) break;
    for (const n of neighbors(k)) {
      if (!seen.has(n)) {
        seen.add(n);
        prev.set(n, k);
        q.push(n);
      }
    }
  }
  const path: Array<{ x: number; y: number }> = [];
  let cur: number | undefined = key(to.x, to.y);
  if (!seen.has(cur)) return undefined;
  while (cur !== undefined) {
    path.unshift({ x: cur % g.w, y: Math.floor(cur / g.w) });
    cur = prev.get(cur);
  }
  let rise = 0;
  let flatRun = 0;
  let maxFlat = 0;
  for (let i = 1; i < path.length; i++) {
    const dy = Math.abs(path[i].y - path[i - 1].y);
    const dx = Math.abs(path[i].x - path[i - 1].x);
    rise += dy;
    if (dy === 0 && dx <= 1) flatRun += dx; // strolling
    else {
      maxFlat = Math.max(maxFlat, flatRun); // a jump or climb breaks the monotony
      flatRun = 0;
    }
  }
  maxFlat = Math.max(maxFlat, flatRun);
  const span = Math.abs(path[path.length - 1].x - path[0].x) || 1;
  return { tiles: path.length, span, verticalRatio: rise / span, maxFlat, rise, path };
}

/** Validate the composed environment's GEOMETRY. */
export function validateTraversal(envId: string, assumed: string[] = []): TraverseWarning[] {
  const out: TraverseWarning[] = [];
  const err = (msg: string) => out.push({ level: 'error', msg });
  const note = (msg: string) => out.push({ level: 'note', msg });
  let world;
  try {
    world = composeWorld(envId);
  } catch (e) {
    err(`could not compose '${envId}': ${(e as Error).message}`);
    return out;
  }
  const g = gridOf(world.tiles, world.w, world.h);
  const roomAt = (x: number, y: number) =>
    world.placements.find((p) => x >= p.ox && x < p.ox + p.w && y >= p.oy && y < p.oy + p.h)?.id ?? '?';

  // start = the player spawn (or the first entry)
  const ps = world.spawns.find((s) => s.type === 'player');
  const start = ps ? { x: ps.tx, y: ps.ty } : { x: 3, y: world.h - 4 };
  const base = reachable(g, [start], GAP_MAX);
  const burst = reachable(g, [start], GAP_MAX_BURST);
  const k = (x: number, y: number) => y * g.w + x;

  // ── 1) BLOCKED OFF: every meaningful spawn must be reachable ──────────────
  // Targets stand ON ground near their tile; probe a small neighbourhood.
  const probe = (s: Spawn, set: Set<number>) => {
    for (let dy = 0; dy <= 6; dy++)
      for (let dx = -2; dx <= 2; dx++) if (set.has(k(s.tx + dx, s.ty + dy))) return true;
    return false;
  };
  const hasBurst = assumed.includes('grace-burst');
  const kit = hasBurst ? burst : base; //   the kit the player provably carries here
  const kitName = hasBurst ? 'carried kit (incl. Grace Burst)' : 'base kit';
  const required: Spawn[] = world.spawns.filter((s) => ['key', 'gate', 'door', 'guardian', 'mirrorboss', 'accuser'].includes(s.type));
  for (const s of required) {
    if (!probe(s, kit)) err(`'${s.type}' in ${roomAt(s.tx, s.ty)} @${s.tx},${s.ty} is UNREACHABLE on the ${kitName} — the path is blocked (🔴#4)`);
  }
  for (const s of world.spawns.filter((q) => q.type === 'ember')) {
    if (!probe(s, burst)) err(`ember in ${roomAt(s.tx, s.ty)} @${s.tx},${s.ty} is UNREACHABLE even with the Grace Burst — a planted reward that can't be earned (🔴#5)`);
  }

  // ── 2) TRAP POCKETS: from anywhere you can reach, you must be able to get
  //      back to the start's region (no one-way pits/pockets — 🔴#4) ─────────
  // Cheap inverse test: from each reachable cell, can the start be re-reached?
  // Approximate by reverse-reachability: cells that can reach `start` =
  // reachable(g, [cell]) ∋ start — too dear per-cell, so test the EXTREMES:
  // the lowest cell of every isolated floor pocket. Pockets = group reachable
  // cells by flood regions of mutual reach against a sample.
  const backOk = new Set<number>();
  const samples: Array<{ x: number; y: number }> = [];
  kit.forEach((kk) => {
    const x = kk % g.w;
    const y = Math.floor(kk / g.w);
    if (samples.length < 400 && (x + y) % 3 === 0) samples.push({ x, y });
  });
  // run ONE reverse flood from the start over inverted moves — equivalently:
  // forward-reach from every exit-ish anchor; we anchor on the start + all door/gate cells.
  const anchors = [start, ...required.map((s) => ({ x: s.tx, y: s.ty }))];
  // a cell can "get home" if a forward flood from IT reaches an anchor; testing
  // every cell is O(n²) — instead flood from each anchor with INVERTED gravity
  // moves is complex, so use the pragmatic version: test each distinct floor
  // POCKET (a maximal run of standable cells at one height with walls both ends).
  const tested = new Set<number>();
  kit.forEach((kk) => {
    const x = kk % g.w;
    const y = Math.floor(kk / g.w);
    if (tested.has(kk)) return;
    // find this pocket's horizontal extent
    let lo = x;
    let hi = x;
    while (g.standable(lo - 1, y)) lo--;
    while (g.standable(hi + 1, y)) hi++;
    for (let i = lo; i <= hi; i++) tested.add(k(i, y));
    const mid = { x: Math.floor((lo + hi) / 2), y };
    const back = reachable(g, [mid], hasBurst ? GAP_MAX_BURST : GAP_MAX);
    const home = anchors.some((a) => {
      for (let dy = 0; dy <= 6; dy++) for (let dx = -2; dx <= 2; dx++) if (back.has(k(a.x + dx, a.y + dy))) return true;
      return false;
    });
    if (!home) {
      err(`TRAP POCKET in ${roomAt(mid.x, mid.y)} @${lo}-${hi},${y}: you can get in but never back out (softlock, 🔴#4)`);
      backOk.delete(kk);
    }
  });

  // ── 3) SEALED VOIDS: open pockets no movement can reach — either dead space
  //      or (worse) somewhere the ledge-mantle can dump the player ───────────
  const sealedSeen = new Set<number>();
  for (let y = 1; y < g.h - 1; y++) {
    for (let x = 1; x < g.w - 1; x++) {
      if (!g.standable(x, y) || base.has(k(x, y)) || burst.has(k(x, y)) || sealedSeen.has(k(x, y))) continue;
      if (world.tiles[y][x] === Sem.MOLTEN) continue; // nobody rests in lava — not a pocket
      let lo = x;
      let hi = x;
      while (g.standable(lo - 1, y)) lo--;
      while (g.standable(hi + 1, y)) hi++;
      for (let i = lo; i <= hi; i++) sealedSeen.add(k(i, y));
      note(`sealed pocket in ${roomAt(x, y)} @${lo}-${hi},${y}: open floor no jump can reach — dead space, or a mantle-trap (give it a way in/out or fill it)`);
    }
  }

  // ── 4) THE JOURNEY: the critical path shouldn't be a flat featureless walk ─
  const finale = world.spawns.find((s) => s.type === 'gate') ?? world.spawns.find((s) => ['guardian', 'mirrorboss', 'accuser'].includes(s.type));
  if (finale && probe(finale, kit)) {
    // nearest standable to each end
    const near = (s: { x: number; y: number }) => {
      for (let dy = 0; dy <= 8; dy++) for (let dx = 0; dx <= 3; dx++) for (const sx of [s.x + dx, s.x - dx]) if (kit.has(k(sx, s.y + dy))) return { x: sx, y: s.y + dy };
      return undefined;
    };
    const a = near(start);
    const b = near({ x: finale.tx, y: finale.ty });
    if (a && b) {
      const m = pathMetrics(g, a, kit, b);
      if (m) {
        if (m.verticalRatio < 0.08) note(`FLAT JOURNEY: the critical path climbs/drops only ${(m.verticalRatio * 100).toFixed(0)}% of its ${m.span}-tile span — it plays as a corridor walk; carve real elevation into it (WORLD_PLAN gradients)`);
        if (m.maxFlat > 26) note(`LONG FLAT STRETCH: ${m.maxFlat} tiles of level walking with no required jump/drop — break it up (a step, a gap, a drop; §3.9 density)`);
      }
    }
  }

  return out;
}

/** Dev: the measured critical path (for visualization / metric debugging). */
export function debugJourney(envId: string, assumed: string[] = []): { path: Array<{ x: number; y: number }>; rise: number } | undefined {
  const world = composeWorld(envId);
  const g = gridOf(world.tiles, world.w, world.h);
  const ps = world.spawns.find((s) => s.type === 'player') ?? world.spawns.find((s) => s.type === 'door');
  const start = ps ? { x: ps.tx, y: ps.ty } : { x: 3, y: world.h - 4 };
  const kit = reachable(g, [start], assumed.includes('grace-burst') ? GAP_MAX_BURST : GAP_MAX);
  const k = (x: number, y: number) => y * g.w + x;
  const finale = world.spawns.find((s) => s.type === 'gate');
  if (!finale) return undefined;
  const near = (s: { x: number; y: number }) => {
    // search the whole column downward (a mid-air start, e.g. the opening fall,
    // lands far below) and a few tiles to each side
    for (let dy = 0; dy < g.h; dy++) for (let dx = 0; dx <= 4; dx++) for (const sx of [s.x + dx, s.x - dx]) if (kit.has(k(sx, s.y + dy))) return { x: sx, y: s.y + dy };
    return undefined;
  };
  const a = near(start);
  const b = near({ x: finale.tx, y: finale.ty });
  if (!a || !b) return undefined;
  const m = pathMetricsPath(g, a, kit, b);
  return m;
}

/** One-line verdict for readouts. */
export function traversalVerdict(envId: string): string {
  const w = validateTraversal(envId);
  const e = w.filter((x) => x.level === 'error').length;
  const n = w.filter((x) => x.level === 'note').length;
  return `${e ? '✗' : '✓'} traversal ${e}E/${n}N`;
}
