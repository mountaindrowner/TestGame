# REPENTANCE — Design Notes

> Source of truth: `docs/Repentance_Overworld_Map.pdf` (the overworld map prototype).
> This file summarizes it for quick reference. Build decisions are tracked in
> `/root/.claude/plans/precious-discovering-emerson.md` and `CLAUDE.md`.

## The idea
A Dead Cells–inspired **roguevania** that is a **playable metaphor for repentance** — an art
project. Not preachy, not overtly religious; the raw human core: hope, persistence, grace,
getting back up. The non-gendered cloaked figure stands in for the player/the person.

**The metaphor IS the mechanic.** The roguelite loop is the message:

> Failure → Return → Fight again → Learn → Go deeper → Fall again → Be restored again.

Design principle (from the PDF): *"The player does not respawn because they are strong. The
player respawns because grace refuses to let the story end there."*

## World — The Inward Wilderness
- **[HUB-01] The Place of Return** — respawn hub; light-beam reappearance, upgrades, weapon
  select, NPC encouragement, shortcuts. Visual: small camp, broken altar, warm light, banners.
- **Goal:** **[END-01] The Mercy Seat**. **Final boss [BOS-05] The Voice That Says Stay Dead** —
  the temptation to stop returning (replays your deaths, corrupts the respawn beam, then you
  return stronger). Victory = the loop of despair is broken; you return with hope, not shame.

### Three routes rise from the hub, converging at the Altar of Surrender:
- **Shame:** The First Fall → House of Mirrors → Court of Condemnation → **The Accuser**
- **Desire:** Old Habits → Market of Want → Tower of Control → **The False Self**
- **Hidden Wound** (locked): Hidden Wound → Pit of Numbness → Hollow Chapel → Field of Ash

### Keys as meaning
Broken Memory (face what you buried) · Witness Mark (no longer defined by failure) · Surrender
Seal (stop saving yourself by control) · **Grace Burst** (grace gives *movement*) · Quiet Flame
(hope when feelings are gone).

## Level 1 — [BIO-01] The First Fall (what we're building first)
"The moment of collapse." Readable, fair, tutorialized. Cracked ground, simple traps, early
branching. Enemy family: **Impulse Runners**, Regret Crawlers, Shame Sparks, Hollow Strikers.
Exits → House of Mirrors, Market of Want (Hidden Wound if Broken Memory unlocked).

## Locked feel (from Q&A)
Handcrafted map · roguelite restart (keep permanent upgrades + unlockable moves) · quick door
transitions · small/tight Level 1 · fast & fluid combat · pure blade combos · dash/dodge i-frames ·
full traversal kit over time · **full grace-burst respawn cinematic** · The First Fall descends.

## Tone guardrails
Heavy but not hopeless. Enemies are symbolic/abstract embodiments of struggles, never cartoon
sin. Grace-respawn must feel like mercy, never punishment. (Per PDF: places like Hollow Chapel
mean "performance without surrender," NOT "church bad.")
