import { chromium } from 'playwright';
const EXE = process.env.CHROME_BIN || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errs=[]; page.on('pageerror',e=>errs.push(e.message)); page.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
const ready = async () => page.waitForFunction(()=>window.__GAME_READY===true,{timeout:15000});
const pos = async () => page.evaluate(()=>window.__ppos());
await page.goto('http://localhost:5173?play', { waitUntil:'load' }); await page.mouse.click(480,270); await ready();
await page.evaluate(()=>window.__gotoRoom('catacombs')); await ready(); await page.waitForTimeout(800);
console.log('spawn', await pos());
// crude switchback climb: alternate (right+jump) / (left+jump), holding jump fully
let miny=9999;
const phases=[['ArrowRight',2200],['ArrowLeft',2200],['ArrowRight',2200],['ArrowLeft',2200],['ArrowRight',2200],['ArrowLeft',2200]];
for (const [dir,ms] of phases){
  await page.keyboard.down(dir);
  const end=Date.now()+ms;
  while(Date.now()<end){
    await page.keyboard.down('Space'); await page.waitForTimeout(450); await page.keyboard.up('Space'); await page.waitForTimeout(250);
    const p=await pos(); miny=Math.min(miny,p.y);
  }
  await page.keyboard.up(dir);
  console.log(dir, await pos());
}
console.log('MIN Y reached', miny, '(floor ~544; top shelf ~ y160; lower=better)');
await page.screenshot({ path:'shots/inspect/cat_climb.png' });
console.log('ERRORS:', errs.length?JSON.stringify(errs.slice(0,6)):'none');
await browser.close();
