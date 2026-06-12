// tools/traversecheck.mjs — run the TRAVERSAL GATE (src/data/traverseValidate.ts)
// headlessly over every shipped environment and print its warnings + the measured
// critical-path journey. The "can you actually walk this level / no softlock pits"
// check. Needs the dev server running on :5173. Usage: node tools/traversecheck.mjs
import { chromium } from 'playwright';
const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:5173/?play', { waitUntil:'load' });
await p.waitForFunction(() => window.__GAME_READY === true, { timeout:15000 });
const ENVS = { 'first-fall': [], 'mirror-hall': ['grace-burst'], 'court-gate': ['grace-burst'] };
for (const [env, assumed] of Object.entries(ENVS)) {
  const out = await p.evaluate(async ([env, assumed]) => {
    const tv = await import('/src/data/traverseValidate.ts');
    const warns = tv.validateTraversal(env, assumed);
    let journey = null;
    try { const j = tv.debugJourney(env, assumed); journey = { hops: j.path.length, rise: j.rise }; } catch(e) { journey = 'ERR:'+e.message; }
    return { warns: warns.map(w=>({level:w.level, msg:w.msg})), journey };
  }, [env, assumed]);
  console.log('\n===', env, '===');
  console.log('journey:', JSON.stringify(out.journey));
  if (!out.warns.length) console.log('  (no warnings)');
  for (const w of out.warns) console.log(`  [${w.level}] ${w.msg}`);
}
await b.close();
