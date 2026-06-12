import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('http://localhost:5173/?play',{waitUntil:'load'});
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:20000});

// A) witness stand: key grants witnessMark (not the memory)
await p.evaluate(()=>window.__gotoRoom('court-witness'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(600);
await p.evaluate(()=>{ // teleport next to the Mark and let pickup fire
  const run=window.__setRun? null:null; return null; });
// walk toward the pedestal (key at local 13,7 → it floats high; just verify via __setRun-less route: use dev jump + walk)
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(800); await p.keyboard.up('ArrowRight');
await p.waitForTimeout(300);
const flags0=await p.evaluate(()=>{ const r=window.__runState?.(); return r? {mark:r.witnessMark,mem:r.hasBrokenMemory}:'no-hook'; });
console.log('A) flags after witness walk (hook may be absent):', JSON.stringify(flags0));

// B) tribunal: arena arms on entry; kill -> quiet flame + gate opens; ↑ completes
await p.evaluate(()=>window.__gotoRoom('court-tribunal'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(2600);
const bossArmed=await p.evaluate(()=>document.querySelector('.hud-boss')?.classList.contains('show'));
const bossName=await p.evaluate(()=>document.querySelector('.boss-name')?.textContent);
console.log('B) accuser armed:', bossArmed, '| name:', bossName);
await p.screenshot({path:'/tmp/court-tribunal.png'});
await p.evaluate(()=>window.__killBoss());
await p.waitForTimeout(2200);
const bossGone=await p.evaluate(()=>!document.querySelector('.hud-boss')?.classList.contains('show'));
console.log('B) boss bar cleared after kill:', bossGone);
await b.close();
