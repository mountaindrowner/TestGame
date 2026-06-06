// Gameplay capture: drives the REAL game with scripted keyboard input and saves
// PNG frames (stitched into a GIF by tools/make_gif.py — no ffmpeg needed).
// Requires the dev server on :5173.
import { chromium } from 'playwright';
import { mkdirSync, rmSync } from 'node:fs';

const URL = process.env.URL || 'http://localhost:5173';
const OUT = '/tmp/play';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const EXE = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(URL, { waitUntil: 'load' });
await page.mouse.click(480, 270); // focus + satisfy audio autoplay
await page.waitForFunction(() => window.__GAME_READY === true, { timeout: 15000 });
await page.waitForTimeout(700); // let the title fade

// A lively run: idle -> run -> jump -> slash combo -> dash -> engage enemies.
// `hold` = keys held through the step; `tap` = pressed once at the step start.
const TL = [
  { hold: [], tap: [], n: 4 },
  { hold: ['KeyD'], n: 14 },
  { hold: ['KeyD'], tap: ['Space'], n: 12 },
  { hold: ['KeyD'], n: 8 },
  { hold: [], tap: ['KeyX'], n: 3 },
  { hold: [], tap: ['KeyX'], n: 3 },
  { hold: ['KeyD'], tap: ['ShiftLeft'], n: 7 },
  { hold: ['KeyD'], n: 10 },
  { hold: [], tap: ['KeyX'], n: 4 },
  { hold: ['KeyD'], tap: ['Space'], n: 10 },
  { hold: ['KeyD'], n: 8 },
  { hold: [], tap: ['KeyX'], n: 3 },
  { hold: [], tap: ['KeyX'], n: 3 },
  { hold: ['KeyA'], tap: ['ShiftLeft'], n: 7 }, // dash back through an enemy
  { hold: [], tap: ['KeyX'], n: 4 },
  { hold: [], n: 6 },
];

let held = new Set();
let frame = 0;
const setHold = async (want) => {
  for (const k of held) if (!want.has(k)) { await page.keyboard.up(k); held.delete(k); }
  for (const k of want) if (!held.has(k)) { await page.keyboard.down(k); held.add(k); }
};

for (const step of TL) {
  const want = new Set(step.hold || []);
  await setHold(want);
  for (const k of step.tap || []) await page.keyboard.down(k);
  for (let i = 0; i < step.n; i++) {
    await page.screenshot({ path: `${OUT}/f${String(frame++).padStart(3, '0')}.png` });
    await page.waitForTimeout(55);
  }
  for (const k of step.tap || []) await page.keyboard.up(k);
}
await setHold(new Set());

console.log(`captured ${frame} frames -> ${OUT}`);
await browser.close();
