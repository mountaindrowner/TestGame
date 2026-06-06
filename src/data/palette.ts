// The locked palette (see DECISIONS.md). Dark silhouettes, neon grace accents.
// Phaser wants 0xRRGGBB numbers; keep hex strings alongside for clarity.
export const Palette = {
  bgDeep: 0x0a0a12,
  bgMid: 0x12101f,
  stone: 0x2a2740,
  stoneHi: 0x3a3556,
  molten: 0xff5a2c,
  moltenHi: 0xff9d3a,
  grace: 0x7ef0ff, // cyan light of grace
  bloom: 0xeaf7ff,
  blood: 0xff3b5c,
  shadow: 0x05050a,
} as const;

export type PaletteKey = keyof typeof Palette;
