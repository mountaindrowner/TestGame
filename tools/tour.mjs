// Quick room-tour screenshotter: jump to each room id via __gotoRoom and grab a
// wide shot so we can see how 'lived-in' (or bare) each space is.
// Usage: node tools/tour.mjs <roomId> [roomId...]
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173/?play';
const rooms = process.argv.slice(2);
mkdirSync('shots', { recursive: true });

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({
  executablePath: EXE,
  args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.log('[pageerror]', e.message));

await page.goto(BASE, { waitUntil: 'load' });
await page.mouse.click(640, 360);
await page.waitForFunction(() => window.__GAME_READY === true, { timeout: 15000 });
await page.waitForTimeout(600);

for (const id of rooms) {
  await page.evaluate((r) => window.__gotoRoom && window.__gotoRoom(r), id);
  await page.waitForTimeout(900); // let the room settle + light pool catch up
  const path = `shots/tour-${id}.png`;
  await page.screenshot({ path });
  console.log('wrote', path);
}
await browser.close();
