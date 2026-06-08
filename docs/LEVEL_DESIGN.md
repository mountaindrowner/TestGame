# REPENTANCE — Level Design Contract

> **Authority.** This doc governs **player experience, layout, fairness, flow, and the map**. On
> **code/architecture/APIs**, `DECISIONS.md` + the source win. On **asset/variation rules**,
> `ART_VARIATION.md` wins. On **game-feel constants**, `GAME_FEEL_RULES.md` + `Tunables.ts` win.
> When a design idea collides with a 🔴 below, the idea is wrong, not the rule.
>
> Distilled from a multi-talk "Level Design Bible" and adapted to *our* game. Read it before
> building/extending any room. Companion docs: `DESIGN.md` (meaning), `WORLD_PLAN.md` (per-room
> template + biome gradients), `GAME_FEEL_RULES.md` (movement feel), `ART_VARIATION.md` (asset
> grammar), `ENEMY_ART_SPEC.md` (enemy art/telegraphs).

**Priority tags:** 🔴 NON-NEGOTIABLE · 🟡 RULE (default; deviate only with a stated reason) ·
🟢 GUIDELINE (strong preference) · 💡 IDEA.

---

## 0. The five load-bearing ideas
1. **Mechanics first, levels second.** Build challenges out of mechanics already proven fun. Never
   design a room around an unproven mechanic.
2. **Difficulty lives in execution — never in confusion or unfairness.** A hard room asks you to
   *do* something hard; it never makes you *guess* what's safe or punishes what you couldn't see.
3. **Greybox before art, always.** Prove a room is fun as blocky geometry in the editor (`?edit`);
   only then does it earn final art. (Our procedural tiles mean greybox already looks decent — but
   the *layout* must be fun before any new PixelLab biome art is generated.)
4. **The map is the meta-level.** This is a roguevania: the interconnected world is the real
   "level." Design the world graph first, then carve rooms out of it.
5. **Watch what players do, not what they say.** Mark is the playtester; "feels off" is a design
   bug, not player error. Treat his suggested fix as a *symptom* — diagnose the real pain and solve
   that. (= GAME_FEEL_RULES playtesting.)

## 1. Our signature mechanic — keep it central (🔴, ties to §5.2)
REPENTANCE's core, which every required room must exercise:
- **The death → grace → return loop.** Failure is not the end; you rise in grace and try again.
  Rooms should make the *return* meaningful (checkpointing, momentum), never a dead, punishing slog.
- **Read-and-weave melee.** The 3-hit combo, dash i-frames, and **reading enemy telegraphs**
  (windup = danger flush, recovery = cyan vulnerable window). Combat rooms are about *reading and
  spacing*, not button-mashing.
- **Traversal feel** — tight-on-ground / floaty-in-air movement, coyote + jump-buffer + variable
  jump, dash burst (see §A).
- **Grace Burst** (planned air-dash, earned from the Warden) — our **first ability gate** (§4.2).

**The test:** if a generic character with no dash/combo/telegraph-reading could clear a required
room unchanged, the room isn't pulling its weight — redesign so the signature mechanic is the point.

---

## 2. The non-negotiables (🔴) — apply to all mandatory/critical-path content
1. **No leaps of faith.** Never force a blind jump to discover whether a drop is safe or lethal.
   Signal both (§3.1).
2. **No pixel-perfect timing on the required path.** Give breathing room. **Doubly true on touch** —
   a thumb on glass is imprecise; widen platforms, lengthen windows. Design gaps to the *real*
   numbers in §A, not guessed ones.
3. **No unavoidable damage / cheap hits.** Every hit must be the player's fault. Give time to see a
   threat and room to dodge. (Our enemies telegraph — preserve that; ENEMY_ART_SPEC.)
4. **No softlocks.** Never gate mandatory progress behind a consumable/non-renewable resource. Our
   ability gates (Grace Burst, etc.) are fine because abilities are **permanent**. The Broken Memory
   key sits in-place and is re-grabbable on respawn — never let a required key be permanently lost.
5. **No pointless dead ends.** A dead end must pay off (pickup, upgrade, lore, secret, shortcut).
   *(Auto-flagged by the editor: a ≤1-connection room with no key/gate reward.)*
6. **Hazards/pits legible before you commit.** The camera must reveal danger while you can still
   choose not to enter. Telegraph hazards; build room geometry and camera framing together (§3.7).
7. **Tight controls are sacred.** Never paper over loose movement with layout. Celebrate good
   movement; don't expose its flaws. (GAME_FEEL_RULES owns the feel; layouts must honor it.)
8. **Teach safely, then test dangerously.** Every mechanic/hazard's *first* appearance costs nothing
   (over solid ground); only later does it appear over molten/pits. No mechanic's debut is also its
   first chance to kill.
9. **The core mechanic stays central** (§1). No required room drifts into off-theme reflex-testing.
10. **Transitions are consistent and never strand the player.** *(Mostly already enforced by our
    architecture — see §4.)* Triggers fill the corridor (no jumping over into the void), spawn is
    decoupled from trigger size, doors/links use stable ids in one source of truth, edge transitions
    fire just past the screen edge. *(Reciprocity/reachability auto-flagged by the editor.)*

---

## 3. The craft (how we satisfy Part 2 in practice)

### 3.1 Readability & a consistent signal language 🟡
- **Legible terrain + clear affordances.** Solid/standable, harmless background, and hazard must
  each read distinctly and consistently. A platform that reads as scenery (or vice-versa) is a
  fairness bug. Establish it in greybox — art won't save an ambiguous layout.
- **Our signal language (use everywhere):**
  - **Lethal** = molten tiles (`Sem.MOLTEN`) and open pits below the room floor — our established
    "don't" pattern. Keep it consistent across biomes.
  - **Safe drop** = a breadcrumb of torches/pickups leading down into the gap (a trail says "this
    way, and it's safe" with no UI).
  - **Danger telegraph** = enemy windup flush / hazard wind-up; **opening** = cyan recovery glow.
- Guide the eye and feet with breadcrumbs (pickups, torch placement, enemy positions).

### 3.2 Difficulty curve 🟡
- **Ramp gradually**, within a room and across the biome. **Easy at the entrance, hardest near the
  end** (before the Warden). Never open a biome with its toughest section.
- **You are not the player.** Calibrate to a newcomer.
- **Spacing is difficulty.** A too-tight jump isn't "hard," it's unfair (#2). Put difficulty in
  *execution*, not margin-of-error. Make `WORLD_PLAN.md`'s per-room *role* an explicit difficulty
  step: arrival(easy) → teach → branch → gauntlet(hard) → finale.

### 3.3 Teach → escalate 🟡
For every mechanic/gimmick/hazard: **(1) introduce safely → (2) a beat to understand → (3) escalate**
into progressively fiendish arrangements. Same element, climbing stakes. Spend **one new facet per
room** (§5.3); never the same beat twice in a row.

### 3.4 Gimmicks & hazards 🟡
- **One or two signature gimmicks per biome**, so each region has its own flavor (not "jump and
  fight" everywhere). Choose BIO-02's gimmick to *pair with Grace Burst*.
- Menu: crumbling/falling platforms · blinking blocks · springs · swinging hazards · timed gates ·
  wind/current zones · one-way platforms · crushers · **rising molten** · darkness/limited light ·
  moving platforms (the workhorse: teach over ground, escalate over pits).
- Every gimmick obeys Teach→Escalate and the signal language.

### 3.5 Rewards & risk/reward 🟢
- **Reward good play.** Tuck treats behind optional hard sections. The gold pattern: an optional
  tough detour that pays a meaningful pickup **and** opens a shortcut loop.
- **Reward placement is a difficulty dial** — dangling a prize over a risky route lets the player
  self-select difficulty.

### 3.6 Set pieces & downtime 🟢
- **Set pieces** (giant graves, vast machinery, distant flame) make a biome memorable. Place them in
  **downtime rooms** — low/no-threat spaces to breathe before the next demanding stretch. Pace
  tension like a wave: load, breathe, load, breathe. Downtime rooms host rest points + reveals.

### 3.7 The camera is a design tool 🟡
Its job: **reveal obstacles fairly and in time to react.** If a hazard won't read in-frame, pare the
obstacle down or design the camera (bounds/framing/lead) to present it. Build level + camera
together. (We use Arcade camera follow with a deadzone; respect it when placing threats.)

### 3.8 Mobile / touch 🔴/🟡
- 🔴 **Input forgiveness.** Lean on our coyote time + jump buffer; widen landing zones. This is how
  we honor #2 on glass.
- 🟡 **Thumb-zone awareness.** On-screen controls occlude the **bottom corners**. Never place
  critical threats/reveals/landings where the player's thumbs sit. Keep the action in the visible
  band. (Our `TouchControls` live bottom-left/right.)
- 🟡 **Readable at phone size + short sightlines.** Don't rely on long-range info the small frame
  can't show. If a greybox is ambiguous at phone size, fix the *layout*.

### 3.9 Scope & density 🟡
**Right-size everything to its content.** Never let a space feel empty — every stretch must give
*something* (challenge, reward, threat, reveal, lore, choice). Density is the cure for empty; if an
area feels thin, enrich or shrink it — never pad. (= ART_VARIATION's "no dead space," + #5.)

---

## 4. Metroidvania architecture (the map)
> Most of the *system* half is already built this session — `src/data/levelGraph.ts` (single source
> of truth), the editor's link editor + **map view**, transition triggers, spawn decoupling, stable
> door ids, and the override/validation layer. This section is the **design** half + the rules that
> system already satisfies.

### 4.1 Design the world as a web, explored freely 🟡
Rooms are a graph, not a list. Give each region strong identity (distinct gimmick §3.4, art mood,
landmark §3.6) so the player builds a mental map. Space mandatory gates so the world opens in
satisfying pulses; surround the critical path with optional rooms that reward the curious.

### 4.2 Lock-and-key via permanent abilities 🔴-in-spirit (= #4)
The defining loop: hit a barrier you can't pass → explore → gain a **permanent ability** → return to
pass it. **BIO-02 is our first real instance:** **Grace Burst** (air-dash) is earned from the
Warden, so:
- **Plant visible "come back here" barriers** that need the air-dash *before* the player has it
  (a too-wide gap, a high ledge) — the return is a planned payoff, not a surprise.
- **Make backtracking rewarding** — old dead ends now open; pair every "come back" gate with a real
  reward on the far side (#5).
- **Shortcuts that loop back** — push deep, then unlock a one-way door/gate back to a hub/earlier
  room. Build these loops on purpose.

### 4.3 Spawn vs. entry-door model (our specifics)
- **Edge links** (`room.links.{east,west,up,down} → roomId`): walk off that side → arrive just
  inside the opposite edge of the neighbor. Used for seamless horizontal travel.
- **Doors** (`spawn.type='door'` with `id`, `to`, `toEntry`): deliberate press-↑ transitions. On
  arrival the player spawns **at the door whose `id === toEntry`** in the destination — the spawn
  point is the *entry door's tile*, **independent of any trigger size** (#10). One-way doors are a
  valid shortcut; the editor notes (not errors) an unmirrored *edge* link.
- **Rest/checkpoint** (§4.7): place at downtime rooms, hub junctions, and before the Warden. Save
  spacing is a tension dial. *(Our grace-respawn is the in-room checkpoint today.)*

### 4.4 Reward total exploration 🟢
Secrets in the map's corners, hidden upgrades, a completionist's itch. Design corners worth flying
into. (Future: fog-of-war map reveal — see DECISIONS "Minimap / fog-of-war".)

---

## 5. Mechanic integration

### 5.1 Three-lens test 🟡 — score any new mechanic/gimmick before committing
1. **Originality** — fresh, or a trope with a creative hook?
2. **Integration** — how well is it woven into the level design? (A familiar idea used beautifully
   beats an original one bolted on.)
3. **Quality** — do controls/layout/feel do it justice?
If it scores low on integration or quality, fix that before adding more mechanics.

### 5.2 Core does the heavy lifting (= #9). Keys/buttons/blocks are welcome but must **route through**
the signature mechanic, never sit beside it.

### 5.3 / 5.4 One new facet per room, force every facet 🟡
Each room featuring a mechanic reveals/demands **one new facet** and challenges it freshly. Across
the biome, require *every* property (e.g. for Grace Burst: distance, then over a pit, then chained
with ground-dash/double-jump, then used in combat) — don't let players coast on the easy dimension.

### 5.5 Anti-patterns to actively avoid 🔴
- **Exploitable "feature"** (cheese that trivializes challenge) — close it or design around it.
- **Non-renewable gate** (= #4).
- **Unwinnable wall** — always guarantee a path forward from any reachable state.
- **Can't-miss enemy** (= #3) — always a skill-based dodge.
- **Off-theme room** (= #9).

### 5.6 Idea Bank 💡 (raw material — run each through Teach→Escalate + the three-lens test)
- **Hazards/gimmicks:** rising molten · crumbling ledges · blinking blocks · springs · pendulums ·
  timed gates · wind/current zones · one-way platforms · crushers · darkness/limited light · moving
  platforms.
- **Ability gates (all permanent):** double-jump (already) · dash (already) · **Grace Burst air-dash
  (next)** · wall-cling/jump · ground-pound · grapple/tether · a light source (dark regions) ·
  phase/shrink. Each should retroactively open earlier planted barriers (§4.2).
- **Room archetypes:** tutorial-safe · escalation gauntlet · risk/reward fork · optional
  challenge + shortcut · downtime/set-piece · ability-gate antechamber · hub junction · secret
  nook · mechanic-gated boss (the Warden is one — unbeatable until you can read+weave; still fair to
  execute once equipped).

---

## 6. Workflow & checklists (run literally)

**Build order:** (0) confirm mechanics are locked → (1) brainstorm ~20 rough obstacles → (2) rank by
difficulty → (3) group into a rising ramp → (4) **greybox in the editor** → (5) expect to deviate for
three reasons [(a) doesn't fit the camera → pare/reframe; (b) doesn't fit the physics → keep the
*spirit*, rebuild to §A's real numbers; (c) isn't fun → add stakes / remove the safe camp spot] →
(6) welcome emergent obstacles → (7) playtest, diagnose the real pain (not the literal fix) → (8) art
**last**.

**Before building a stage:** mechanics proven? · ranked/grouped ramp? · region's 1–2 gimmicks? ·
critical-path vs optional + which ability gates? · rest/downtime placed? · read §A's real movement
numbers?

**Before "fun-complete" (playtest-ready):** every mechanic taught safely first (#8)? · no leaps of
faith, drops signaled (#1/3.1)? · no pixel-perfect timing, zones widened for touch (#2/3.8)? · no
unavoidable hits (#3)? · no consumable-gated progress (#4)? · every dead end pays off (#5)? · camera
reveals every obstacle in time (#6/3.7)? · difficulty rises to the end (3.2)? · signature mechanic
central — a generic character couldn't solve it (#9/5.2)? · ≥1 risk/reward choice (3.5)? · readable
at phone size, nothing critical under thumbs (3.8)? · every space earns its size (3.9)?

**Before "done" (art-ready):** playtested + pain diagnosed (Step 7)? · transitions fire past the
edge, triggers fill the corridor, spawn independent of trigger, paired by stable id in
`levelGraph` (#10) — *editor checks green*? · planted "come back later" barriers are paid off and
reachable once the ability exists (§4.2)? · layout locked — art won't be asked to fix design?

---

## Appendix A — Real movement numbers (design to these)
From `src/data/Tunables.ts` (`World`, `PlayerTune`). **Tiles are 16px.** Treat these as *maxima* —
for a fair required jump on touch, stay comfortably inside them (~75%). Re-derive if the constants
change.

| Capability | Constants | Reach | In tiles |
|---|---|---|---|
| Single jump height | `jumpVelocity -312`, `gravity 900` | ~54 px | ~3.3 |
| Double-jump total height | `+ doubleJumpVelocity -270` | ~95 px | ~5.9 |
| Single-jump horizontal gap (full run) | `runSpeed 140`, airtime ~0.69 s | ~95 px | ~6 (max) |
| Dash distance (with i-frames) | `dashSpeed 300 × dashDurationMs 150` | ~45 px | ~2.8 |
| Forgiveness | `coyoteMs 90`, `jumpBufferMs 110` | grace after a ledge / early press | — |

**Practical guidance:** comfortable required gap ≤ **4 tiles** (single jump), ≤ **5** with a clear
run-up; required jump-up ledge ≤ **3 tiles** (single) / ≤ **5** (double). Dash crosses ~**2–3 tiles**
of pit. **Grace Burst** (air-dash) is not implemented yet — design BIO-02's *return* gates to need
roughly one extra dash-length of air reach, and finalize the number when the ability ships.
