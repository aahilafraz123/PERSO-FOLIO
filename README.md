# RELENTLESS

A portfolio that isn't a page — it's an experience you can **read** or **play**.

Live: **[aahilafraz.com](https://aahilafraz.com)**

Most engineering portfolios are a list. This one is a story about going from
zero interviews to a seat in the arena, and it gives you two honest ways through
it: a clean editorial bio if you have five minutes and a coffee, or a top-down
pixel-art RPG if you'd rather walk the dark with a torch and find the story
yourself. Same story, two doors.

---

## The idea

The whole thing is built on one image: **darkness to light.**

When you play, the screen starts almost black. You carry a torch, and the only
part of the world you can see is the small circle of light around you. As you
move through the chapters — the rejections, the grind, the first thing that
actually shipped — the light grows. The torch radius *is* the confidence being
earned. The mechanic and the message are the same thing. Nothing in the build
survives if it doesn't serve that.

## How it all connects

The site is one front door with three rooms, routed by URL hash so any view is
directly shareable and survives a refresh:

| Route | What it is | Who it's for |
| --- | --- | --- |
| `#/` | **Landing** — the portal. Pick your path. | Everyone |
| `#/read` | **Read My Story** — the journey as a fast, clean editorial bio across four chapters (Wilderness → Forge → World Stage → Arena). | Recruiters, skimmers |
| `#/play` | **Play My Story** — the RPG. Same four chapters, walked with a torch in the dark. | Anyone who wants to feel it |
| `#/vault` | **The Vault** — the receipts. Every real project with proof: NASA Global Nominee, 150+ users, the work that actually shipped. | Anyone evaluating the work |

Read and Play are the *same narrative* in two registers. The Vault is the proof
underneath both. Choosing **Play** strips the site chrome and lazily boots the
game engine, so a recruiter reading the bio never pays the cost of downloading a
game they didn't ask for.

## Tech stack

Deliberately lean — no framework on the site shell, no asset pipeline for the
game.

- **[Vite](https://vitejs.dev/)** — build tool and dev server. Outputs a fully
  static `dist/` with no backend.
- **[Phaser 3](https://phaser.io/)** — the game engine, lazy-loaded only when
  you hit Play.
- **Vanilla JS + CSS** — the entire site shell (landing, read, vault, routing,
  animations) is hand-written, no React/Vue/framework.
- **HTML Canvas + Web Audio** — the torch lighting, particle fields, and sound
  are all generated in code.
- **100% procedural art** — every sprite, tile, and texture in the game is
  generated at runtime in `BootScene`. The game ships with **zero image
  files**.
- **Hosting:** Cloudflare Pages (static CDN) with Git-connected continuous
  deploys. Push to `main` → live in seconds. Custom domain on Cloudflare.

The result: the editorial story loads in a few KB of gzipped JS/CSS, and the
heavy game engine only loads on demand.

## Architecture

The game is **data-driven** instead of hand-coded per level. One generic engine
renders any zone from a data block, so chapters can be added or reordered
without touching engine logic.

```
src/
  main.js                 # site shell: hash routing, lazy game boot, vault logic
  config/                 # Phaser config, tile/view constants
  data/story.js           # the chapters as ASCII tilemaps + narrative data
  game/boot.js            # boots / sleeps the Phaser game on demand
  scenes/
    BootScene.js          # generates ALL textures + the player sprite at runtime
    PrologueScene.js      # the cold open
    ZoneScene.js          # the one generic engine that renders every zone
  entities/Player.js      # movement + animation
  systems/
    LightSystem.js        # the torch — darkness overlay + radial light (the core)
    Fog.js, TorchResource.js, Guide.js, Objective.js, MiniGame.js, stations.js
    Hud.js, audio.js, state.js
  site/                   # the non-game website
    screens.js, cards.js, dialogue.js, hero.js, site.css
```

## Run it locally

```bash
npm install
npm run dev       # http://localhost:5173
```

Build and preview the production bundle:

```bash
npm run build     # → dist/  (static, deploy anywhere)
npm run preview   # serve the built bundle locally
```

Node 20+ (pinned to 22 via `.nvmrc`).

## Deploy

It's a static site, so any static host works. This one runs on **Cloudflare
Pages**:

- Build command: `npm run build`
- Output directory: `dist`
- Production branch: `main`

Every push to `main` triggers a rebuild and redeploy. Pull requests get their
own preview URL. Hash routing means no redirect/rewrite rules are needed.

---

*Working title borrowed from the NASA Space Apps team name. It fit.*
