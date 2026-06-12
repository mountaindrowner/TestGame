import { RoomData } from '../roomData';
import { Room } from './build';

// ─────────────────────────────────────────────────────────────────────────────
// BIO-03 — THE COURT OF CONDEMNATION, re-cut WINDING (the metroidvania pass that
// BIO-01 got). The spine now rises and falls like a real place: the outer walk
// CLIMBS through the gates, the hall offers a HIGH ROAD and a LOW ROAD (two-route
// choice — Mark's roadmap §6) with different threats on each, the dock SINKS the
// accused into a pit beneath the gavels, and the gauntlet runs both roads at once
// (gavels hammer the high shelves, the gaze hunts the low run). Beats, gimmicks
// and the lock-and-key are unchanged — only the geometry got honest. Verified by
// the traversal gate (reachable, no traps, real elevation).
// ─────────────────────────────────────────────────────────────────────────────

/** Beat 1 — arrival. The statue walk CLIMBS through the gates; learn the gavel. */
export function courtGate(): RoomData {
  const r = new Room('THE OUTER GATES', 28, 24).fill();
  r.carve(0, 18, 12, 4); //   T1 — the low west walk (floor 22)
  r.carve(10, 16, 10, 4); //  T2 — a step up (floor 20)
  r.carve(18, 13, 10, 5); //  T3 — the high east walk to the mouth (floor 18)
  r.carve(8, 8, 12, 8); //    the vaulted porch over T2 — the first gavel hangs here

  r.at('player', 3, 21);
  r.at('door', 3, 21, { id: 'from-mirrors', to: 'untrue-image' }); // arrival from the BIO-02 lift
  r.at('gavel', 14, 8); //    THE FIRST GAVEL — a long, readable drop onto solid ground
  r.at('torch', 5, 21);
  r.at('torch', 15, 19);
  r.at('torch', 25, 17);
  r.at('jar', 8, 21);

  r.link('east', 'court-hall');
  return r.build('court-gate');
}

/** Beat 2 — teach the gaze. TWO ROUTES: the watched low road, or the high shelves. */
export function courtHall(): RoomData {
  const r = new Room('THE HALL OF ACCUSATION', 34, 24).fill();
  r.carve(0, 13, 34, 5); //   the LOW ROAD (rows 13-17, floor 18), open both sides
  r.carve(4, 4, 26, 9); //    the great vault above it (rows 4-12) — one tall hall
  // the HIGH ROAD — shelves through the vault, mostly above the gaze's hunt
  r.solid(5, 15, 3, 1); //    a step up off the low road (stand 14)
  r.solid(10, 12, 6, 1); //   shelf 1 (stand 11)
  r.solid(20, 10, 6, 1); //   shelf 2 (stand 9 — the high point)
  r.solid(28, 12, 4, 1); //   shelf 3, then drop east back to the low road

  r.at('gaze', 17, 4, { range: 6 }); // the judgment light — owns the LOW road's middle
  r.at('runner', 24, 17); //  low-road blade work
  r.at('archer', 30, 17); //  covers the east end
  r.at('torch', 4, 17);
  r.at('torch', 30, 17);
  r.at('jar', 21, 9); //      the high road pays a little (risk/reward)
  r.at('jar', 9, 17);

  r.link('west', 'court-gate');
  r.link('east', 'court-dock');
  return r.build('court-hall');
}

/** Beat 3 — the branch. The accused SINKS into the dock pit; the stand is above. */
export function courtDock(): RoomData {
  const r = new Room('THE DOCK', 26, 22).fill();
  r.carve(0, 13, 26, 5); //   the through-passage (rows 13-17, floor 18), both sides
  r.carve(16, 18, 8, 4); //   THE DOCK PIT — the floor sinks where the accused stands
  //                          (east of the shaft so the witness climb keeps its footing)
  r.climbShaft(13, 0, 16); // the climb UP to the Witness Stand (laddered to the floor)
  r.solid(14, 1, 2, 1); //    one extra foothold at the very top — the taller dock
  //                          made the last hop 7 tiles without it (the gate caught it)

  r.at('gavel', 19, 13, { phase: 0 }); //  hammers INTO the pit — a deep, dramatic slam
  r.at('gavel', 5, 13, { phase: 0.5 }); // covers the west lane — walk the offset rhythm
  r.at('torch', 3, 17);
  r.at('torch', 24, 17);
  r.at('jar', 19, 21); //     down in the pit

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

/** Beat 6 — the gauntlet. TWO ROUTES under the verdict wave: gavels pound the
 *  HIGH shelves, the gaze hunts the LOW run, grasp-pits below, the drop to the
 *  Sealed Evidence between them. Everything the Court taught, at once. */
export function courtGauntlet(): RoomData {
  const r = new Room('THE GAUNTLET OF VERDICTS', 40, 24).fill();
  r.carve(0, 15, 40, 5); //   the LOW run (rows 15-19, floor 20), open both sides
  r.carve(2, 6, 36, 9); //    the open verdict hall above (rows 6-14)
  r.carve(14, 20, 4, 3); //   a grasping pit mid-run…
  r.molten(14, 22, 4); //     …the fallen claw at whoever runs the low road
  r.carve(26, 20, 4, 4); //   THE DROP — down into the Sealed Evidence (optional)
  r.solid(26, 22, 1, 1); //   a jutting brick inside the drop — the foothold that
  //                          makes the climb BACK OUT honest (drop stays 3 wide)
  // the HIGH ROAD — shelves the gavels hammer
  r.solid(3, 17, 3, 1); //    the step up (stand 16)
  r.solid(8, 13, 7, 1); //    shelf 1 (stand 12)
  r.solid(19, 11, 7, 1); //   shelf 2 (stand 10)
  r.solid(30, 13, 6, 1); //   shelf 3, drop east

  r.at('gavel', 12, 6, { phase: 0 }); //   slams onto shelf 1 —
  r.at('gavel', 16, 6, { phase: 0.33 }); // — plunges the gap between shelves —
  r.at('gavel', 22, 6, { phase: 0.66 }); // — slams onto shelf 2: read the wave, run it
  r.at('gaze', 33, 6, { range: 5 }); //    and the gaze hunts the low road's east half
  r.at('striker', 36, 19); // the last Bailiff bars the way out
  r.at('torch', 3, 19);
  r.at('torch', 38, 19);
  r.at('jar', 21, 9); //      the high road pays (risk/reward)

  r.link('west', 'court-dock');
  r.link('east', 'court-antechamber');
  r.link('down', 'court-evidence');
  return r.build('court-gauntlet');
}

/** Beat 5 (optional) — the planted come-back: the Quiet-Flame seal. */
export function courtEvidence(): RoomData {
  const r = new Room('THE SEALED EVIDENCE', 30, 16).fill();
  r.carve(2, 4, 26, 9); //    the vault (closed chamber, floor rows 13+)
  r.climbShaft(28 - 8, 0, 11); // the climb back out (laddered to the chamber floor)

  r.at('flameseal', 12, 12); // the condemning dark — only the Quiet Flame passes
  r.at('ember', 5, 12); //     the prize beyond it
  r.at('jar', 8, 12);
  r.at('jar', 3, 12);
  r.at('torch', 16, 12); //    the near side is lit; the seal swallows the light

  r.link('up', 'court-gauntlet');
  return r.build('court-evidence');
}

/** Beat 7 — the breather: one steady candle; the quiet hall RISES toward the verdict. */
export function courtAntechamber(): RoomData {
  const r = new Room('THE ANTECHAMBER', 24, 20).fill();
  r.carve(0, 14, 14, 4); //   low west passage (floor 18)
  r.carve(10, 6, 8, 8); //    the one shaft of vaulted height, one light
  r.solid(10, 16, 8, 2); //   a broad landing beneath it (stand 15 — a gentle 3-up)
  r.carve(16, 11, 8, 4); //   the higher east passage to the tribunal (floor 15)

  r.at('torch', 13, 15); //   the one steady candle, on the landing
  r.at('jar', 4, 17);
  r.at('jar', 21, 14);

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
