import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('http://localhost:5173/?play',{waitUntil:'load'});
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:20000});

// A) the witness key grants witnessMark (walk to the pedestal at local 13,7)
await p.evaluate(()=>window.__gotoRoom('court-witness'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(500);
// the key floats at chamber height; jump under it
const before=await p.evaluate(()=>{const r=JSON.parse(JSON.stringify((window.__rs&&window.__rs())||{}));return r;});
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(1100); await p.keyboard.up('ArrowRight');
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(300); await p.keyboard.up('ArrowLeft');
await p.keyboard.down('Space'); await p.waitForTimeout(280); await p.keyboard.up('Space');
await p.waitForTimeout(700);
const mark=await p.evaluate(()=>{ // read RunState from the registry through any scene
  const g=document.querySelector('canvas'); return window.__health!==undefined; });
// simpler: use __setRun if present, else read via a tiny probe scene-side
const probe=await p.evaluate(()=>{
  const W=window; if(W.__setRun) return 'has-setRun';
  return 'none';
});
console.log('A) probe:', probe);

// B) tribunal with witnessMark forced + boss killed -> gate opens -> ↑ completes
if(probe==='has-setRun'){
  await p.evaluate(()=>window.__setRun({witnessMark:true}));
}
await p.evaluate(()=>window.__gotoRoom('court-tribunal'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(2600);
await p.evaluate(()=>window.__killBoss());
await p.waitForTimeout(2400);
// walk to the gate (local 36,16 — far east) and press up
for(let i=0;i<14;i++){ await p.keyboard.down('ArrowRight'); await p.waitForTimeout(380); await p.keyboard.up('ArrowRight');
  await p.keyboard.press('ArrowUp'); await p.waitForTimeout(220);
  const w=await p.evaluate(()=>!!document.getElementById('win-overlay')); if(w) break; }
await p.waitForTimeout(900);
const win=await p.evaluate(()=>document.getElementById('win-overlay')?.textContent?.slice(0,60));
console.log('B) win overlay:', JSON.stringify(win));
await p.screenshot({path:'/tmp/court-complete.png'});
console.log('errors:', errs.slice(0,8).join(' | ')||'none');
await b.close();
