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
| **THE LONG APPROACH** (`approach`) | Breather/set-piece · **ascend** | "A quiet hall; the torches lead toward the light." | none (true downtime) | A vaulted colonnade, no threats — the trough of the tension wave before the Warden (§3.6). |
| **THE SEALED GATE** (`gate`) | Finale · **ascend toward light** | "The way up is guarded — get back up past it." | **The Warden of the Fall** (armored Runner kin) | The gate (the way out/up); brightest grace-light; the telegraph-and-weave boss. |

**Onward:** the gate exits the biome upward — next Shame biome is **House of Mirrors**
(per DESIGN.md). Each subsequent biome gets its own table like this before we build it.

## BIO-02 — "House of Mirrors" (Shame route, second) — from Mark's concept sheet
"Identity distortion. Confront the lie." A shattered reflection of self; the architecture bends,
doubles, deceives. **Signature ability of the area: Grace Burst** (air-dash, earned from the Warden)
— rooms are bigger/taller and built around it (lock-and-key per `docs/LEVEL_DESIGN.md`). Violet/
indigo palette, silver mirror sheen, cold glass light (vs the depths' warm flame).
- **Roster (6):** Mirror Double (clone that mimics your last action, shatters when hit) · Glass
  Witch (caster; reflective zones redirect projectiles) · Reflection Hound (fast; intangible on
  mirrored surfaces) · False-Face Duelist (parries/counters; uses hanging mirrors) · Fracture Wisp
  (splits into shards when hit) · Looking-Glass Sentinel (immune from the front; flank/reflect).
- **Mini-boss — "The Untrue Image":** your reflection at its worst; copies your weapon + movement,
  punishes aggression. States: idle/stalk · mirror dash · weapon copy · aggression punish · shatter
  phase · defeated. Mirror form takes reduced damage; break the core, not the illusion.
- **Gimmicks (1–2 signature, rest as accents):** shattered mirrors (break → shards; spawn Doubles) ·
  reflective floors (enemies intangible on them) · upside-down/gravity arches · distortion fog
  (obscures, speeds enemies) · mirror obelisks (redirect projectiles) · hanging mirrors (swing/slash).
- **Status:** **playable & beatable, with the full 6-enemy roster** — a 5-room area (hall → gallery
  → Grace-Burst climb → threshold → the Untrue Image arena), entered when the BIO-01 gate opens;
  broken-mirror backdrop, lavender-brick tileset, PixelLab wall mirrors, the mini-boss → completion.
  The roster (Mirror Double, Reflection Hound, Glass Witch, False-Face Duelist, Fracture Wisp,
  Looking-Glass Sentinel) is in and placed — the **Mirror Double wears the player sprite** as your
  reflection. **Next increments:** the mirror gimmicks (reflective floors, breakable mirrors, gravity
  arches, distortion fog…), dedicated roster art (shared tinted placeholders today), and a true
  reflection sprite for the boss. Greybox new rooms in the editor before art (LEVEL_DESIGN workflow).

## BIO-03 — "The Court of Condemnation" (Shame route, third) — BUILT (playable, beatable)
"Stand accused." A towering tribunal of the damned that pronounces you guilty; the metaphor's
answer is the **Witness Mark** — *no longer defined by your failure*. Higher than the House of
Mirrors (the ascent continues) → more intact, monumental masonry; cold verdict-light from above
vs the depths' warm flame. **Authored entirely through the Score pipeline** (`courtOfCondemnationScore`
in `src/data/levelScore.ts`): the timeline was declared, the logic gate passed it (✓ 0 errors,
▂▃▄▅▅▆▂█), and the scaffolder greyboxed all 8 rooms (`__scaffold('court-gate')` → composes 204×32).
The rooms below are the declared beats — to be refined by hand, then earn art.
- **Signature gimmicks:** the **GAVEL** (a timed verdict-crusher — teach the rhythm over solid
  ground, escalate over pits) and the **VERDICT-GAZE** (a roaming judging spotlight).
- **Key:** the **Witness Mark** (found at the Witness Stand, guarded; opens the High Tribunal —
  the lock-and-key beat, like the Broken Memory opened the gate). **Boss:** **THE ACCUSER**,
  which grants the **Quiet Flame** on defeat — back-unlocking the planted Sealed Evidence vault.

| Room (id) | Role · Elevation | Mood | Faces | Signature / why |
|---|---|---|---|---|
| **THE OUTER GATES** (`court-gate`) | Arrival · ascend | "Judged the moment you enter." | first gavel (safe) | Statue-lined approach; teaches the gavel rhythm over solid ground. |
| **THE HALL OF ACCUSATION** (`court-hall`) | Teach · ascend | "A light that hunts you." | wardens under the gaze | Introduces the verdict-gaze spotlight; first court fight. |
| **THE DOCK** (`court-dock`) | Branch · ascend | "Defend, or press on." | falling gavels | The fork: up to the Witness Stand, or onward to the tribunal. |
| **THE WITNESS STAND** (`court-witness`) | Reward · ascend | "Speak for yourself." | a Bailiff (heavy) | Guards the **Witness Mark** key. |
| **THE SEALED EVIDENCE** (`court-evidence`) | Gate · ascend (optional) | "What they buried." | condemning dark | Planted come-back: needs the **Quiet Flame** (earned from the Accuser). Pays a relic + ember. |
| **THE GAUNTLET OF VERDICTS** (`court-gauntlet`) | Gauntlet · ascend | "Everything, at once." | gavels+gaze+Bailiff | The peak before the breather — gavels over pits, the gaze, a heavy foe. |
| **THE ANTECHAMBER** (`court-antechamber`) | Breather · ascend | "One steady candle." | none | Downtime trough before the verdict (§3.6). |
| **THE HIGH TRIBUNAL** (`court-tribunal`) | Finale · ascend toward light | "Answer the charge." | **THE ACCUSER** | Show the Witness Mark; break the gavel, not yourself. Grants the Quiet Flame. |

**Onward:** the Accuser felled, the Shame route converges on the Altar of Surrender (DESIGN.md).
**Status: BUILT + WIRED.** The 8 rooms are real (`src/data/rooms/court.ts`, seamless composed
192×52 world); the **GAVEL** + **VERDICT-GAZE** are implemented data-driven hazards (GameScene
`makeGavel`/`makeGaze`, spawn extras `period/phase/range`); the **Witness Mark** is a real key
(`key` spawn `grant:'witness'`); **THE ACCUSER** is a live elite (warden kit, verdict-gold) whose
fall grants the permanent **Quiet Flame** that opens the `flameseal` in the Sealed Evidence; the
Untrue Image's hall now has the onward gate (lift → Sanctuary → court). Logic gate ✓ 0E/0N with
full coverage. **Next:** the Court's own enemy roster + tileset/parallax (PixelLab; Bailiff is a
tinted Striker today), and gavel/gaze art polish.

## How to use this
1. Before authoring/re-skinning a room, write its template line (above).
2. Place assets to satisfy **role + mood + gradients** (elevation/decay/light), then
   vary them per `docs/ART_VARIATION.md` (logical + deterministic).
3. Geometry should reflect the elevation trend (ascend rooms read as climbing).
   *(Current BIO-01 geometry is mostly lateral; evolve it toward this over time.)*
