// tools/dump_world.mjs — compose each environment and dump its merged tiles +
// placements + spawns + the measured critical-path journey to JSON, for the map
// renderer (tools/render_map.py). Usage: node tools/dump_world.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// env start-room → the kit the player provably carries there (for the journey)
const ENVS = { 'first-fall': [], 'mirror-hall': ['grace-burst'], 'court-gate': ['grace-burst'] };

const b = await chromium.launch({ executablePath: EXE, args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERR', e.message));
await p.goto('http://localhost:5173/?play', { waitUntil: 'load' });
await p.waitForFunction(() => window.__GAME_READY === true, { timeout: 20000 });

for (const [env, assumed] of Object.entries(ENVS)) {
  const data = await p.evaluate(async ([env, assumed]) => {
    const wc = await import('/src/data/worldComposer.ts');
    const tv = await import('/src/data/traverseValidate.ts');
    const w = wc.composeWorld(env);
    let journey = null;
    try { journey = tv.debugJourney(env, assumed); } catch (e) { /* no gate spawn */ }
    return {
      env, w: w.w, h: w.h, tiles: w.tiles,
      placements: w.placements.map((q) => ({ id: q.id, name: q.name, ox: q.ox, oy: q.oy, w: q.w, h: q.h })),
      spawns: w.spawns.map((s) => ({ type: s.type, tx: s.tx, ty: s.ty })),
      journey: journey ? journey.path : null,
    };
  }, [env, assumed]);
  writeFileSync(`/tmp/world-${env}.json`, JSON.stringify(data));
  console.log(`dumped ${env}: ${data.w}x${data.h}, ${data.placements.length} rooms, ${data.spawns.length} spawns, journey ${data.journey ? data.journey.length + ' hops' : 'n/a'}`);
}
await b.close();
