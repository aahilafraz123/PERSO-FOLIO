# RELENTLESS — Build Log

Living tracker for building against [RELENTLESS-GDD.md](./RELENTLESS-GDD.md).
North star (GDD §0): **darkness → light. The torch radius grows as confidence is earned.**
If a feature doesn't serve that, cut it.

---

## Architecture decisions (how this implementation maps the GDD)

The GDD imagines one Phaser Scene per zone + Tiled maps. To ship all 6 zones with
quality fast, this build uses a **data-driven engine** instead:

- **One generic `ZoneScene`** renders any zone from a data block. 1 engine + 6 data
  blocks, not 6 hand-coded scenes. Zones drop in / reorder trivially.
- **ASCII tilemaps** in `src/data/story.js` (no Tiled dependency yet). Legend:
  `#` wall · `.`/space floor · `@` spawn · `S` sign · `M` monitor(modal) ·
  `*` skill shard · `>` exit portal · `G` grind/gate marker · `~` decor prop ·
  `N` npc. Real Tiled JSON can replace this later (GDD §1) without touching logic.
- **Procedural art** still (no external assets needed to run). BootScene generates
  themed floor/wall per zone palette + shared props. Real sprite sheets (GDD §9,
  §11.5) drop in by swapping the `make*` calls for `this.load.*`, keeping texture keys.
- **PC-screen artifacts = DOM modals** (GDD §4) overlaid on the canvas, not in-world
  Phaser text. Crisper, more readable, and lets the NASA email / résumé / contact
  look genuinely real. Game freezes while open; `relentless:screen` /
  `relentless:screen-close` events bridge game ↔ site.
- **Global `GameState`** (`src/systems/state.js`) persists XP / level / shards /
  achievements across scene changes.

```
src/
  data/story.js          # ALL zone content: maps, copy, shards, screens, achievements
  systems/
    state.js             # GameState singleton (xp, level, shards, achievements)
    LightSystem.js       # torch mask + growTo() per zone  ← the signature mechanic
    Hud.js               # XP bar, level, zone name, achievement toasts
  scenes/
    BootScene.js         # procedural themed textures + props + player sheet
    ZoneScene.js         # generic data-driven zone (world, interactables, transitions)
  entities/Player.js     # 4-dir movement (unchanged)
  ui/DialogueBox.js      # sign speech / cards (unchanged)
  site/
    site.css             # landing + read + immersive game chrome
    hero.js              # particle-initials title effect (GDD §7)
    screens.js           # DOM artifact modals (NASA email, résumé, contact…)
```

---

## Phase status (GDD §8 roadmap)

| Phase | GDD scope | Status |
|---|---|---|
| 1 — Skeleton | Vite+Phaser, movement, camera, collisions | ✅ done (v1) |
| 2 — Light | LightSystem, torch+embers+flicker, `growTo()` | ✅ upgraded — per-zone `growTo` |
| 3 — Interactables | signs, NPCs, PC-screen modal, NASA email | ✅ signs + DOM modals + NASA email |
| 4 — Zones 1–2 | Wilderness + Hollow, real copy | ✅ data-driven, both built |
| 5 — Zones 3–4 | Forge + Mission Control | ✅ built (Forge, Mission Control + NASA trophy) |
| 6 — Zones 5–6 | Arena + Horizon, contact CTA | ✅ built (Arena, Horizon + contact) |
| 7 — Polish | HUD/XP, achievements, sound, title, read-view, mobile, reduced-motion | 🔶 HUD/XP/achievements/title done · sound + mobile pending |

Legend: ✅ done · 🔶 partial · ⬜ not started

---

## Done

- GDD saved verbatim (`docs/RELENTLESS-GDD.md`).
- Site shell: landing (PLAY/READ fork) + editorial read view + immersive game toggle
  (navbar/chrome stripped in game; Esc/Exit returns). Lazy-boots Phaser only on PLAY.
- Canvas scale fix (full-viewport parent so Scale.FIT never clips bottom UI).

## Done — this pass (data-driven engine, verified)

- `state.js` GameState (XP/level/shards/achievements, persists across zones).
- `story.js` — all 6 zones as ASCII maps + copy/shards/screens/npcs/achievements.
- `LightSystem` — render-texture torch mask + `growTo()` per zone (verified: pool
  follows player, radius tween works).
- `Hud` — level + XP bar + zone name + achievement toasts.
- `ZoneScene` — generic engine: parses maps, builds walls/colliders, places signs/
  shards/monitors/npcs/portal, torch growth, intro, transitions. (Verified booting
  the Wilderness: player+torch centered, themed tiles, 4 shards, 5 interactables,
  portal present, no console errors.)
- Themed `BootScene` (per-zone floor/wall + props), `Player.idle()`.
- DOM screen modals (`screens.js` + CSS) — **NASA email verified rendering**
  faithfully (CRT bezel, Team Relentless callout, 1,290/11,500 framing). Plus
  rejections inbox, résumé boot-log, LearnFlow, AirCast, calendar gag, contact,
  read-hatch.
- Particle-initials title (`hero.js`) — "AA" assembles behind the name (verified).
- Removed obsolete `ForestScene.js` + `Torch.js`. Build compiles clean.
- **Sign/NPC dialogue moved to a DOM bar** (`dialogue.js` + CSS), viewport-pinned —
  the in-canvas box kept getting clipped when the canvas overflowed; a DOM overlay
  is immune to all canvas scaling. Game ↔ site via `relentless:dialogue` /
  `relentless:dialogue-close`. Removed Phaser `DialogueBox.js`. (Verified: bar
  renders fully on-screen, readable, speaker label + typewriter + hint.)

### Verification note
The headless preview tab is backgrounded → `requestAnimationFrame` is throttled,
so the game loop must be hand-stepped to test. That makes tween/timer *timing*
look off in this environment (e.g. intro lingering, torch growth slow); it runs
normally at real framerate in a focused browser. Confirmed via manual frame-pump
+ direct event dispatch + clean build + zero console errors. **Real playtest of
zone→zone transitions belongs in an actual browser tab.**

## Done — Prologue "The Room" (this pass)

The game no longer opens in the dark. It opens in a fake, given light that gets
taken — losing it is why you pick up the torch (the "lock in" as a mechanic).

- `PrologueScene` (Hybrid staging): **cold-open cards** ("Everything here is
  true." — verified rendering) → **the lit room** (verified: warm lamp pool,
  desk + glowing laptop, the seated kid, bed, door; `Applications: N · Interviews: 0`
  counter climbing) → **lights-out** (verified: room goes black, kid stands and
  becomes the torch-bearer, torch pool is the only light) → **control** (walk to
  the glowing door → hands off to Chapter I / Wilderness).
- `audio.js` — synthesized Web Audio SFX (no files): lamp hum, application
  whoosh, lights-out thud, torch crackle, ignite. Resumed on first user gesture
  in `main.js`. Sound is the narrator (no voice).
- Room art added to `BootScene` (floor_room, wall_room, desk, laptop, chair,
  kid_sit, bed, lamp, door) + restored the `light` glow texture (the rewrite had
  dropped it, which showed as Phaser's green missing-texture box — fixed).
- `BootScene` now opens on `prologue`; `gameConfig` scene list = [boot, prologue, zone].

### Not yet verified (needs a focused browser)
- **Audio playback** — synthesized SFX can't be confirmed headless; needs a real
  gesture + speakers. Logic is wired.
- **Walking to the door → Wilderness handoff** — the control phase and the
  fade-to-Chapter-I transition; couldn't drive real input under the rAF throttle.

## Done — The Guide / wayfinding (this pass)

Decision: **maximal hand-holding** — this is an interactive experience, not a
game, so nobody should ever be lost. Reconciled with the "light is earned" thesis
via **two languages of light**: warm torch = earned reward; cool cyan beacon =
guidance (visibly different, so leading the way for free doesn't dilute the fire).

- `Guide.js` — renders: an always-on **objective line** (plain words + progress
  `· N/total`), a **cyan beacon** (glow + bobbing chevron) that pierces the dark
  on the next beat, and a **flowing trail of light dots** from player → beacon.
- `ZoneScene` wiring: beacons the nearest un-done press-E beat (sign/screen/npc),
  advances on interaction (`markGuideDone` → `refreshGuide`), then points to the
  portal with the zone's exit label once everything's read. Clearer prompts
  (`[E] Read / View / Talk`). Lit after the intro clears.
- Verified in the Wilderness: beacon + chevron + 7-dot flowing trail rendering,
  objective `Follow the light — read what's here · 0/5`, cool-vs-warm light
  contrast correct, build clean.

### Not yet verified (needs a focused browser)
- Beacon **advancement** (read a beat → beacon hops to the next → after all,
  beacon → portal) — logic wired, but needs real interaction to watch it step.
- Objective line sitting cleanly up top once the intro fades (throttle artifact
  showed the intro overlapping in headless capture).

### Next (per the guided-corridors decision)
- Reshape the Wilderness map from open clearings into a tighter guided sequence
  so the beacon always has an obvious single next space to point to.
- Extend the Guide's objective copy per-zone (bespoke narration vs the generic
  "read what's here") and decide which beats each zone beacons.

## Done — v2 narrative overhaul (plan.md)

Closed the "mood without meaning" gap: every zone is now as legible as the
prologue. Four narration registers, all from `story.js` data:
- **prelude** — first-person entry cards before the title (skippable). Reuses the
  prologue card pattern.
- **thoughts** — the Guide objective line is now the inner voice, advancing by
  progress (no more "Follow the light · N/total"); tiny dim progress dots instead.
- **two-beat signs** — `{ quote, inner }`: press E for the artifact, again for the
  inner response. `dialogue.js` now PAGES (backward compatible with `text`).
- **revelation** — the metaphor spoken once (Forge), tied to a mid-zone `torchBeat`
  light jump after the pitch sign (Forge enters dim 125 → jumps to 172).
- **hidden grind exit** (`portalHiddenUntilRead`, Wilderness): no marked exit until
  every beat is read, then it reveals with "The way out was never handed to me…".
- Prologue silence line + Horizon closing card + the `contact` screen reveal
  ("I'm Aahil…") — the late reveal payoff.

Mark-done moved to overlay CLOSE (not open) so the beacon doesn't jump mid-read.
Whitelabel preserved (no employers/people in the game). Clean-spice default.

**Verified:** build clean; two-beat paging confirmed live (both pages + hint
changes screenshotted); engine boots the Wilderness with no console errors; guide
shows the first thought + progress dots; hidden portal reveals after all read with
the §8.1 line. Independent QA subagent: PASS, no copy drift, whitelabel clean, all
six zones legible to a stranger (§10 acceptance test).

**Owed to a human (§10):** the real acceptance test is a stranger playing once and
narrating the arc back — that's the playtest only Aahil can run.

## Backlog / next iterations

- Audio: torch crackle, footsteps, pickup chime, per-zone ambient pads that warm
  up zone 1→6 (GDD §11.7). One triumphant sting on NASA + Comcast beats.
- Real pixel-art sprite sheet for the protagonist (GDD §9) — swap procedural player.
- Real `nasa_email.png` screenshot (drop in `public/assets/screens/`) — currently
  rendered faithfully in HTML from the email text.
- Mobile on-screen D-pad + interact button.
- Forge "assemble the weapon" mini-beat; Arena calendar gag; pitch-stage applause.
- Tiled maps + tilesets per zone (GDD §11.5) replacing ASCII maps.

## Open questions for Aahil

- Real contact links (LinkedIn / GitHub / email) for the Horizon + read view.
- Confirm résumé specifics to surface in the in-game "résumé terminal" (Java,
  Python, Flask, SQL, Azure, certs AZ-900/AI-900/SC-900 from GDD §6/§11).
- Want the real NASA email screenshot in, or keep the styled HTML render?

---

## v3 — Interactivity pass (each chapter gets its own VERB)

Before this pass the only verb was READ (signs/screens/npcs) + walk-over shards, and
the torch grew automatically. Goal: make the darkness→light thesis *playable* and give
each chapter an interaction it couldn't do before. Built phase-by-phase, each verified
with the preview MCP loop + a DEV `window.__game` bridge (drives the game headlessly).

**New shared systems** (`src/systems/`):
- `TorchResource.js` — torch as a tended resource: in opt-in zones it decays while still,
  recovers while moving, dips on a `pulse()`. Hard-clamped to a `floor` so it's
  **atmospheric only** — never dies, traps, or blocks reading.
- `MiniGame.js` — canvas overlay for the forge-stoke + pitch-timing beats. Keyboard +
  pointer, freezes the world, **auto-resolves on a timeout** (never traps mobile/idle).
- `Fog.js` — world-space additive RT that "remembers" explored ground (cool, subtle).
- `stations.js` — marker→behavior registry so new interactables don't bloat ZoneScene.
  New map markers: `G` gate · `c` component · `A` anvil · `P` pitch · `W` workbench ·
  `o` data node · `B` meeting door · `V` vuln · `R` relic · `F` ember.

**Per-chapter verbs** (data in `src/data/story.js`, behavior in `ZoneScene`):
- **I Wilderness — ENDURE:** torch decay; rejection signs pulse the flame; locked OFFER
  gate (thud + shake, never opens — only the grind path works).
- **II Hollow — SHIP INTO THE VOID:** workbenches that ship real work with *no* reward
  (no XP/toast/chime — the silence is the point); shipping both reveals the exit.
- **III Forge — BUILD + PITCH:** gather 6 components → forge them at the anvil (stoke
  minigame) into a floating LearnFlow **companion** that adds light; the 150-users dot
  wall; step on the stage → pitch timing minigame → the torch JUMP + the one revelation.
- **IV Mission — DEPLOY:** wire 3 data-source globes into the control-room screens
  (links converge); all three → AirCast goes live (48h-sprint counter).
- **V Arena — OWN THE ROOM:** a gauntlet of meeting doors auto-joins as you pass
  (“Meetings today: N”); a hidden, flickering **auth-vuln** — a secret, gold-beaconed
  only after the main beats, granting the “Nobody Asked” achievement.
- **VI Horizon — FREE ROAM:** full daylight, no decay/fog/beacon; the contact terminal
  boots up and types itself line-by-line.

**Cross-cutting:** cert relics AZ-900/AI-900/SC-900 (hidden, “✦ Relics n/3” tracker,
“Certified” achievement) · sprint speed scales with the chapter · per-zone ambient pad
brightens 1→6 + torch crackle · `prefers-reduced-motion` skips shake & auto-passes
minigames · footstep-free juice (bursts, screen shake, applause).

**Guidance:** stays maximally guided — guided stations (workbench/component/anvil/pitch/
dataNode) join the beacon queue; secrets (vuln/relics) get a distinct **gold** beacon
after the story beats, so nobody is ever stuck but the curious get a real payoff.

**Bug fixes found via the end-to-end test:** the ZoneScene instance is reused across
`scene.restart`, so per-zone transients now reset on entry (`portal`, `companion`,
`_hub`, `_zoneFinished`, `_torchBeatFired`) — the Horizon finale was inheriting Arena's
destroyed portal. `LightSystem`/`Fog` `update()` now guard a torn-down RT (a restart can
fire one more update). Full playthrough verified: all 6 zone achievements fire in order.

A completionist run lands ~LVL 6 (≈ one level per chapter) — kept natural rather than
forcing an arbitrary round number.
