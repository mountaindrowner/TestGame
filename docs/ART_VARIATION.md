# Organic Variation Rules

> How we vary level assets so the world feels **organic** — meaning (1) **logical**:
> everything sits where physics, water, light, growth and structure would actually
> put it; and (2) **deterministically unique**: variation is a pure function of
> world position, so it's stable across loads yet never looks stamped or random.
>
> Executable form: `src/data/variation.ts` (TS) + parity `vhash` in `tools/common.py`.

## 0. Prime directive — variation is a function of place, never chance
- **No runtime randomness for world art.** No `Math.random()`. Every decision =
  `vhash(tileX, tileY, salt)`. The same cell looks the same forever; different
  cells never correlate. (Authored, not noisy. Also keeps screenshots/tests stable.)
- **One canonical hash**, salted per feature so independent choices (moss vs cracks
  vs interior variant) don't line up. Helpers: `chance`, `pick`, `range`, `wave`,
  `dampness`.
- A placement "belongs" to its spot because it's derived from that spot.

## 1. Orientation & gravity — which way things go
- **Hang DOWN from undersides** (attach top-center): stalactites, calcite drips,
  moss curtains, vines, roots, chains, banners. Never on a floor, never pointing up.
- **Sit/grow on TOP faces**: ground moss, grass, rubble, settling embers.
- **Consistent key light, upper-left**: lit bevel/rim on top+left, shadow on
  bottom+right. Diegetic light is the far flame → warm bloom strongest center/deep.

## 2. Water & damp — moisture logic
- **Calcite / dripstone** forms on **undersides**, **beneath cracks** (seepage), and
  under long-stable ceiling points (where drips persist → columns).
- **Moss, damp stains, vegetation** concentrate **low** (near the floor), near
  **molten/water edges**, and in shadow; sparse when **high and dry**.
- Use `dampness(y, roomH)` as the density knob so moisture pools where it would.

## 3. Structure & age — where stone breaks and grows
- **Edges/corners by exposed-face mask** (the autotiler): convex corners round,
  exposed edges bevel, buried faces stay dark.
- **Cracks start at stress points** (corners, mid-span of unsupported runs, under
  load) and **propagate/branch**; cracked tiles **cluster**, never lone specks.
- **Rubble piles at bases**; **broken/jagged tops** where nothing sits above.
- **Age gradient**: pristine masonry high/near light → ruined, mossy, calcified low
  and deep. Overgrowth and weathering increase with depth + dampness.
- **Silhouette**: vary height **widely** (power-biased — many modest, a few that
  loom) so big forms anchor and small detail fills between.

## 4. Distribution — unique, not stamped, not chaotic
- **Sparse with spacing**: occasional (`chance` under a low threshold) + a minimum
  gap so props don't clump — unless the feature is *meant* to cluster (cracks, rubble).
- **Same-family variant scatter**: large fills pick among N subtle variants by hash
  so they never read as tiled; variants stay within the family (no jarring outliers).
- **Bias the curve** (`range(..., bias)`) for natural spreads, not uniform noise.
- **Respect seams**: nothing crosses a tile/parallax seam (tileability); leave gaps
  where composition needs them (e.g. the central gap for the far flame).

## 5. Gameplay safety (non-negotiable, overrides aesthetics)
- Cosmetic geometry never blocks a path or a jump arc; ceiling/hanging geometry
  stays clear of head height over any standable surface (see the shallow cave-roof cap).
- New solid tiles stay inside `WALL_MIN..VIS_SOLID_MAX`; platforms behave like
  `Vis.PLATFORM`. Never break the 21-tile Vis contract or the autotiler.

## 6. Restraint & coherence
- Palette-locked (DECISIONS.md): dark silhouettes + neon grace accents, ≤5 hue
  families per scene. Variation lives **within** a family; silhouettes stay readable.
- **Every element implies a cause** — it tells a tiny true story: water dripped here
  → calcite; light reached here → moss; stress here → a crack.

## 7. How the rules map to our systems
| System | Rules it embodies |
|---|---|
| `systems/Autotiler.ts` | §3 edge mask; §4 interior variant scatter (via `vhash`) |
| `systems/Decorations.ts` | §1 underside-only hang; §4 sparse + min-gap; weighted kinds |
| `data/rooms/*` + `build.ts` | §3 cave-roof varied depth + nubs; §5 shallow near high ledges |
| `tools/gen_tileset.py` | §1 moss on tops; §2 calcite under bottoms; §3 weather/cracks |
| `tools/gen_decor.py` | §1 hang-down props; §2 pale calcite tips |
| `tools/gen_backgrounds.py` | §3 graves on a ground line, height power-bias; §4 depth haze, central flame gap |

## 8. Checklist when adding any asset or variation
1. Is its placement driven by `vhash`/`dampness` (not random)? Unique salt?
2. Does gravity/orientation make sense (hangs vs sits vs grows)?
3. Does moisture/light/structure logic justify *where* it appears and how dense?
4. Is it sparse + spaced (or intentionally clustered)? Does it avoid the seam?
5. Does it stay in-palette, in-family, and readable in silhouette?
6. Does it ever intrude on a path/jump/headroom? (If yes, fix or make it decor.)
7. Does it imply a cause — would it really be there?
