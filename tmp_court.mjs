import { chromium } from 'playwright';
const EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch({executablePath:EXE,args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
const p=await b.newPage({viewport:{width:960,height:540}});
const errs=[]; p.on('console',m=>{if(m.type()==='error')errs.push(m.text());}); p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('http://localhost:5173/?play',{waitUntil:'load'});
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:20000});
// 1) score validator: coverage should now CHECK and pass
const v=await p.evaluate(async()=>{
  const sv=await import('/src/data/scoreValidate.ts'); const ls=await import('/src/data/levelScore.ts');
  const w=sv.validateScore(ls.scoreFor('court-gate'));
  const wc=await import('/src/data/worldComposer.ts'); const cw=wc.composeWorld('court-gate');
  const rv=await import('/src/data/roomValidate.ts'); const lg=await import('/src/data/levelGraph.ts');
  let structural={};
  for(const id of ['court-gate','court-hall','court-dock','court-witness','court-gauntlet','court-evidence','court-antechamber','court-tribunal']){
    const ws=rv.validateRoom(lg.buildRoom(id)).filter(x=>x.level==='error');
    if(ws.length) structural[id]=ws.map(x=>x.msg);
  }
  return {gate:`${w.filter(x=>x.level==='error').length}E/${w.filter(x=>x.level==='note').length}N`,
    notes:w.map(x=>x.msg), composed:`${cw.w}x${cw.h}/${cw.placements.length}`,
    rooms:cw.placements.map(q=>q.id).join(','), structural:Object.keys(structural).length?structural:'clean'};
});
console.log('logic gate:', v.gate, v.notes.length?('| notes: '+v.notes.join(' ; ')):'');
console.log('composed:', v.composed, '['+v.rooms+']');
console.log('structural:', JSON.stringify(v.structural));
// 2) load the court, watch a gavel slam
await p.evaluate(()=>window.__gotoRoom('court-gate'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(2400);
await p.screenshot({path:'/tmp/court-gate.png'});
const hp0=await p.evaluate(()=>window.__health());
// 3) hall: stand under the gaze and get judged (prove lock->strike)
await p.evaluate(()=>window.__gotoRoom('court-hall'));
await p.waitForFunction(()=>window.__GAME_READY===true,{timeout:8000}); await p.waitForTimeout(400);
// walk under the gaze center (world x: hall ox? composed world — use ppos + move right toward x of gaze)
await p.keyboard.down('ArrowRight'); await p.waitForTimeout(2500); await p.keyboard.up('ArrowRight');
await p.waitForTimeout(2600);
const hp1=await p.evaluate(()=>window.__health());
await p.screenshot({path:'/tmp/court-hall.png'});
console.log('hp after gaze stretch:', hp0, '->', hp1, '(a hit = the gaze/gavel judged us — mechanics live)');
console.log('errors:', errs.slice(0,8).join(' | ')||'none');
await b.close();
