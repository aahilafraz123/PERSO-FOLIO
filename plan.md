# RELENTLESS — Narrative & Feel Overhaul (v2 spec)
### For Claude Code. Implement against the existing repo. Do not rebuild — extend.

> **North star (unchanged from the GDD):** darkness → light. The torch radius is confidence
> being earned. If a change doesn't serve that, cut it.
>
> **What v2 fixes:** right now the game has *mood without meaning*. A stranger who plays it
> feels the dark and the torch, but never learns **who they are, what actually happened, or
> why it mattered.** All the real story lives in the `#/read` editorial view; the game only
> shows the pull-quotes. This spec closes that gap **without** dumping paragraphs onto signs —
> by adding a narration layer the game currently lacks, in the protagonist's own voice.

---

## 0. How to use this document

1. Read §1–§4 first (the model + the rules). Everything downstream depends on them.
2. Implement the engine changes in §5–§6 **in the pass order given in §9**. Ship the spine before the polish.
3. The full rewritten copy for all six zones is in §7. Treat it as the source of truth — paste it into `src/data/story.js` exactly, including the new fields.
4. §8 is the art/symbolism layer. §10 is the acceptance test — the game isn't done until a stranger can pass it.

The existing architecture is good. Keep it: one generic data-driven `ZoneScene`, all content in `story.js`, DOM bridges (`relentless:dialogue`, `relentless:screen`) for readable overlays. We are adding fields and three small systems, not refactoring.

---

## 1. The core diagnosis (why this work is needed)

The **prologue is the best storytelling in the project** — applications climb, "Interviews: 0" never moves, the lights die, the torch ignites, you walk into the dark. It *narrates* a complete story with almost no words. Every zone after it only *decorates*: a 2.6s title card, a wayfinding beacon that says "read what's here," and signs that are one-line fragments written **for a reader who already knows the story.**

So the player gets atmosphere, never events. v2's job: **make every zone as legible as the prologue already is.**

Three structural holes to close:

- The game never establishes **who you are** (you're an anonymous box; your name only appears on the landing).
- The Guide's always-on objective line is the most-read text in the game and it's spent on "Follow the light" — wasted narrative real estate.
- `dialogue.js` already does typewriter + could page, but every sign is a single caption — a speech system fed captions.

---

## 2. The voice (read this before writing or pasting any copy)

All new narration is **first person, the protagonist's real voice — blunt, confident, specific, self-aware.** Rules:

- **Short.** Fragments are good. "Zero. Not one." beats a full sentence.
- **Specific = power.** Keep the real numbers: 3 rounds, 0 interviews, 30-hour weeks, 150+ users, 1,290 of 11,500, −25% bundle. Numbers are what make a stranger believe it.
- **Show dominance, never announce it.** Let meeting-volume and praise carry it. No "I'm the best." Ever.
- **Name your own flaws.** The self-awareness (AI'd through school, thin resume) is what makes the confidence land instead of read as bragging. Keep it in.
- **Contempt is allowed at situations, never at named people or employers.** The Hollow can have bite; it cannot have a target.
- **Universal hooks.** Lead each chapter with the feeling a stranger shares (effort into silence, a dead-end that taught you, betting on yourself), then ground it in the specifics. This is an art piece meant to resonate with anyone who's felt it — write the open door first, the resume second.

### Spice dial (profanity)

The copy in §7 is written **clean-but-blunt** by default, because the audience is "anyone who feels it" — including faculty and recruiters you've shown work to. The raw cadence is preserved without the curse words. A few lines have an optional rawer variant marked `[raw alt: …]`. Aahil chooses per line; default to the clean version unless told otherwise. Do **not** invent new profanity beyond what's flagged.

---

## 3. Whitelabel rules (hard constraints — non-negotiable)

The existing logic is already correct; preserve it exactly.

- **Never name the employers.** First co-op = "The Hollow." Current company = "The Arena." No brand names, ever.
- **Never name real people.** Managers, the CTO, teammates, the grad-student "manager" stay generic: "a director," "leadership," "my manager," "a grad student."
- **Never shade a named target.** The Hollow is "honest, not bitter" — contempt for the *absence of structure*, not for an identifiable company.
- **DO name his own things.** `LearnFlow`, `NASA Space Apps`, `Team Relentless`, `AirCast` are his projects and achievements — naming them is the whole point and is safe. (They're already named in `#/read`.)
- The fix for "which level is the current job?" is **not** to name it — it's to make the *arc* legible (a true unnamed anchor: "first real corporate room," "co-op #2") so the player places the chapter without the brand.

---

## 4. The layered-narration model (the design at a glance)

Four registers, each delivered by a different mechanism. A player should move through all four per zone:

| Register | Question it answers | Mechanism | New? |
|---|---|---|---|
| **Prelude** | *What is this chapter?* | timed first-person cards on zone entry (reuse the prologue card pattern) | **NEW** (`prelude`) |
| **Inner voice** | *What am I thinking right now?* | the Guide's always-on objective line, rotating per progress | **NEW** (`thoughts`) |
| **The moment** | *What happened + how it felt?* | two-beat signs: press E for the artifact, press again for the inner response | **CHANGED** (`signs` → objects) |
| **The meaning** | *What did it all mean?* | one earned symbolism beat, tied to the torch visibly growing | **NEW** (`revelation`) |

Guarantee the first three (every player gets them). Let the fourth feel discovered, not lectured. Say the metaphor **out loud exactly once** (§8.3) — more than once kills it.

---

## 5. Data model changes — `src/data/story.js`

Add four fields to each zone object and change the shape of `signs`. **Keep backward compatibility:** if `signs[i]` is a string, treat it as `{ quote: string, inner: null }`.

**Before (current shape, per zone):**

```js
{
  key, chapter, name, subtitle, torchRadius, wallStyle, next, portalLabel, palette,
  intro: ['TITLE', 'subtitle line'],
  map: [...],
  signs: ['string', 'string', ...],
  shards: [...],
  screens: [...],
  npcs: [...],
  achievement: { title, desc },
}
```

**After (additions marked `// NEW`):**

```js
{
  key, chapter, name, subtitle, torchRadius, wallStyle, next, portalLabel, palette,
  prelude: ['line', 'line', ...],            // NEW: 2–4 first-person entry cards, shown before the title card. Skippable.
  intro: ['TITLE', 'subtitle line'],         // keep (still the big title card)
  thoughts: ['line', 'line', 'line'],        // NEW: inner-voice lines fed to the Guide objective slot, advanced by progress
  revelation: 'line' | null,                 // NEW: the one legible-symbolism beat for this zone (most zones: null)
  torchBeat: { afterSignIndex: n, growTo: r } | null, // NEW: optional mid-zone torch jump tied to reading a specific sign
  portalHiddenUntilRead: false,              // NEW: if true, the exit portal stays hidden until all signs are read (Wilderness uses this)
  map: [...],
  signs: [{ quote: 'string', inner: 'string' }, ...], // CHANGED: objects (string still accepted = quote only)
  shards: [...],
  screens: [...],
  npcs: [...],
  achievement: { title, desc },
}
```

---

## 6. Engine changes — file by file

### 6.1 `src/site/dialogue.js` — make it page

The sign overlay must support **multiple pages** so beat 1 (quote) → beat 2 (inner) work on repeated E/Space.

- `show(payload, speaker)` where `payload` is either a string (current behavior) or an array of strings (pages).
- Internal `pages = Array.isArray(payload) ? payload : [payload]`, `pageIndex = 0`.
- Typewriter runs per page. Press E/Space/Enter:
  - if the current page is still typing → complete it (existing behavior);
  - else if `pageIndex < pages.length - 1` → advance to next page, reset typewriter;
  - else → `close()` (existing behavior).
- The hint label `▸ E / Space` becomes `▸ E / Space` while more pages remain, and `▸ E to close` on the last page. Esc always closes immediately.
- `relentless:dialogue` detail becomes `{ pages | text, speaker }`. Keep accepting `text` for NPCs.

### 6.2 `src/scenes/ZoneScene.js`

**Signs → two-beat.** In `placeInteractables`, normalize each sign to `{ quote, inner }` (string → `{ quote, inner: null }`). In `activate()` for `type === 'sign'`, build `pages = [payload.quote]` and push `payload.inner` if present, then `openDialogue(pages)`. Update `openDialogue` to pass `pages` (array) in the event detail.

**Prelude before the title.** In `playIntro(z)`, if `z.prelude?.length`, play the prelude **first** as a sequence of centered, timed, skippable cards (clone the prologue's `nextCard` pattern: ~1.8s each, fade 400ms, any key skips the current card / the whole prelude). Only after the prelude finishes, run the existing title+subtitle card, then unfreeze + `refreshGuide()`. The scene stays `frozen` through the whole prelude. Add a small "press any key to skip" hint, same as the prologue.

**Inner-voice Guide line.** The Guide currently shows a static objective. Change `refreshGuide()` so the objective text is the **current thought** from `this.zone.thoughts`, indexed by progress: `thoughts[min(guideDone.size, thoughts.length - 1)]`. Keep the cyan beacon + chevron + floor trail exactly as-is (that's the wayfinding; the words become the inner voice). Drop the visible `N/total` counter from the line (it breaks the voice) — or move it to a tiny dim corner element if you want to keep progress legible.

**Torch tied to a beat.** When a sign with index `== z.torchBeat.afterSignIndex` is read (in `markGuideDone` or `activate`), call `this.light.growTo(z.torchBeat.growTo)` and, if `z.revelation`, show the revelation as a centered, slow fade-in/hold/fade-out card (reuse the intro card styling, ~3.5s, depth 2100). This is the moment the metaphor is spoken.

**Hidden grind portal.** If `z.portalHiddenUntilRead`, create the portal but start it hidden (`setAlpha(0)`, no `portalZone` collision yet) and **do not** let `refreshGuide()` beacon it. When `guideDone` covers all sign/screen/npc targets, fade the portal in, enable `this.portalZone`, and surface a one-line card (Wilderness uses the line in §7). The objective line at that point becomes the "the way out was never handed to me" thought.

### 6.3 `src/scenes/PrologueScene.js`

Leave it essentially intact — it's the model, not the problem. **One optional addition** (Aahil's call, flagged in §7): a single inner line fading in at the silence beat, right after `flashInterviewsZero()`, before `lightsOut()`. Keep it to one line so the prologue stays mostly wordless.

### 6.4 `src/site/screens.js`

Two caption upgrades and one reveal (copy in §7): set up the `hollow-landing` localhost/"production" joke so it lands, and turn the `contact` screen into the **protagonist reveal** (this is where the anonymous box finally becomes a named person — the late reveal is the artistic payoff, so don't name him earlier in the game).

---

## 7. The content script — paste into `story.js` (and the two screens)

> Voice = §2. Whitelabel = §3. `prelude` = entry cards. `thoughts` = Guide line by progress. `signs` = `{quote, inner}`. `revelation` = the one spoken-metaphor beat.

### ZONE 1 — THE WILDERNESS  *(rejection arc · `portalHiddenUntilRead: true`)*

```
prelude:
  "First co-op cycle. I applied everywhere that would take a resume."
  "Three rounds of it. A, B, C."
  "Zero interviews. Not one."
  "Not even a no. Just silence — which is so much worse than a no."
thoughts:           // advance as signs are read
  "No map out here. Nobody's coming to give me one."
  "Every sign says the same thing in a different font."
  "Standing still is the only way to lose for sure. Keep moving."
  "The way out was never going to be handed to me. I have to find it."   // shown once all read
signs:
  1) quote: "\"We've decided to move forward with other candidates.\""
     inner: "The fourth this week. I stopped reading past the first line."
  2) quote: "\"We'll keep your resume on file for future openings.\""
     inner: "My resume was thin and I knew it. The paper version of me wasn't worth much yet — because I hadn't built anything real yet."
  3) quote: "Syllabus: HTML tags. CSS. A div is a box."
     inner: "It's 2026 and school is teaching me what a box is — not how the web actually works, not the tools everyone really uses. I coasted through most of it on AI and learned almost nothing. That's on them and on me both."
  4) quote: "\"Unfortunately, this position has been closed.\""
     inner: "Closed. Like the door was never really open."
  5) quote: "Round A: no. Round B: no. Round C: no."          // place nearest the exit
     inner: "The path was never lit for me. So I quit waiting for someone to light it — and decided to make my own."
revelation: null
torchBeat: null
// portal: hidden until all read; on reveal show the 4th thought as a centered card, then light the portal.
achievement: { title: 'Still Standing', desc: '0 offers, didn't quit.' }
```

*(Add the 5th sign + the school sign to the map as two more `S` markers.)*

### ZONE 2 — THE HOLLOW  *(first co-op · honest, never bitter)*

```
prelude:
  "I finally got a yes. An unpaid spot at a tiny place. Eight people."
  "No structure. No map. No one checking whether I learned anything."
  "Weeks would pass with no contact. I'd send work into a void."
  "It wasn't really a job. It was a test of whether I'd keep going with nobody watching."
thoughts:
  "Nobody's going to tell me what to do here. That's the whole lesson."
  "Quiet rooms teach you things loud ones can't."
  "I stopped waiting to be managed and started managing myself."
signs:
  1) quote: "Eight people. One of them my \"manager\" — a grad student."
     inner: "There was barely a company here. Respectfully. I learned what good looks like by living inside something that had none of it."
  2) quote: "They shipped what I built as their own. Right on their front page."
     inner: "I could've built that page in my sleep with one hand. Watching them undervalue the work taught me exactly what it was worth — and that I'd never let it be priced that low again."
     [raw alt for inner first sentence: "I could've built that page half-asleep with one hand tied back."]
  3) quote: "Shipped a Redis caching layer. Real work, in a silent room."
     inner: "Nobody asked. Nobody noticed. I did it because it needed doing — and because I needed to know I could."
  4) quote: "Migrated 30+ components, Angular → React. −25% bundle. −35% load."
     inner: "Real numbers, real wins, in a place that gave me nothing to work with. This is where the grind got forged."
revelation: null
torchBeat: null
achievement: { title: 'Forged in the Quiet', desc: 'Learned the grind the hard way.' }
```

`hollow-landing` screen caption (in `screens.js`):
> "They called localhost 'production' and shipped my work as theirs. I learned what good structure was by surviving the total absence of it."

### ZONE 3 — THE FORGE  *(LearnFlow · the light really grows · carries the one revelation)*

```
prelude:
  "If no one would hand me a real shot, I'd build my own."
  "LearnFlow. Co-founder. Founding engineer. My thing."
  "30-hour weeks on top of a full course load."
  "This was the chapter that actually taught me — not how to pass a test. How to learn anything."
thoughts:
  "Build the weapon. Then show it to anyone who'll look."
  "First time the work felt like it was actually mine."
  "The light's bigger in here. I'm starting to see what I can do."
signs:
  1) quote: "LearnFlow — OCR, transcription, a 6-stage retrieval pipeline. One tool."
     inner: "An AI study tool that understands how you learn, not just what you're studying. I forged six systems into one thing that worked."
  2) quote: "150+ users. 30-hour weeks. Built mostly alone."
     inner: "Nobody assigned this. No grade attached. I built it because building it was the point."
  3) quote: "Startup expo. Pitch fest. Demoed to 5+ professors and faculty."
     inner: "I put it in front of full rooms and made them care. That's when I found out I could pitch — not just build."
revelation: "The light got bigger here. And I finally got it — it was never the world brightening. It was me. The confidence I never had growing up, I was building it one real thing at a time."
torchBeat: { afterSignIndex: 2, growTo: 172 }   // fire the revelation after the pitch sign
npcs:
  Professor: ["\"You presented this to my class?\"", "\"...this is genuinely good work.\""]
  Classmate: ["\"Wait — you BUILT this? The whole thing?\""]
achievement: { title: 'Built the Weapon', desc: '150+ users, 30-hour weeks, your own thing.' }
```

### ZONE 4 — MISSION CONTROL  *(NASA · the trophy room)*

```
prelude:
  "We took something we believed in to one of the biggest hackathons on Earth."
  "Team Relentless. The name was real before it was ever a portfolio."
  "An idea on Friday. A live production URL by Sunday."
  "I needed to know if the work could stand next to the best in the world."
thoughts:
  "Most people never find out if they're good enough at this level. I wanted to find out."
  "Cleaner air, real data, real users — built in one weekend."
signs:
  1) quote: "AirCast — AI air-quality forecasting on NASA TEMPO data. 6-hour AQI. Azure + CI/CD."
     inner: "Zero to production in 48 hours. Satellite data, ground sensors, a live map. Real — not a demo."
  2) quote: "Team Relentless. We didn't just enter. We stood out."
     inner: "Out of more than 11,500 projects, ours was named a Global Nominee. Top ~1,290 in the world."
  3) quote: "The name described the people before it described a portfolio."
     inner: "Relentless wasn't branding. It was just true about everyone who showed up that weekend."
revelation: null
torchBeat: null
npcs:
  Teammate: ["\"Global Nominee, bro.\"", "\"~1,290 teams. Out of more than 11,500 projects. Worldwide.\""]
achievement: { title: 'Global Nominee', desc: 'Stood out on a world stage.' }
```

*(Keep the real `nasa` email screen exactly as the centerpiece.)*

### ZONE 5 — THE ARENA  *(current corporate role · whitelabeled)*

```
prelude:
  "First time in a real corporate room. I didn't ease in."
  "First week, I found and fixed a critical auth vulnerability in production. Nobody asked me to. I just found it."
  "They bet on me early — put me on something that mattered. A startup operating model inside a giant company."
  "No safety net. Just: build something real and make it count."
thoughts:
  "More meetings in a week than most people here have in a month."
  "I don't carry a torch in here anymore. I am the light."
  "I came in with something to prove. I'm proving it."
signs:
  1) quote: "First time in a room like this. I didn't ease in — I arrived."
     inner: "I co-built an analytics engine that turns scattered security data into clear, prioritized action. AI agents that don't just report it — they reason about it."
  2) quote: "Back-to-back. Sync after sync. More in a week than most have in a month."
     inner: "Once I joined the intern capstone 30 minutes late — not slacking, just buried in conflicts. Grateful to be the one carrying that much load."
  3) quote: "The work reached senior leadership — named as an example of what this was built to produce."
     inner: "What it meant to me wasn't the recognition. It was knowing I earned it from zero, in a room I'd never operated in before."
revelation: null
torchBeat: null
npcs:
  A director: ["\"So walk me through what you built.\"", "\"...nice. Really nice. Keep going.\""]
  Leadership: ["\"That work got mentioned upstairs.\"", "\"People noticed. Keep going.\""]
achievement: { title: 'In the Arena', desc: 'Walked in with something to prove. Proved it.' }
```

*(Keep the `calendar` / `teammate-calendar` gag — the prelude now sets it up.)*

### ZONE 6 — THE HORIZON  *(the unwritten chapter + the why · full daylight · the reveal)*

```
prelude:
  "Out of the buildings. Out of the dark. The whole world's lit now."
  "Here's the part that's still being written."
thoughts:
  "The torch was never the point."
  "Learning to see in the dark was."
signs:
  1) quote: "The story's still being written."
     inner: "The torch was never the point. Learning to see in the dark was. I can do that now — anywhere, with or without the light."
  2) quote: "Be 35 and free. Locked in until then."
     inner: "Money was the first motivator. Somewhere it stopped being about money and became about the work. I want these years hammer-down — so later I'm free to explore, grow, and learn things just for the love of it. Not retire. Just never owe anyone my time again."
revelation: null
torchBeat: null
achievement: { title: 'The Horizon', desc: 'Out of the dark. The whole world, lit.' }
```

`contact` screen — **the reveal** (in `screens.js`): keep the links, change the caption to:
> "I'm Aahil. That was my story — the real one. If you felt any of it, that was the whole point. Let's build something."

Optional closing card after contact closes / on the final achievement:
> "Most of it happened in the dark. Thanks for walking through it with me."

### Prologue — optional single line (Aahil's call)

After `flashInterviewsZero()`, before `lightsOut()`, one fading line:
> "I did everything they told me to. It wasn't enough — because I'd never actually built anything real. Yet."

---

## 8. The art / symbolism layer

### 8.1 The hidden GRIND path (Wilderness) — restore the GDD's lost beat

The GDD promised the only way out of the wilderness is a grind-path "most players miss." Right now it's a portal sitting in the open. Implement `portalHiddenUntilRead` (§6.2): no marked exit until you've read every sign — then it reveals with *"The way out was never going to be handed to me. I have to find it."* This is the single strongest piece of environmental symbolism available and it's free.

### 8.2 Torch growth tied to the moment, not the door

Today the torch grows on zone entry. Add the mid-zone `torchBeat` (Forge, after the pitch sign) so the light visibly **jumps in response to an earned moment.** The player should feel the light answer the work.

### 8.3 Say the metaphor out loud exactly once

The whole game is "torch = confidence," and it's currently never stated. The Forge `revelation` (§7) is that one spoken moment — mid-arc, after a win, so it's earned. After a player reads it, they re-interpret every dark room behind them. **Do not repeat the metaphor anywhere else** — the Horizon signs gesture at it without re-explaining, and that restraint is what keeps it powerful.

### 8.4 The late reveal

Keep the protagonist anonymous through the whole game so any player projects themselves into the box — then name him at the very end (the `contact` reveal, §7). "This was a real, specific person the whole time" is a stronger closing beat than a nametag on slide one, and it serves the "anyone who feels it resonates" goal.

### 8.5 Existing strengths to leave alone

The color-temperature arc (dark green → grey → ember → cyan → gold → daylight) is already in the palettes and is genuinely good. The ember trail, the CRT screens, the typewriter dialogue, the prologue — all keepers. v2 adds words and two systems; it doesn't touch the look.

---

## 9. Implementation order (ship the spine first)

1. **Pass A — paging dialogue + two-beat signs.** §6.1 + the `signs` schema change + paste all `{quote, inner}` copy. This alone closes most of the context gap.
2. **Pass B — preludes.** §6.2 prelude sequencing + paste all `prelude` arrays. Now every player gets the events up front.
3. **Pass C — inner-voice Guide line.** §6.2 thoughts wiring + paste all `thoughts`. The most-read text becomes narration.
4. **Pass D — the meaning.** `torchBeat` + `revelation` (Forge) + the screen caption upgrades + the contact reveal.
5. **Pass E — the symbolism.** `portalHiddenUntilRead` (Wilderness hidden grind), the optional prologue line, the closing card.

Playtest after **A** and again after **B** — those two are 80% of the value.

---

## 10. Acceptance test (the game isn't done until this passes)

Hand it to someone who has **never** read the bio and knows nothing about Aahil. After playing once, they should be able to answer, unprompted:

- **Who** was that? (a software engineer telling his real, first-person story)
- **What happened in each chapter?** — applied 3 rounds / 0 interviews into silence · a structureless first job that forged the grind · built his own product, LearnFlow, and pitched it · took it to a world stage and placed as a NASA Global Nominee · walked into his first big corporate room and dominated · and where he's headed (free by 35, working for love not money).
- **Why did the screen get brighter?** — because the torch was his confidence, and he earned it.
- **Did they feel something?** — at the silence in the wilderness, the quiet of the hollow, the light jumping in the forge, the reveal at the end.

If a stranger can't narrate the arc back, the prelude/sign copy isn't landing — tighten it, don't add more.

---

*Keep the thesis as the north star for every decision: darkness → light, confidence earned. Ship Pass A first and play it.*
