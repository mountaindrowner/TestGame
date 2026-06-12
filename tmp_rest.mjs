import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[]; p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:5173/?play',{waitUntil:'load'});
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:20000});

// A) Witness Mark: tp onto the pedestal, hop — collectKey should grant witnessMark
await p.evaluate(()=>window.__gotoRoom('court-witness'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(600);
const spawn=await p.evaluate(()=>window.__ppos());
// pedestal top row 9, key row 7: world = spawn + (13-2, 9-12 rows)*16 …compute from spawn local x2,y12
const px=spawn.x+(13-2)*16, py=spawn.y-(12-8)*16;
await p.evaluate(([x,y])=>window.__tp(x,y),[px,py]);
await p.waitForTimeout(400);
await p.keyboard.down('Space'); await p.waitForTimeout(300); await p.keyboard.up('Space');
await p.waitForTimeout(800);
const r1=await p.evaluate(()=>window.__run());
console.log('A) witnessMark natural pickup:', r1.witnessMark, '| memory flag untouched:', !r1.hasBrokenMemory);

// B) the seal, with REAL pointer clicks on the ember modal
const walkEast=async()=>{
  for(let i=0;i<9;i++){
    await p.keyboard.down('ArrowRight'); await p.waitForTimeout(320); await p.keyboard.up('ArrowRight');
    if(await p.$('#ember-overlay button')){ await p.click('#ember-overlay button'); await p.waitForTimeout(250); }
  }
  return (await p.evaluate(()=>window.__ppos())).x;
};
await p.evaluate(()=>window.__setRun({quietFlame:false}));
await p.evaluate(()=>window.__gotoRoom('court-evidence'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(500);
const xa=await walkEast();
const hint=await p.evaluate(()=>document.querySelector('.hud-hint')?.textContent);
await p.evaluate(()=>window.__setRun({quietFlame:true}));
await p.evaluate(()=>window.__gotoRoom('court-evidence'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(500);
const xb=await walkEast();
console.log('B) no flame: stopped', Math.round(xa), JSON.stringify(hint?.slice(0,52)), '| with flame:', Math.round(xb), '→ seal works:', xb>xa+40);
console.log('errors:', errs.slice(0,6).join(' | ')||'none');
await b.close();
