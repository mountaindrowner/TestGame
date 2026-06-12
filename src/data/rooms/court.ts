import { RoomData } from '../roomData';
import { Room } from './build';

// ─────────────────────────────────────────────────────────────────────────────
// BIO-03 — THE COURT OF CONDEMNATION. The first level BUILT FROM ITS SCORE
// (courtOfCondemnationScore): each room below is one declared beat, refined by
// hand from the scaffolder's greybox. Monumental carved halls (rows 10–16 open,
// taller vaults where the beat asks for awe); the GAVEL and the VERDICT-GAZE are
// the biome's signature gimmicks (taught safely, then escalated, §3.3). Depths
// art for now — the Court's own tileset comes after the layout is proven (§0.3).
// Spine (east): gate → hall → dock → gauntlet → antechamber → tribunal, with the
// WITNESS STAND above the dock (climb) and the SEALED EVIDENCE below the gauntlet
// (drop-pit; its prize sits behind the Quiet-Flame seal — the planted come-back).
// ─────────────────────────────────────────────────────────────────────────────

/** Beat 1 — arrival. Teach the gavel's rhythm over solid ground (#8). */
export function courtGate(): RoomData {
  const r = new Room('THE OUTER GATES', 28, 20).fill();
  r.carve(0, 10, 28, 7); //   the entry walk (rows 10-16), open east
  r.carve(8, 6, 12, 4); //    a vaulted porch over the first judgment
  r.solid(19, 15, 5, 2); //   a raised PLINTH under the porch's far side…
  r.solid(18, 16, 1, 1); //   …stepped on both ends (the walk rises with the verdicts)
  r.solid(24, 16, 1, 1);

  r.at('player', 3, 16);
  r.at('door', 3, 16, { id: 'from-mirrors', to: 'untrue-image' }); // arrival from the BIO-02 lift
  r.at('gavel', 14, 10); //   THE FIRST GAVEL — solid floor below, learn the beat
  r.at('torch', 6, 16);
  r.at('torch', 22, 16);
  r.at('jar', 9, 16);

  r.link('east', 'court-hall');
  return r.build('court-gate');
}

/** Beat 2 — teach the verdict-gaze; first court blades. */
export function courtHall(): RoomData {
  const r = new Room('THE HALL OF ACCUSATION', 34, 20).fill();
  r.carve(0, 10, 34, 7); //   the long hall, open both sides
  r.carve(12, 4, 12, 6); //   the gaze descends from a high vault
  r.solid(14, 15, 8, 2); //   the accused's DAIS under the gaze — the floor rises to be seen…
  r.solid(13, 16, 1, 1); //   …stepped on both ends
  r.solid(22, 16, 1, 1);

  r.at('gaze', 17, 10, { range: 6 }); // the roaming judgment light
  r.at('runner', 24, 16);
  r.at('archer', 29, 16);
  r.at('torch', 4, 16);
  r.at('torch', 30, 16);
  r.at('jar', 21, 16);

  r.link('west', 'court-gate');
  r.link('east', 'court-dock');
  return r.build('court-hall');
}

/** Beat 3 — the branch: climb to the Witness Stand, or press on under gavels. */
export function courtDock(): RoomData {
  const r = new Room('THE DOCK', 26, 20).fill();
  r.carve(0, 10, 26, 7); //   the through-passage
  r.carve(17, 17, 5, 2); //   a sunken TRENCH under the east gavel — drop in, climb out
  r.climbShaft(13, 0, 15); // the climb UP to the Witness Stand — nubs reach the floor
  //                          (12/9/6/3: every hop ≤3; the old shaft started 11 rows up)

  r.at('gavel', 6, 10, { phase: 0 }); //   a gavel pair guards the way on —
  r.at('gavel', 20, 10, { phase: 0.5 }); // offset beats, walk the rhythm (test)
  r.at('torch', 3, 16);
  r.at('torch', 23, 16);

  r.link('west', 'court-hall');
  r.link('east', 'court-gauntlet');
  r.link('up', 'court-witness');
  return r.build('court-dock');
}

/** Beat 4 — the reward: a Bailiff guards the WITNESS MARK. */
export function courtWitness(): RoomData {
  const r = new Room('THE WITNESS STAND', 26, 16).fill();
  r.carve(2, 5, 22, 8); //    the stand (closed chamber)
  r.carve(5, 13, 3, 3); //    the entrance hole (west — NOT under the prize column)
  r.solid(11, 9, 4, 1); //    the pedestal the Mark floats over

  r.at('striker', 19, 12); // the Bailiff (heavy telegraph; placeholder art)
  r.at('key', 13, 7, { grant: 'witness' }); // THE WITNESS MARK
  r.at('torch', 4, 12);
  r.at('torch', 21, 12);
  r.at('jar', 6, 12);

  r.link('down', 'court-dock');
  return r.build('court-witness');
}

/** Beat 6 — the gauntlet: everything the Court taught, at once. */
export function courtGauntlet(): RoomData {
  const r = new Room('THE GAUNTLET OF VERDICTS', 40, 20).fill();
  r.carve(0, 10, 40, 7); //   the run, open both sides
  r.carve(14, 17, 4, 3); //   a molten scar pit mid-run (gavels hammer over it)
  r.molten(14, 19, 4);
  r.carve(26, 17, 4, 3); //   THE DROP — down into the Sealed Evidence (optional; 4-wide
  //                          so jumping past it stays a comfortable 5-tile leap)

  r.at('gavel', 12, 10, { phase: 0 });
  r.at('gavel', 16, 10, { phase: 0.33 });
  r.at('gavel', 20, 10, { phase: 0.66 }); // a phased row — read the wave, run it
  r.at('gaze', 33, 10, { range: 5 }); //    and the gaze hunts the far half
  r.at('striker', 36, 16);
  r.at('torch', 3, 16);
  r.at('torch', 38, 16);

  r.link('west', 'court-dock');
  r.link('east', 'court-antechamber');
  r.link('down', 'court-evidence');
  return r.build('court-gauntlet');
}

/** Beat 5 (optional) — the planted come-back: the Quiet-Flame seal. */
export function courtEvidence(): RoomData {
  const r = new Room('THE SEALED EVIDENCE', 30, 16).fill();
  r.carve(2, 4, 26, 9); //    the vault (closed chamber, floor rows 13+)
  r.climbShaft(28 - 8, 0, 12); // the climb back out — nubs at 9/6/3 reach the chamber
  //                          floor (the old 3-row stub left a 10-row unjumpable wall = a TRAP)

  r.at('flameseal', 12, 12); // the condemning dark — only the Quiet Flame passes
  r.at('ember', 5, 12); //     the prize beyond it
  r.at('jar', 8, 12);
  r.at('jar', 3, 12);
  r.at('torch', 16, 12); //    the near side is lit; the seal swallows the light

  r.link('up', 'court-gauntlet');
  return r.build('court-evidence');
}

/** Beat 7 — the breather: one steady candle before the verdict. */
export function courtAntechamber(): RoomData {
  const r = new Room('THE ANTECHAMBER', 24, 18).fill();
  r.carve(0, 11, 24, 6); //   a low, quiet passage — no threats (§3.6)
  r.carve(9, 6, 6, 5); //     one shaft of vaulted height, one light
  r.carve(9, 17, 6, 2); //    the floor DIPS under the light — a sunken, quiet pool of calm

  r.at('torch', 12, 16); //   the one steady candle
  r.at('jar', 5, 16);
  r.at('jar', 19, 16);

  r.link('west', 'court-gauntlet');
  r.link('east', 'court-tribunal');
  return r.build('court-antechamber');
}

/** Beat 8 — the finale: THE ACCUSER presides; the gate needs the Witness Mark. */
export function courtTribunal(): RoomData {
  const r = new Room('THE HIGH TRIBUNAL', 40, 20).fill();
  r.carve(0, 8, 38, 9); //    the tribunal floor (flat — the charge needs room), open west
  r.solid(30, 12, 8, 1); //   the BENCH — a raised dais the Accuser presides from

  r.at('accuser', 32, 11); // THE ACCUSER, on the bench
  r.at('gate', 36, 16, { id: 'court-final' }); // end of built content (for now)
  r.at('torch', 4, 16);
  r.at('torch', 26, 16);
  r.at('torch', 34, 11);

  r.link('west', 'court-antechamber');
  return r.build('court-tribunal');
}
