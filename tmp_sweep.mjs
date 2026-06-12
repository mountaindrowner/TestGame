import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('http://localhost:5173/?play',{waitUntil:'load'});
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:20000});

// 1) Warden arena seal really holds now
await p.evaluate(()=>window.__gotoRoom('gate'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(2700);
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(2200); await p.keyboard.up('ArrowLeft');
const gx=(await p.evaluate(()=>window.__ppos())).x;
console.log('1) Warden arena: pushed west 2.2s, x =', Math.round(gx), '(arena starts ~3776 in the 264-wide world → must stay >= ~3790)');

// 2) Accuser tribunal seal holds (entered from the west)
await p.evaluate(()=>window.__gotoRoom('court-tribunal'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(2700);
await p.keyboard.down('ArrowLeft'); await p.waitForTimeout(2200); await p.keyboard.up('ArrowLeft');
const tx=(await p.evaluate(()=>window.__ppos())).x;
const armed=await p.evaluate(()=>document.querySelector('.hud-boss')?.classList.contains('show'));
console.log('2) tribunal: armed', armed, '| pushed west, x =', Math.round(tx), '(tribunal ox=152 → seal ~2440; must stay >=2450)');

// 3) all three scores green
const v=await p.evaluate(async()=>{
  const sv=await import('/src/data/scoreValidate.ts'); const ls=await import('/src/data/levelScore.ts');
  return ls.allScoreEnvs().map(e=>{const w=sv.validateScore(ls.scoreFor(e));
    return `${e}: ${w.filter(x=>x.level==='error').length}E/${w.filter(x=>x.level==='note').length}N`;}).join('  ');
});
console.log('3) logic gates:', v);

// 4) visit every court sub-room clean
for(const id of ['court-gate','court-hall','court-dock','court-witness','court-gauntlet','court-evidence','court-antechamber','court-tribunal']){
  await p.evaluate(x=>window.__gotoRoom(x), id);
  await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(220);
}
console.log('4) all 8 court rooms visited; errors:', errs.slice(0,8).join(' | ')||'none');
// a beauty shot of the gauntlet (phased gavels + gaze)
await p.evaluate(()=>window.__gotoRoom('court-gauntlet'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(1700);
await p.screenshot({path:'/tmp/court-gauntlet.png'});
await b.close();
