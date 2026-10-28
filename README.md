# aahilafraz.com

Personal site of Aahil Afraz: engineer, designer, photographer, and the artist Azrael.

**Stack:** Vite · React 19 · TypeScript · Tailwind v4 · shadcn/ui + React Bits · GSAP (ScrollTrigger, SplitText) · Lenis · React Three Fiber · Cloudflare Workers

## Pages

| Route | What |
| --- | --- |
| `/` | Hero (WebGL glass), proof marquee, wins bento, "five sides" persona, stacked selected work, studio teaser, hire-me |
| `/work` | The Vault. Every project with results and receipts. Resume-linkable: `/work/<slug>` opens that project directly |
| `/studio` | Music player (persists across pages), Spotify + Apple Music embeds, photo gallery with lightbox |
| `/contact` | Inquiry form (emails via Resend) + Cal.com booking |

## Editing content

Everything lives in `src/content/`:

- `profile.ts`: bio, links, services, skills, **`calLink`** (your Cal.com link, e.g. `"aahilafraz/intro"`)
- `projects.ts`: the Vault. Slugs become `/work/<slug>` URLs
- `tracks.ts`: music. Put audio in `public/music/`, covers in `public/music/covers/`, add an entry per track
- `photos.ts`: photography. Drop originals into `/photos` (git-ignored) and ask Claude to convert them. Web versions land in `src/assets/photos/` as `<name>.jpg` + `<name>.thumb.jpg`, with sizes in `manifest.json`. Sets that must read left to right, edge to edge (carousel splits like `DPT1`, `DPT2`) go in `src/assets/photos/series-<key>/1.jpg, 2.jpg…`. Optional `captions` and `seriesTitles` in `photos.ts`

## Develop

```bash
npm install
npm run dev          # Vite dev server
npm run cf:dev       # production build + Worker locally (tests /api/contact)
npm run typecheck
```

## Deploy (Cloudflare Workers)

One-time secrets for the contact form:

```bash
npx wrangler secret put RESEND_API_KEY   # from resend.com
npx wrangler secret put CONTACT_TO       # where inquiries are emailed
```

Optionally set `CONTACT_FROM` (a sender on a domain verified in Resend) in `wrangler.jsonc` vars; otherwise Resend's onboarding sender is used.

```bash
npm run deploy
```
