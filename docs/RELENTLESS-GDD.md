# RELENTLESS — Game Design Document
### A playable portfolio. The story of Aahil Afraz.

> Working title is **RELENTLESS** — a callback to NASA Space Apps "Team Relentless," and an accurate description of the protagonist. Feel free to rename.

---

## 0. The Thesis (read this first — everything serves it)

**Light from darkness. Confidence earned through grind.**

The player begins in near-total black with a tiny torch flame. They can only see a few tiles around them. As they move through the zones of Aahil's real journey, **the torch radius grows** — the world gets brighter, the fog of war recedes, the player can see further ahead.

This is not a cosmetic effect. It is the entire emotional argument of the game:

- Early game (rejection / the hollow co-op) = dark, disorienting, can't see the path.
- Late game (LearnFlow → NASA → Comcast) = bright, open, the player moves with certainty.

The growing light maps 1:1 to the real arc: *"intelligence is empowering my confidence, which is something I lacked growing up."* Build everything around this. If a feature doesn't reinforce darkness→light, cut it.

**Art direction:** Top-down 2.5D pixel art (Pokémon DS / Stardew Valley / Zelda: A Link to the Past lineage). Chunky, boxy, "Minecraft-y" protagonist sprite. Nostalgic but modernized — crisp pixels, smooth lighting, particle embers off the torch, soft bloom. Cozy-but-cinematic.

---

## 1. Tech Stack

**Primary recommendation: Phaser 3** (`phaser` npm package).

- Mature 2D game framework, perfect for tile-based top-down RPGs.
- Built-in **Light2D pipeline** (`Lights` + `setPipeline('Light2D')`) — gives you the torch glow for free, or use the mask approach below for more art control.
- Tilemap support: design maps in **Tiled** (free editor, exports JSON), load with `this.load.tilemapTiledJSON`.
- Sprite animation, arcade physics for collisions, camera follow, scene management (each zone = a Scene).
- Huge docs + examples.

**Lighter alternative: Kaplay (formerly Kaboom.js).**

- Faster to prototype, very fun, great for this exact aesthetic, less boilerplate.
- Lighting is more manual but the radial-mask approach (below) works great.
- Choose this if you want to move fast and keep the codebase tiny.

**Recommendation:** Start in Phaser 3. It scales better to 6 zones, scene transitions, and the PC-screen modal system. Use Vite for the dev server (`npm create vite@latest`), plain JS or TS.

```
relentless/
├─ index.html
├─ src/
│  ├─ main.js            # Phaser game config, scene list
│  ├─ scenes/
│  │  ├─ BootScene.js    # preload assets
│  │  ├─ TitleScene.js   # landing / "press start"
│  │  ├─ Zone1_Wilderness.js
│  │  ├─ Zone2_Hollow.js
│  │  ├─ Zone3_Forge.js
│  │  ├─ Zone4_MissionControl.js
│  │  ├─ Zone5_Arena.js
│  │  └─ Zone6_Horizon.js
│  ├─ systems/
│  │  ├─ LightSystem.js  # torch + growing radius
│  │  ├─ Player.js       # movement, animation
│  │  ├─ Interactable.js # PC screens, signs, NPCs
│  │  └─ Hud.js          # XP bar, level, zone name
│  └─ data/
│     └─ story.js        # all narrative copy in one place
├─ assets/
│  ├─ sprites/           # player, tiles, props
│  ├─ maps/              # Tiled JSON
│  └─ screens/           # nasa_email.png, learnflow_demo.png, etc.
└─ package.json
```

---

## 2. The Light / Torch System (the signature mechanic)

Two ways to do it. The **mask approach** gives the most art control and the clearest "torch radius grows" feeling.

### Mask approach (recommended)

A full-screen black overlay sits above the world. A radial-gradient "hole" is punched out around the player, sized by `torchRadius`. Increase `torchRadius` on zone transition.

```js
// LightSystem.js — NEW
export default class LightSystem {
  constructor(scene) {
    this.scene = scene;
    this.torchRadius = 90;        // starts small (dark)
    this.flicker = 0;
    // dark overlay covering the whole camera
    this.darkness = scene.add.renderTexture(0, 0, scene.scale.width, scene.scale.height)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(1000);
    // soft radial light texture (a white circle with feathered edge), made once
    this.lightTex = this.makeLightTexture(scene, 256);
  }
  makeLightTexture(scene, size) {
    const key = 'torchLight';
    if (scene.textures.exists(key)) return key;
    const c = scene.textures.createCanvas(key, size, size);
    const ctx = c.getContext();
    const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
    g.addColorStop(0,   'rgba(255,255,255,1)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.6)');
    g.addColorStop(1,   'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
    c.refresh();
    return key;
  }
  // call every frame with player screen position
  update(px, py) {
    this.flicker = Math.sin(this.scene.time.now / 90) * 4; // ember flicker
    const r = this.torchRadius + this.flicker;
    this.darkness.clear();
    this.darkness.fill(0x05060a, 0.97);              // near-black night
    this.darkness.erase('torchLight', px - r, py - r); // punch the hole
    this.darkness.setScale((r * 2) / 256); // scale handled per-draw below if needed
  }
  // grow the light when entering a new zone (confidence ↑)
  growTo(radius, ms = 1500) {
    this.scene.tweens.add({ targets: this, torchRadius: radius, duration: ms, ease: 'Sine.easeInOut' });
  }
}
```

**Torch radius per zone** (tune to taste):

| Zone | Radius | Feeling |
|---|---|---|
| 1 — Wilderness | 80 | suffocating, lost |
| 2 — The Hollow | 110 | slightly more, still murky |
| 3 — The Forge | 170 | you can see your work |
| 4 — Mission Control | 230 | clarity, the world stage |
| 5 — The Arena | 320 | bright, in command |
| 6 — The Horizon | full | daylight, open sky |

Add **embers**: a small particle emitter on the player tinted orange/gold, low gravity, short lifespan. Sells the torch.

---

## 3. Character + Controls

- **Sprite:** boxy, chunky pixel character (Minecraft-Steve-meets-Pokémon-trainer). 4-direction walk cycles (up/down/left/right), 3 frames each. Idle = torch-bob animation.
- **Movement:** arrow keys **and** WASD. Arcade physics body for collisions with walls/props.
- **Interact:** `E` or `Space` when near an interactable (PC screen, sign, NPC) → opens a modal or speech box.
- **Mobile:** on-screen D-pad + interact button (optional, add later).

```js
// Player.js — NEW (core movement)
export default class Player {
  constructor(scene, x, y) {
    this.scene = scene;
    this.sprite = scene.physics.add.sprite(x, y, 'player', 0);
    this.sprite.setCollideWorldBounds(true);
    this.speed = 130;
    this.cursors = scene.input.keyboard.createCursorKeys();
    this.wasd = scene.input.keyboard.addKeys('W,A,S,D,E,SPACE');
    // define 'walk-down','walk-up','walk-left','walk-right' anims in BootScene
  }
  update() {
    const s = this.sprite, c = this.cursors, k = this.wasd;
    let vx = 0, vy = 0;
    if (c.left.isDown  || k.A.isDown) vx = -this.speed;
    if (c.right.isDown || k.D.isDown) vx =  this.speed;
    if (c.up.isDown    || k.W.isDown) vy = -this.speed;
    if (c.down.isDown  || k.S.isDown) vy =  this.speed;
    s.setVelocity(vx, vy);
    if      (vx < 0) s.anims.play('walk-left',  true);
    else if (vx > 0) s.anims.play('walk-right', true);
    else if (vy < 0) s.anims.play('walk-up',    true);
    else if (vy > 0) s.anims.play('walk-down',  true);
    else             s.anims.stop();
  }
}
```

---

## 4. Interactable PC Screens (incl. the NASA email)

The bridge between "game" and "read the real résumé." When the player walks up to a glowing CRT/monitor sprite and presses interact, a **modal overlay** opens showing real artifacts. This is cleaner and more readable than painting the image onto a tiny in-world screen.

**Your NASA email goes here.** Drop `nasa_email.png` into `assets/screens/`. When the player interacts with the monitor in Zone 4, fade in a dark modal with the screenshot framed inside a retro terminal/monitor bezel, plus a one-line caption: *"Team Relentless — 2025 NASA Space Apps Global Nominee. One of ~1,290 teams out of 11,500+ projects worldwide."*

```js
// Interactable.js — NEW (modal pattern)
export function openScreenModal(scene, { title, imageKey, caption, body }) {
  const w = scene.scale.width, h = scene.scale.height;
  const layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(2000);
  const bg = scene.add.rectangle(0, 0, w, h, 0x05060a, 0.92).setOrigin(0).setInteractive();
  const frame = scene.add.rectangle(w/2, h/2, Math.min(900, w*0.9), Math.min(620, h*0.85), 0x10131c)
    .setStrokeStyle(2, 0x00d9f5);
  const t = scene.add.text(w/2, h*0.12, title, { fontFamily:'monospace', fontSize:'18px', color:'#00d9f5' }).setOrigin(0.5);
  layer.add([bg, frame, t]);
  if (imageKey) {
    const img = scene.add.image(w/2, h/2, imageKey);
    const maxW = Math.min(840, w*0.84), s = maxW / img.width;
    img.setScale(s);
    layer.add(img);
  }
  if (caption) layer.add(scene.add.text(w/2, h*0.84, caption,
    { fontFamily:'monospace', fontSize:'12px', color:'#8888aa', align:'center', wordWrap:{width:w*0.7} }).setOrigin(0.5));
  bg.on('pointerdown', () => layer.destroy());
  scene.input.keyboard.once('keydown-ESC', () => layer.destroy());
  return layer;
}
```

**Other screens to add the same way:** a LearnFlow demo screen (GIF/screenshot of the app), an AirCast map screen, a "résumé terminal" that prints your bullet points line-by-line like a boot log, and a LinkedIn/GitHub/email contact terminal in the final zone.

---

## 5. The Six Zones (your real story, mapped)

Each zone is a Phaser Scene. Player enters dark, the torch `growTo()` fires on entry, they explore, hit interactables, collect a "skill shard," then a door/portal loads the next scene.

### ZONE 1 — THE WILDERNESS *(the rejection arc)*

- **Real chapter:** First co-op cycle. Zero interviews across A, B, and C rounds. A brutal job economy.
- **Setting:** A dark, foggy forest. Torch is tiny. Dead ends. Locked gates.
- **Props:** scattered "signs" (interact to read) bearing real rejection-speak — *"We've decided to move forward with other candidates," "We'll keep your résumé on file," "Position closed."* A locked gate marked **OFFER** that won't open yet.
- **Beat:** The player wanders, frustrated, the path unclear. This is the point. The only way out is a side path most players miss at first — labeled **"GRIND."** Taking it unlocks Zone 2.
- **Skill shard collected:** `Resilience`.
- **Achievement:** *"Still Standing — 0 offers, didn't quit."*

### ZONE 2 — THE HOLLOW *(the first co-op)*

- **Real chapter:** First role. Under-structured, isolating — but the place that taught the grind, and where real technical work got done (Redis caching layer; Angular→React migration across 30+ components; −25% bundle, −35% load time).
- **Setting:** A half-built dungeon / office that looks like a quest hub but is mostly empty. Flickering lights. Doors that lead nowhere. Long stretches of silence (literally — fewer NPCs, gaps where you'd expect contact).
- **Tone (IMPORTANT):** keep it **honest, not bitter.** No company name, no shade. The story is *"the hollow place that forged the grind,"* not a callout. This protects your corporate goal and reads stronger.
- **Props:** a workbench where you can interact to "ship" two real things (Redis layer, React migration) — each ships with a satisfying particle pop and a stat bump. One PC screen showing a placeholder landing page with a wry caption about learning what *good* structure looks like by living without it.
- **Skill shards:** `Grind`, `Self-Reliance`, `React`, `Redis`.
- **Achievement:** *"Forged in the Quiet — learned the grind the hard way."*

### ZONE 3 — THE FORGE *(LearnFlow)*

- **Real chapter:** Co-Founder & Founding Engineer. 150+ beta users. 6-pipeline context-assembly retrieval system. System-wide OCR (Google Vision), Whisper transcription, GPT-4 explanations, Electron desktop architecture, Supabase schema linking everything. 30+ hour weeks. Presented at the startup expo, pitch fest, to 5+ professors and faculty.
- **Setting:** A bright, warm workshop/forge. The torch jumps in size here — **this is where the light really starts to grow.** Anvils, glowing schematics, a crafting bench.
- **Beat:** This is the "build your own weapon" chapter. The player assembles LearnFlow piece by piece — each system (OCR, transcription, retrieval pipeline, DB) is a component you "forge" into a single glowing artifact. Then a **pitch-stage** mini-moment: step onto a lit stage, NPCs (professors, classmates) gather, you "present," applause particles, XP surge.
- **Props:** an interactive demo screen of LearnFlow; a wall of 150 tiny glowing dots = beta users; the forged "LearnFlow" artifact that now floats with you and brightens your torch.
- **Skill shards:** `Founder`, `Full-Stack`, `RAG/Retrieval`, `Electron`, `Pitching`.
- **Achievement:** *"Built the Weapon — 150+ users, 30-hour weeks, your own thing."*

### ZONE 4 — MISSION CONTROL *(NASA Space Apps)*

- **Real chapter:** Team Relentless. **2025 NASA Space Apps Global Nominee — ~1,290 teams of 11,500+ projects worldwide.** AirCast: AI air-quality forecasting on NASA TEMPO satellite data + OpenAQ + OpenWeather, 6-hour AQI predictions, deployed on Azure with GitHub Actions CI/CD, Google Maps + Chart.js viz.
- **Setting:** A control room under a star field. Big windows to space. Satellite imagery on the walls. Cooler, cleaner palette (cyan/violet). Torch is now wide — you can see the whole room.
- **The trophy moment:** the central **PC monitor shows your real NASA email screenshot** (`nasa_email.png`) via the modal system. This is the artifact you specifically wanted in-game. Frame it in a retro monitor bezel with the caption above.
- **Props:** an AirCast map screen with little pollutant markers (NO2/O3/PM2.5); a globe you can spin; the email terminal as the centerpiece.
- **Skill shards:** `NASA`, `Geospatial`, `Azure/CI-CD`, `Teamwork`.
- **Achievement:** *"Global Nominee — stood out on a world stage."*

### ZONE 5 — THE ARENA *(Comcast — current)*

- **Real chapter:** First real corporate environment, and dominating. Product (built with Naresh) referenced in a CTO-level meeting. Pitched directly to Paul. Called out for good work by the boss's boss. A calendar so packed you joined the intern capstone 30 minutes late because of conflicting meetings — more meetings in a week than teammates have in a month.
- **Setting:** A bright corporate tower interior. Glass, lots of **meeting-room doors** lining the halls. The torch is barely needed now — you carry your own light. This is the "you've arrived" capital city.
- **The calendar gag:** a wall calendar you can interact with that's *absurdly* full — visual comedy that's also true. Teammates' calendars (interact) show 2 meetings; yours overflows the screen.
- **Beat:** Walk the halls, duck in and out of meeting rooms (each is a quick interaction: "Daily Standup," "Product Sync w/ Bimal & Junaid," "Naresh — 3x daily"). The climax: a boardroom where you **pitch to Paul** and the boss's-boss NPC drops a line of real praise. Product gets named in the CTO room.
- **Tone:** confident, not arrogant. Let the meeting volume and the praise *show* the dominance; don't have the character announce it.
- **Skill shards:** `Corporate`, `Impact`, `Ownership`, `Discipline`.
- **Achievement:** *"In the Arena — named in the CTO room, pitched to Paul."*

### ZONE 6 — THE HORIZON *(the unwritten chapter)*

- **Real chapter:** The future. The drive to be 35 and free — to spend these years locked in, hammer down, then explore, grow, and learn for love of it. The self-directed, curious person you're becoming.
- **Setting:** Out of the buildings entirely. Open field, sunrise, full daylight — **no torch needed, the whole world is lit.** The arc completes: darkness → light, fully.
- **Beat:** A quiet, open space. A single sign or terminal: the contact/CTA — email, LinkedIn, GitHub, "let's build something." This is also the "Read My Story" escape hatch back to the clean résumé view for recruiters who want the plain version.
- **Closing line idea:** *"The story's still being written. The torch was never the point — learning to see in the dark was."*

---

## 6. Systems: XP, Skill Shards, Achievements

- **Skill shards** = collectible pickups scattered in each zone, each tied to a real skill from your résumé (Java, Python, React, Electron, Flask, SQL, Redis, REST APIs, Azure, CI/CD, PostgreSQL, etc.). Picking one up = small XP + a HUD toast.
- **XP bar + Level** in the HUD (top of screen). Total XP fills as you collect shards and clear zones. Land on a satisfying round number at the end (e.g., LVL 28 — your real "level").
- **Achievements** = the per-zone unlocks listed above; toast pops bottom-right (you already have this pattern in the HTML prototype — reuse the feel).
- **Certifications as relics:** AZ-900, AI-900, SC-900 can be hidden "relic" pickups for completionists.

---

## 7. The Landing / Title Screen

Reuse the energy from the HTML prototype: particle initials (**AA**) assemble then explode into the title. Then the same fork:

- **▶ PLAY MY STORY** → loads Zone 1 (the game).
- **📄 READ MY STORY** → the clean editorial résumé page (recruiter-friendly, no game required).

Keep both. The game is for people who love the craft; the read view is for the busy recruiter. Both should be one click from the title.

---

## 8. Build Roadmap (so Claude Code can do it in passes)

1. **Phase 1 — Skeleton:** Vite + Phaser, BootScene, one test scene, player movement (arrows/WASD), camera follow, collisions. *Get the boxy guy walking around a room.*
2. **Phase 2 — Light:** add `LightSystem`, torch + embers + flicker, `growTo()` on scene start. *Get the dark-with-torch feeling right before anything else — it's the whole vibe.*
3. **Phase 3 — Interactables:** signs, NPCs, the PC-screen modal. Wire in the NASA email screenshot. *Prove the game↔artifact bridge works.*
4. **Phase 4 — Zones 1–2:** build Wilderness + Hollow with Tiled maps and real copy.
5. **Phase 5 — Zones 3–4:** Forge + Mission Control (the LearnFlow forge moment + NASA trophy room).
6. **Phase 6 — Zone 5–6:** Arena + Horizon, contact CTA.
7. **Phase 7 — Polish:** HUD/XP, achievements, sound (footsteps, torch crackle, pickup chimes, ambient pads per zone), title screen, the Read-My-Story view, mobile controls, `prefers-reduced-motion` fallback.

Ship Phase 1–3 first and play it. The torch-in-the-dark with a walking box and one readable NASA screen is already a *vibe* — everything after is content.

---

## 9. Art & Audio Assets to gather

- **Player sprite sheet** (4-dir walk, boxy). Make in Aseprite, or grab a CC0 base from itch.io / OpenGameArt and recolor.
- **Tilesets** per zone (forest, dungeon, workshop, control room, office, field). Tiled + a cohesive 16px or 32px pixel tileset.
- **Screens folder:** `nasa_email.png` (you have it), LearnFlow screenshot/GIF, AirCast map shot, contact card.
- **Audio:** torch crackle loop, footstep, pickup chime, zone ambient pads (dark→warm→bright progression mirrors the light), one triumphant sting for NASA + Comcast moments.
- **Font:** keep a pixel font for in-world UI (e.g. "Press Start 2P" used sparingly) + a clean mono/sans for the modal résumé text so it stays readable.

---

## 10. Copy to lift directly (portfolio-safe, written for the public)

- **Title tagline:** *"Most of it happened in the dark. Press start anyway."*
- **Zone 1 sign:** *"Round A: no. Round B: no. Round C: no. The path was never lit — so I made my own light."*
- **Zone 2 plaque:** *"No structure, no map, long silences. I learned the grind by living without anything else."*
- **Zone 3 stage:** *"Built it myself. 150 users, thirty-hour weeks, pitched to anyone who'd listen."*
- **Zone 4 terminal caption:** *"Team Relentless — 2025 NASA Space Apps Global Nominee. ~1,290 teams of 11,500+, worldwide."*
- **Zone 5 boardroom:** *"First time in the room. Named in the CTO meeting. More meetings in a week than most have in a month — and grateful to be the one carrying the load."*
- **Zone 6 closing:** *"The story's still being written. The torch was never the point — learning to see in the dark was."*

---

## 11. Tools, Libraries & Assets (the full stack)

> Verified current as of June 2026. License key: **CC0** = use freely, no credit. **CC-BY** = must credit the author. **MIT** = free incl. commercial. Prefer CC0/MIT for anything tied to a professional portfolio; track CC-BY credits in a `CREDITS.md`.

### 11.1 — Recommended stack (TL;DR)

| Surface | Stack |
|---|---|
| **Landing page** | React + Vite + Tailwind · GSAP (ScrollTrigger + SplitText) · one react-bits/Aceternity hero · one React-Three-Fiber particle scene · spotlight/flashlight component (echoes the torch) |
| **Game** | Phaser 3 + Vite · `phaser3-rex-plugins` (CRT on monitors, glow/bloom on torch) · Tiled maps from LimeZu/Ansimuz tilesets · recolored Mana Seed character · Pixabay + jsfxr audio · HydroGene 16-bit music |

### 11.2 — Landing page: animation

- **GSAP** — `npm i gsap` — **MIT, 100% free incl. all plugins since April 2025** (Webflow made the previously-paid Club plugins free). Use:
  - `SplitText` → letter/word reveals on the name.
  - `ScrollTrigger` + `ScrollSmoother` → scroll-choreographed section reveals, pinning, the darkness→light scroll narrative.
  - `MorphSVG` → shape morphs between PLAY/READ portals.
  - With React: `npm i @gsap/react`, use the `useGSAP()` hook (auto-cleanup, scoped selectors).
  - Rule of thumb: CSS handles ~80% of UI animation; reach for GSAP for timeline sequencing, complex scroll choreography, runtime control.
- **Copy-paste component libraries** (own the code, no heavy dep — fits Claude Code workflow):
  - **react-bits** (`reactbits.dev`) — modular peer-deps; many components are pure-CSS zero-dependency. Best for text effects (BlurText, GradientText, ShinyText) and dark hero backgrounds (Aurora, StarField). **Start here.**
  - **Aceternity UI** (`ui.aceternity.com`) — React + Tailwind + Framer Motion. Has a **Spotlight/flashlight** effect (use it — it's the torch thesis on the web), 3D cards, beams, sparkles, gradient cursor backgrounds.
  - **Magic UI** (`magicui.design`) — animated beams, retro grids, neon gradients. Pairs with Aceternity.
  - ⚠ These are aesthetic-first; add manual `prefers-reduced-motion` handling to every copied component.

### 11.3 — Landing page: WebGL / 3D

- **React Three Fiber** — `npm i three @react-three/fiber @react-three/drei` — declarative Three.js. Classic hero: ~800 particles in 3D space drawing lines between near neighbors (3D version of the prototype's particle initials). Use `drei` for `<Stars>`, loaders, controls. Memory: dispose geometry/material on unmount.
- **tsParticles** — `npm i @tsparticles/react @tsparticles/engine` — 2D particle backgrounds without full 3D.
- **Reference sites to study before building** (these prove the playable-portfolio concept and won Awwwards):
  - Thibault Introvigne — controllable spaceman + 10 collectibles that each reveal a past role. *This is literally RELENTLESS's concept.*
  - WoraWork — cozy top-down Zelda/Animal-Crossing world; interact to reveal the dev's story. *The nostalgic top-down vision.*
  - The Monolith Project — scroll-driven 13-scene story, sketches → lit 3D worlds (R3F + GSAP). *Reference for darkness→light as scroll narrative.*

### 11.4 — Game: Phaser plugins & FX

- **Phaser 3.60+ built-in FX** (no plugin): `Glow`, `Bloom`, `Bokeh/TiltShift`, `Displacement`, `ColorMatrix`, `Gradient`. Apply via `gameObject.postFX.add*()` / `preFX`.
  - **Glow + Bloom** → torch flame, gold shard pickups, the marker beacon.
  - **Displacement** (with a noise texture) → heat-haze around the torch.
- **rexrainbow plugins** — `npm i phaser3-rex-plugins` — large free ecosystem. Key picks:
  - **CRT post-fx shader** → put on the in-game monitors so the NASA email screen has authentic scanlines/curvature. (Also `Toonify` outline, `Shockwave` for ship-it pops + boss reveal.)
  - **Glow filter** → per-object pulse on interactables.
  - **Perlin noise** → drive torch flicker + fog with real noise instead of a sine wave.
- **Particles** — Phaser's built-in emitter (emit/death zones, color-ease over lifespan). Powers torch embers, pitch-stage applause, pickup sparkles.
- **Torch implementation** — two paths: (a) render-texture mask from §2 (simpler, most art control — **use this first**); (b) Phaser `Light2D` pipeline + `PointLight` following the player (real lighting if tiles have normal maps).

### 11.5 — Game: pixel art assets

| Pack | License | Use in RELENTLESS |
|---|---|---|
| **Kenney** (`kenney.nl`) | CC0 | Safe no-credit base: UI, fonts, audio, props. Mix-and-match friendly. |
| **Modern Interiors / Modern Exteriors** (LimeZu, itch.io) | paid, cheap | Zone 5 Arena (office tower), Zone 3 Forge (workshop interiors). Gold standard contemporary top-down. |
| **Ninja Adventure Pack** (itch.io) | CC0 | Complete top-down character + tileset; great free placeholder protagonist. |
| **Mana Seed character base** (itch.io) | check pack | Recolor into the boxy protagonist (4-dir walk). |
| **Ansimuz** RPG/forest packs (itch.io) | CC0 (legacy collection) | Zone 1 Wilderness forest, Zone 2 Hollow. |
| **µFantasy Tileset** (0x72, itch.io) | CC0 | Dark forest / dungeon fallback tiles. |
| **"Ultimate pixel art effects pack"** (itch.io) | check | Pre-made torch fire, explosions, sparkles, magic — saves hand-animating FX. |

- Firehose filters: `itch.io/game-assets/assets-cc0/tag-top-down`, `itch.io/game-assets/assets-cc0`, `kenney.nl`.
- **Tooling:** **Aseprite** (make/edit sprites — paid ~$20 or compile free from source) · **Tiled** (free map editor → export JSON straight into Phaser `load.tilemapTiledJSON`).

### 11.6 — Fonts

- **Press Start 2P** (Google Fonts, free, OFL) — canonical 8-bit font; **headers/HUD only**, used sparingly.
- **Kenney fonts** (CC0) + itch.io pixel-font packs — readable in-world text.
- **JetBrains Mono** — modal résumé / long text (pixel fonts are unreadable in paragraphs).

### 11.7 — Audio

| Source | License | Notes |
|---|---|---|
| **Pixabay** (`pixabay.com/sound-effects`) | CC0, no attribution | **Start here.** Dedicated "pixel game" SFX. |
| **Kenney audio** | CC0 | UI / impacts / power-ups matching the art. |
| **Freesound** (`freesound.org`) | filter CC0 | 600k+ samples: footsteps, torch crackle, ambience. |
| **Sonniss GDC bundle** | royalty-free, commercial, no attribution | Gigabytes of pro libraries. |
| **jsfxr / ChipTone** | free tools | Browser 8-bit SFX generators (laser/jump/pickup/powerup) → export WAV. Use for shard-pickup + achievement chimes. |
| **HydroGene "16-bit RPG Music"** (itch.io) | CC0 | 28 SNES-style tracks — zone ambient pads that warm up as the torch grows. |
| **Kevin MacLeod** (`incompetech`) | CC-BY (credit required) | Classic indie-game music; only if you maintain CREDITS.md. |

**Audio-to-light mapping:** pick zone ambient tracks that brighten in key/instrumentation Zone 1→6, so the *sound* arcs darkness→light alongside the torch. One triumphant sting reserved for the NASA email reveal and the Comcast boss-praise beat.

---

*Hand this whole file to Claude Code. Start with Phase 1–3. Keep the thesis — darkness to light — as the north star for every decision.*
