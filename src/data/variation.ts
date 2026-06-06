// Canonical deterministic variation — the executable form of docs/ART_VARIATION.md.
//
// "Organic" here = (1) logical placement and (2) deterministic-but-unique results.
// Everything in this file is a PURE function of integer world position (+ a salt),
// so the same cell ALWAYS looks the same across loads, yet no two places correlate
// and nothing repeats in a visibly stamped way.
//
// RULE: never use Math.random() for world art. Seed all variation from position.
// Use a different `salt` per decision (moss vs cracks vs variant) so independent
// choices don't line up. The Python generators mirror `vhash` (see tools/common.py).

/** 32-bit position hash → float in [0, 1). Stable forever for a given (x,y,salt). */
export function vhash(x: number, y: number, salt = 0): number {
  let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(salt | 0, 2246822519)) >>> 0;
  n = Math.imul(n ^ (n >>> 13), 1274126177) >>> 0;
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

/** True with probability `p` at this cell (independent per salt). */
export function chance(x: number, y: number, p: number, salt = 0): boolean {
  return vhash(x, y, salt) < p;
}

/** Deterministic pick from a list at this cell. */
export function pick<T>(x: number, y: number, items: readonly T[], salt = 0): T {
  return items[Math.min(items.length - 1, Math.floor(vhash(x, y, salt) * items.length))];
}

/** Deterministic value in [min, max). `bias` > 1 skews toward min (e.g. heights:
 *  many small, a few large); bias < 1 skews toward max. */
export function range(x: number, y: number, min: number, max: number, salt = 0, bias = 1): number {
  const v = bias === 1 ? vhash(x, y, salt) : Math.pow(vhash(x, y, salt), bias);
  return min + v * (max - min);
}

/** Smooth, low-frequency undulation in [0,1] — for surfaces that should flow
 *  (cave roofs, dunes) rather than jitter. Combine with vhash for fine grain. */
export function wave(x: number, phase = 0, freq = 0.5): number {
  return 0.5 + 0.5 * (0.6 * Math.sin(x * freq + phase) + 0.4 * Math.sin(x * freq * 0.4 + phase * 1.7));
}

/** Dampness/age gradient 0..1: lower in a room is damper & more overgrown. Drives
 *  moss/calcite/stain density so moisture pools where it logically would. */
export function dampness(tileY: number, roomH: number): number {
  return Math.min(1, Math.max(0, tileY / Math.max(1, roomH - 1)));
}
