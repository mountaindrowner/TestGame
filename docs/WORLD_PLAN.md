# World & Room Plan

> So no room is "random." Every level, every room has a **name, a role in the climb,
> a mood, and a reason its assets are where they are.** This is the design direction
> we build and re-skin against — when we place a thing, this says *why*.

## The through-line: an ascent out of the depths
REPENTANCE is a **climb from the lowest place back toward grace/light** (the Mercy
Seat). You begin by **falling** to the bottom; the whole journey is *getting back up*
— literally and as the metaphor. So the master gradient is:

> **deep / dark / fallen / ruined / overgrown** (bottom) → **rising / lighter /
> structured / made-whole** (top). The far flame is the light you climb toward.

Design consequences (apply everywhere):
- **Elevation trend per room**: each room states whether the player net-**descends**
  (only the opening fall) or net-**ascends** (everything after). Exits that continue
  the journey trend **up and toward the light**; backtrack exits trend down/back.
- **Decay gradient**: deeper = more damp, mossy, calcified, broken; higher = drier,
  more intact masonry, more light. (Drives `dampness()` and asset density.)
- **Light gradient**: deeper = the lone far flame + local torches only; higher =
  more/brighter grace-light leaking in.
- **Enemy gradient**: the area's family escalates as you rise toward its Warden.

## Routes (from DESIGN.md)
Hub **[HUB-01] The Place of Return** → three routes rising to the Altar of Surrender
→ **[END-01] The Mercy Seat**. Routes: **Shame** (what we're building), **Desire**,
**Hidden Wound** (locked). Each route = a sequence of biomes; each biome = a set of
rooms following the gradients above, capped by a **Warden** (elite kin of the biome's
base enemy) guarding the way up.

## Room-plan template (fill this for every new room)
```
id / NAME
role        — its beat in the biome's arc (arrival, teach, branch, gauntlet, finale…)
elevation   — net ascend / descend / lateral; where its onward exit leads
mood        — one line of feeling/meaning (the metaphor it carries)
faces       — enemies/hazards introduced or combined here
signature   — the assets that define it (and therefore what we place + why)
why         — one sentence: why this room exists in the climb
```

## BIO-01 — "The First Fall" (Shame route, opener) — concrete plan
The collapse and the first climb out. Tutorializes movement → combat → traversal →
a key+guardian finale. Deepest, dampest, most overgrown biome in the route.

| Room (id) | Role · Elevation | Mood | Faces | Signature assets / why |
|---|---|---|---|---|
| **THE FIRST FALL** (`first-fall`) | Arrival · **descend** to the bottom | "The moment of collapse — you hit the lowest place." | Impulse Runner; molten basin | Cracked ground, molten hazard, the longest fall; teaches move/jump/dash. Deepest decay. |
| **THE LOWER VAULTS** (`descent`) | Teach combat · begin **ascend** | "Down in the dark, something stalks." | Runner + Regret Crawler | Sunken vaults, heavy moss/calcite; first real fights as you start rising. |
| **THE CROSSROADS** (`crossroads`) | Branch hub · **ascend**, side-door down | "A choice: face the memory, or press on." | Shame Spark (airborne) | A junction; ↑ side-door drops to the buried memory; airborne threat opens space up. |
| **A BURIED MEMORY** (`memory`) | Branch reward · **descend** (dead-end) | "Face what you buried." | Hollow Striker (guards it) | A sealed vault holding the **Broken Memory** key; most claustrophobic, most calcified. |
| **THE SEALED GATE** (`gate`) | Finale · **ascend toward light** | "The way up is guarded — get back up past it." | **The Warden of the Fall** (armored Runner kin) | The gate (the way out/up); brightest grace-light; the telegraph-and-weave boss. |

**Onward:** the gate exits the biome upward — next Shame biome is **House of Mirrors**
(per DESIGN.md). Each subsequent biome gets its own table like this before we build it.

## How to use this
1. Before authoring/re-skinning a room, write its template line (above).
2. Place assets to satisfy **role + mood + gradients** (elevation/decay/light), then
   vary them per `docs/ART_VARIATION.md` (logical + deterministic).
3. Geometry should reflect the elevation trend (ascend rooms read as climbing).
   *(Current BIO-01 geometry is mostly lateral; evolve it toward this over time.)*
