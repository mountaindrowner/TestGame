# REPENTANCE — Level Grammar (the Score system)

> **What this is.** The *engineered* layer over `LEVEL_DESIGN.md`. That doc is the **why**
> (fairness, teach→escalate, lock-and-key, the wave). This doc is the **how we make it
> machine-checkable**: every environment is authored as a **Level Score** — an explicit
> *timeline of moments* built toward an outcome (Castlevania-style), and a **logic gate**
> proves the timeline actually delivers exploration + payoff before a single tile is final.
>
> Authority order unchanged: a Score that collides with a 🔴 in `LEVEL_DESIGN.md` is wrong.
> This is the *instrument*; that doc is the *music theory*.

---

## 0. The core idea — a level is a curated timeline, not a pile of rooms

Castlevania / Metroid levels aren't assembled room-by-room and hoped-into-shape. They are
**composed**: the designer decides the sequence of feelings and demands — *arrive, learn,
be tested, choose, struggle, breathe, climax, ascend* — and then carves geometry that
delivers exactly that. Repentance adds a metaphor on top: **fall → grace → mastery →
ascent**. The Score makes that sequence a first-class, declared artifact.

> **A level is made with an outcome in mind and a timeline of moments. Declare the timeline
> first; the geometry serves it.**

The pipeline:

```
   declare the Score   →   scaffold a greybox   →   refine in the editor   →   logic gate   →   build
   (levelScore.ts)         (__scaffold)             (?edit)                   (__score = ✓)     (art)
```

---

## 1. The beat vocabulary — the units a level is built from

Each **Beat** is one MOMENT, living in one composed sub-room. Its `role` is its job in the arc:

| Role | Its job | Tension |
|---|---|---|
| **arrival** | Establish place + mood; ask nothing hard. | lowest |
| **teach** | Introduce **one** mechanic/hazard **safely** (over solid ground). | low |
| **escalate** | Raise the stakes on a *taught* facet (over a pit/molten, combined). | rising |
| **branch** | A fork — critical path vs. an optional detour. | a beat to breathe + choose |
| **gauntlet** | A sustained demand — the hardest combat/traversal. | high |
| **breather** | Downtime / set-piece / rest — the trough between waves. | low |
| **gate** | A **lock**: needs a permanent ability/key to pass. | medium |
| **reward** | A **payoff**: pickup / ability / lore / shortcut. | varies |
| **finale** | The climax — the Warden / mini-boss. | peak |

Every beat also carries an **emotion** (the metaphor it advances): `collapse → stalked →
choice → struggle → grace → mastery → ascent`. The arc should move forward, not whiplash.

A beat declares its **facets** — the atoms of teach→escalate: what it `teaches` (first, safe
appearance) and what it `tests` (demands; must have been taught earlier). Facets are
free-form ids from a shared vocabulary: movement (`jump`,`dash`,`double-jump`,`grace-burst`),
combat (`combo`,`telegraph-light`,`telegraph-heavy`,`pursuer`,`ranged-dodge`), hazards
(`molten`,`pit`), gimmicks (`mirror-double`,`shatter`,`front-immune`), and keys/abilities
(`broken-memory`,`grace-burst`).

Lock-and-key uses two fields: a beat may be `lock`ed behind a facet, and a beat may `grant`
one. An **optional** beat locked behind a key granted **later** is the *planted come-back*
(LEVEL_DESIGN §4.2) — legal only if it pays off.

> Schema: `src/data/levelScore.ts`. The two shipped areas (`firstFallScore`,
> `houseOfMirrorsScore`) are the worked examples — copy one to start a new biome.

---

## 2. The logic gate — what makes a timeline *sound*

`validateScore` (`src/data/scoreValidate.ts`) is to *experience* what `roomValidate` is to
*map structure*. It composes the real world (`composeWorld`) and checks the Score against it:

- **Coverage** — every composed sub-room is a planned beat (nothing is "random"; §3.9).
- **Teach → test** — a facet's first appearance is always a `teach`, never a `test`
  (no mechanic's debut is its first chance to kill; §3.3 / 🔴#8).
- **Lock-and-key solvability (no softlock, 🔴#4)** — walking the *critical* beats in order
  while banking granted keys, every critical `lock` is already owned. A `lock` whose key
  comes later is only allowed on an **optional** beat that **pays off** (the planted
  come-back); a `lock` no one grants is *unobtainable*.
- **Payoff (🔴#5)** — every detour / `reward` beat declares a concrete prize.
- **The wave (§3.2 / §3.6)** — arrival is the gentlest; the finale is the peak; the critical
  path climbs; long levels need a breather/trough (load → breathe → load); no 4-in-a-row
  high-tension slog.
- **One new facet per room (§5.3)** — flags an inert beat or one that just repeats the last.
- **Emotional arc** — the metaphor advances; flags whiplash (e.g. grace before struggle).

Two severities, mirroring `roomValidate`: **error** = a 🔴 broken (fix before building);
**note** = a 🟢/🟡 worth a look. `__score(env)` prints the timeline + verdict; `__score()`
does every area.

### The timeline readout
`describeScore` renders the Score as a legible strip — ordered beats, a tension **sparkline**,
the key/lock graph (with `*` marking planted come-backs), and the verdict. This is the
"timeline of moments and events" made visible; read it to *feel* the level before walking it.

```
THE FIRST FALL  ·  "You hit the lowest place — then learn the kit and climb back up past the Warden."
  env=first-fall   7 beats   tension ▂▃▄▅▅▂█
  1  first-fall   arrival   ▂ 0.10 collapse  Wake mid-fall … learn move/jump/dash.
  2  descent      teach     ▃ 0.35 stalked   First blade-work … read the runner's lunge.
  3  crossroads   branch    ▄ 0.40 choice    A junction … drop to the memory, or press on.
  4  memory       reward    ▅ 0.55 struggle  A Striker guards the Broken Memory; take it, climb out.
  5* vault        gate      ▅ 0.50 mastery   A molten lake only the Grace Burst crosses (planted come-back).
  6  approach     breather  ▂ 0.15 grace     A quiet vaulted hall; torches lead toward the light. Breathe.
  7  gate         finale    █ 1.00 ascent    Read-and-weave the Warden; the gate opens toward the light.
  keys  broken-memory@memory   grace-burst@gate
  locks grace-burst→vault*     broken-memory→gate
  verdict ✓ logic gate passed · 0 notes
```

(The breather at beat 6 is the gate's own doing: the first draft of this score was a pure
ramp and the gate flagged it — THE LONG APPROACH room exists because the timeline demanded
a trough. That's the system working as intended.)

---

## 3. The scaffolder — intent becomes greybox

`scaffoldScore` (`src/data/scoreScaffold.ts`) turns a Score into a **greybox skeleton**:
each beat → a blocky room carved in the catacomb grammar, seeded with role/facet markers
(the taught enemy over solid ground; the hazard over a pit; the Grace-Burst lake; the key on
a pedestal; the elite + gate). Critical beats chain **east** into a spine; optional beats hang
**below** as drop-branches (a pit + a climb-out) — the same shape as our hand-built areas.

`__scaffold(env)` writes the greybox to the browser override store under `gb:<env>:<room>`
ids (never touching shipped rooms), then `__gotoRoom('gb:<env>:<first-room>')` walks it and
`?edit` refines it. This is **greybox-before-art** (§0.3) automated: the Score gives you a
playable first pass to prove the *sequence* is fun as grey blocks, then you shape it by hand.

> The scaffolder is a **starting point, not an oracle.** It places intent; it doesn't judge
> fun. Walk it, feel the pacing, move the blocks. Then run `__score` again — the gate still
> guards the door.

---

## 4. Authoring a new biome (the workflow, run literally)

1. **Write the Score** in `levelScore.ts` — the premise (the outcome), then the beats in
   order: arrival → teach the biome's signature facet → escalate → a branch with a planted
   come-back → gauntlet → a breather/set-piece → finale. Fill `teaches`/`tests`/`tension`/
   `emotion`/`lock`/`grants`/`payoff`. Set `assumed` to the kit carried in from upstream.
2. **Run the gate** — `__score('<env>')`. Drive it to ✓ (errors) and triage the notes. The
   readout *is* your design review.
3. **Scaffold** — `__scaffold('<env>')`, then `__gotoRoom` it. Does the *sequence* feel right
   as grey blocks? Re-order/re-tension beats in the Score until it does.
4. **Refine** — `?edit` each `gb:` room into real geometry (or author fresh rooms and point
   the Score's `room` ids at them). Keep the map-integrity validator green too.
5. **Re-gate, then build** — `__score` green + `roomValidate` green = the timeline is sound
   and the map is well-formed. Only now does it earn art (§0.3).

---

## 5. How this relates to the other docs

- `LEVEL_DESIGN.md` — the **rules** the gate enforces (the §/# citations in every warning
  point back here). The Score is how those rules stop being a checklist you *remember* and
  become a contract that *checks itself*.
- `WORLD_PLAN.md` — the per-room **prose** template (name/role/mood/why). A Beat is its
  executable form; keep them in sync (the prose explains, the Score enforces).
- `roomValidate.ts` — the **structural** gate (doors/links/reachability). `scoreValidate.ts`
  is the **experiential** gate. A level ships when both are green.
