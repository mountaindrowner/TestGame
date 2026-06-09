import { chromium } from 'playwright';
const EXE = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const ready = async () => page.waitForFunction(()=>window.__GAME_READY===true,{timeout:15000});
await page.goto('http://localhost:5173?play', { waitUntil:'load' }); await page.mouse.click(480,270); await ready();
await page.evaluate(()=>window.__gotoRoom('crossroads')); await ready(); await page.waitForTimeout(700);
await page.keyboard.down('ArrowRight'); await page.waitForTimeout(1500); await page.keyboard.up('ArrowRight');
for(let i=0;i<8;i++){ await page.waitForTimeout(220); await page.$('canvas').then(c=>c.screenshot({ path:`shots/inspect/rng_${i}.png` })); }
await browser.close();
