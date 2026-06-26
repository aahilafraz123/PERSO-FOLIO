# RELENTLESS

A top-down, pixel-art RPG portfolio. You walk a boxy character through the
real chapters of a journey — darkness to light — with a torch that's the whole
point: the screen starts suffocatingly dark and the light you carry grows as
the story does. The light *is* the confidence being earned.

> **v1 scope — "The Wilderness, perfected."**
> One zone. Nail the feel of a torch in the dark before pouring in the story.

## What's in v1

- One dark forest (40×30 tiles), top-down, with collision.
- Boxy player, 4-direction walk — **Arrows** or **WASD**.
- **The torch**: near-black overlay with a soft, flickering radial light that
  follows you, plus a rising ember trail.
- 3–4 readable **signs** carrying the rejection beats (press **E** / **Space**).
- A locked **OFFER** gate (the path beyond waits for Chapter II).
- A hidden **GRIND** side-path that, for now, shows a *"To be continued…"* card.

### Controls

| Key | Action |
| --- | --- |
| Arrows / WASD | Move |
| E / Space | Read a sign · advance / close text |
| Esc | Close text |

## Run it

```bash
npm install
npm run dev      # opens http://localhost:5173
```

Build for static hosting (Vercel / Netlify / GitHub Pages):

```bash
npm run build    # outputs to dist/
npm run preview  # serve the production build locally
```

## How it's built

- **[Phaser 3](https://phaser.io/) + [Vite](https://vitejs.dev/)**, plain JS.
- Pixel-perfect config (`pixelArt`, no antialias, `roundPixels`), camera zoom
  `1.75×` with smooth follow for the chunky DS look.
- **All art is generated procedurally at runtime** (see `BootScene.js`) so the
  project runs with zero asset files. It's structured so real sprite sheets
  drop straight in later — keep the texture keys (`player`, `tree0`, `grass`,
  `sign`, `gate`, `marker`, `ember`, `light`) and swap generation for
  `this.load.*` in `preload()`.

```
src/
  main.js               # boots the game
  config/gameConfig.js  # Phaser config, tile size, view size
  scenes/
    BootScene.js        # generates all placeholder textures + player sheet
    ForestScene.js      # the world, collisions, signs, gate, GRIND, input
  entities/Player.js    # movement + animation
  systems/Torch.js      # the darkness overlay + radial light (the core feature)
  ui/DialogueBox.js     # typewriter speech / card panels
```

## Roadmap (deferred — do not build until the slice feels right)

- Chapter II: the GRIND path → the hollow first quest (the co-op that taught
  the grind, told honestly, no names).
- LearnFlow, NASA (Global Nominee — the real email on a PC screen), Comcast.
- Widening torch radius per zone; XP / HUD / achievements.
- The landing portal + the clean "Read My Story" editorial view.

---

*Working title is the NASA Space Apps team name. It also just fits.*
