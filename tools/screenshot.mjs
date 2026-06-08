// Headless screenshot harness. Requires the dev server running on :5173.
// Usage: node tools/screenshot.mjs [pose1 pose2 ...]
// Poses: default | dash | combat | grace   (see GameScene.poseScene)
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = process.env.URL || 'http://localhost:5173';
// Skip the new boot/title menu so the harness lands straight in the game.
const URL = BASE.includes('?') ? BASE : BASE + '?play';
const poses = process.argv.slice(2);
const SHOTS = poses.length ? poses : ['default', 'combat', 'dash', 'grace'];

mkdirSync('shots', { recursive: true });

// The installed Playwright (1.60) expects a chromium build that isn't present,
// but a full chromium IS — point at it directly.
const EXE =
  process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } }); // 2x internal
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error' || t === 'warning') console.log(`[browser:${t}]`, m.text());
});
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

for (const pose of SHOTS) {
  await page.goto(URL, { waitUntil: 'load' });
  await page.mouse.click(480, 270); // satisfy audio autoplay + focus
  await page.waitForFunction(() => window.__GAME_READY === true, { timeout: 15000 });
  await page.waitForTimeout(600); // let the loading title fully fade out
  if (pose === 'default') {
    await page.waitForTimeout(400); // let the scene breathe / enemies move
  } else {
    await page.evaluate((p) => window.__poseScene && window.__poseScene({ pose: p }), pose);
    await page.waitForTimeout(180);
  }
  const path = `shots/first-fall-${pose}.png`;
  await page.screenshot({ path });
  console.log('wrote', path);
}

await browser.close();
