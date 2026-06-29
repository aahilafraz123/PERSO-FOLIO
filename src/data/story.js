/**
 * story.js — ALL narrative content for RELENTLESS, in one place (GDD §1, §5, §10).
 *
 * The engine (ZoneScene) is generic; everything that makes a zone a zone lives
 * here. Zones render from an ASCII map. Legend:
 *   '#' wall      '.'/' ' floor   '@' player spawn
 *   'S' sign      '*' skill shard 'M' monitor (DOM screen modal)
 *   'N' npc       '>' exit portal to next zone   '~' decorative solid prop
 * Markers are consumed in row-major (top→bottom, left→right) order from the
 * matching array below, so the Nth 'S' uses signs[N], the Nth '*' uses shards[N].
 *
 * v2 narration layer (plan.md): four registers per zone —
 *   prelude:   first-person entry cards (what is this chapter?)
 *   thoughts:  inner-voice fed to the Guide line, advanced by progress
 *   signs:     two-beat { quote, inner } — artifact, then the inner response
 *   revelation: the ONE spoken-metaphor beat (Forge only), tied to torchBeat
 * Plus: torchBeat (mid-zone light jump), portalHiddenUntilRead (hidden grind exit).
 * Voice = plan.md §2 (clean-but-blunt). Whitelabel = §3 (no employers/people).
 *
 * Torch radius per zone encodes the thesis (GDD §0, §2): darkness → light.
 */

export const ZONES = [
  // ===========================================================================
  // ZONE 1 — THE WILDERNESS (the rejection arc) · hidden grind exit
  // ===========================================================================
  {
    key: 'wilderness',
    chapter: 'I',
    name: 'THE WILDERNESS',
    subtitle: '0 interviews. 3 rounds. No light but the one you carry.',
    torchRadius: 165,
    // ENDURE: out here the dark creeps back when you stand still or stop to read
    // a rejection — only pushing forward feeds the flame (atmospheric; clamped so
    // a sign is always readable). The whole chapter is "keep moving" made literal.
    torchDecay: true,
    wallStyle: 'tree',
    next: 'hollow',
    portalLabel: 'THE GRIND →',
    palette: {
      floor: 0x13251a, speckA: 0x183020, speckB: 0x0f1f15,
      wallDark: 0x16361f, wallLight: 0x1f4a2b, trunk: 0x3a2616,
      accent: 0x00d9f5,
    },
    prelude: [
      `First co-op cycle. I applied everywhere that would take a resume.`,
      `Three rounds of it. A, B, C.`,
      `Zero interviews. Not one.`,
      `Not even a no. Just silence — which is so much worse than a no.`,
    ],
    intro: ['THE WILDERNESS', 'Round A. Round B. Round C. The path was never lit.'],
    briefing: `You're barely out of high school. First co-op cycle, a résumé you don't really understand, every door already shut. Nobody's coming to open one. Find your own way out of the dark.`,
    position: `STATUS · UNEMPLOYED — 0 INTERVIEWS`,
    thoughts: [
      `No map out here. Nobody's coming to give me one.`,
      `Every sign says the same thing in a different font.`,
      `Standing still is the only way to lose for sure. Keep moving.`,
      `The way out was never going to be handed to me. I have to find it.`,
    ],
    revelation: null,
    torchBeat: null,
    // CARRY & BURN: turn the rejections into fuel. Carry each of 5 letters to the
    // campfire and burn it; the fire grows + the exit is gated until all 5 burn.
    objective: { label: 'TURN THE REJECTIONS INTO FUEL', kind: 'burn' },
    // the guide walks this authored sequence in strict story order
    script: [
      { t: 'burnloop', label: 'Burn the rejections', thought: 'Pick one up. Carry it to the fire — turn it into light.' },
    ],
    gatedByObjective: true,
    beats: [
      { at: 'first', text: `One down. The fire's a little taller.` },
      { at: 'complete', text: `The dark's pulling back. There's a way through now.` },
    ],
    map: [
      '##############################',
      '#@...........................#',
      '#.....L....###...........*...#',
      '#..........###...............#',
      '#...............###..........#',
      '#....*.........###.....L.....#',
      '#..###.......................#',
      '#..###..........####.........#',
      '#.......K.......####.....M...#',
      '#.....L......G...............#',
      '#............................#',
      '#............###.......*.....#',
      '#......###...................#',
      '#......###........####.......#',
      '#.................####.......#',
      '#....*..................L....#',
      '#...........###.........L....#',
      '#...........###..........>...#',
      '#............................#',
      '##############################',
    ],
    // 5 rejection LETTERS — two-beat { quote (on pickup), inner (on burn) }.
    // The 5th sits nearest the exit, so it's the last one burned.
    letters: [
      {
        quote: `"We've decided to move forward with other candidates."`,
        inner: `The fourth this week. I stopped reading past the first line.`,
      },
      {
        quote: `"We'll keep your resume on file for future openings."`,
        inner: `My resume was thin and I knew it. The paper version of me wasn't worth much yet — because I hadn't built anything real yet.`,
      },
      {
        quote: `Syllabus: HTML tags. CSS. A div is a box.`,
        inner: `It's 2026 and school is teaching me what a box is — not how the web actually works, not the tools everyone really uses. I coasted through most of it on AI and learned almost nothing. That's on them and on me both.`,
      },
      {
        quote: `"Unfortunately, this position has been closed."`,
        inner: `Closed. Like the door was never really open.`,
      },
      {
        quote: `Round A: no. Round B: no. Round C: no.`,
        inner: `The path was never lit for me. So I quit waiting for someone to light it — and decided to make my own.`,
      },
    ],
    shards: [
      { skill: 'Resilience', xp: 14 },
      { skill: 'Grit', xp: 12 },
      { skill: 'Patience', xp: 12 },
      { skill: 'Resolve', xp: 12 },
    ],
    // 1 monitor → the rejection inbox
    screens: ['rejections'],
    npcs: [],
    // the locked OFFER gate — the door that won't open no matter how you push it
    gates: [
      { label: 'OFFER', line: `An OFFER gate. Locked. Like the door was never really open. There's no key out here — only the long way around.` },
    ],
    // shown on the centered card when the hidden grind exit reveals (§8.1)
    portalRevealLine: `The way out was never going to be handed to me. I have to find it.`,
    achievement: { title: 'Still Standing', desc: `0 offers, didn't quit.` },
  },

  // ===========================================================================
  // ZONE 2 — THE HOLLOW (the first co-op) — honest, never bitter (GDD §5)
  // ===========================================================================
  {
    key: 'hollow',
    chapter: 'II',
    name: 'THE HOLLOW',
    subtitle: 'No structure, no map, long silences. The place that forged the grind.',
    torchRadius: 215,
    wallStyle: 'block',
    next: 'forge',
    portalLabel: 'KEEP BUILDING →',
    palette: {
      floor: 0x1a1c24, speckA: 0x232631, speckB: 0x14161c,
      wallDark: 0x2a2d3a, wallLight: 0x3a3e4f, trunk: 0x20232e,
      accent: 0x6b7088,
    },
    prelude: [
      `I finally got a yes. An unpaid spot at a tiny place. Eight people.`,
      `No structure. No map. No one checking whether I learned anything.`,
      `Weeks would pass with no contact. I'd send work into a void.`,
      `It wasn't really a job. It was a test of whether I'd keep going with nobody watching.`,
    ],
    intro: ['THE HOLLOW', 'It looked like a job. It was really a trial.'],
    briefing: `You got a yes — an unpaid seat at a place with no idea what to do with you. No manager. No map. Weeks of silence. Whether you keep going now is entirely on you.`,
    position: `POSITION ACCEPTED · SOFTWARE CO-OP (UNPAID)`,
    recap: `Zero interviews behind you. This is the first yes.`,
    thoughts: [
      `Nobody's going to tell me what to do here. That's the whole lesson.`,
      `Quiet rooms teach you things loud ones can't.`,
      `I stopped waiting to be managed and started managing myself.`,
    ],
    revelation: null,
    torchBeat: null,
    // GRIND IT OUT: find the work nobody assigned and grind it through (mash the
    // rotating prompted key). The reward is silence. Ship all 3 → the exit appears.
    objective: { label: 'DO THE WORK NOBODY ASSIGNED', kind: 'ship' },
    script: [
      { t: 'sign', i: 0, label: 'Look around', thought: "Nobody's going to tell you what to do here. That's the lesson." },
      { t: 'ship', need: 1, label: 'Ship the work', thought: 'Find the work nobody assigned. Grind it out.' },
      { t: 'ship', need: 2, label: 'Ship the work', thought: 'Again. No one will notice. Do it anyway.' },
      { t: 'sign', i: 1, label: 'What it taught you', thought: "Quiet rooms teach you things loud ones can't." },
      { t: 'ship', need: 3, label: 'Ship the work', thought: 'One more. This is the whole test.' },
    ],
    gatedByObjective: true,
    beats: [
      { at: 'first', text: `No reply. No thanks. You ship it anyway.` },
      { at: 'complete', text: `Nobody noticed. You did. That was the whole test.` },
    ],
    map: [
      '##############################',
      '#@.........#........#........#',
      '#..........#...*....#....S...#',
      '#....S.....#........#........#',
      '#..........#........#........#',
      '#..........#........##.####..#',
      '#.####.....#.............#...#',
      '#....#.....#.....M.......#.*.#',
      '#....#.....#.............#...#',
      '#..........######.#####......#',
      '#....*..........#....W.......#',
      '#...............#.....M......#',
      '#......####.....#............#',
      '#......#........#......*.....#',
      '#......#...W....#............#',
      '#..........................W.#',
      '#....####.........####.......#',
      '#.......................>....#',
      '#..R.........................#',
      '##############################',
    ],
    signs: [
      {
        quote: `Eight people. One of them my "manager" — a grad student.`,
        inner: `There was barely a company here. Respectfully. I learned what good looks like by living inside something that had none of it.`,
      },
      {
        quote: `They shipped what I built as their own. Right on their front page.`,
        inner: `I could've built that page in my sleep with one hand. Watching them undervalue the work taught me exactly what it was worth — and that I'd never let it be priced that low again.`,
      },
    ],
    // SHIP stations — press E to send real work into the void. By design there is
    // NO toast, NO chime, NO XP: the silence is the lesson. A quiet line lands a
    // beat later. Shipping both is what finally reveals the exit.
    ships: [
      {
        label: 'Redis caching layer',
        line: `Shipped a Redis caching layer into the void. No ticket asked for it. Nobody noticed it land. I did it because it needed doing — and because I needed to know I could.`,
      },
      {
        label: 'Angular → React · 30+ components',
        line: `−25% bundle. −35% load. Real numbers, sent into silence. No applause came back. That was the whole lesson — and where the grind got forged.`,
      },
      {
        label: 'A bug nobody filed',
        line: `Found a bug nobody noticed, in code nobody owned. Fixed it on a Sunday. No ticket, no thanks — just better than it was. That was enough.`,
      },
    ],
    shards: [
      { skill: 'Grind', xp: 16 },
      { skill: 'Self-Reliance', xp: 14 },
      { skill: 'React', xp: 14 },
      { skill: 'Redis', xp: 14 },
    ],
    // 2 monitors → wry placeholder landing + the résumé terminal
    screens: ['hollow-landing', 'resume'],
    npcs: [],
    // hidden cert relic — gold-beaconed only after the chapter's beats are done
    relics: [{ id: 'az900', name: 'AZ-900', xp: 16 }],
    achievement: { title: 'Forged in the Quiet', desc: 'Learned the grind the hard way.' },
  },

  // ===========================================================================
  // ZONE 3 — THE FORGE (LearnFlow) — the light JUMPS here · carries the one revelation
  // Enters dim (125) on purpose so the torchBeat after the pitch is a visible jump.
  // ===========================================================================
  {
    key: 'forge',
    chapter: 'III',
    name: 'THE FORGE',
    subtitle: 'Built it myself. 150+ users. Thirty-hour weeks. My own thing.',
    torchRadius: 240,
    wallStyle: 'block',
    next: 'mission',
    portalLabel: 'THE WORLD STAGE →',
    palette: {
      floor: 0x241a16, speckA: 0x2e221a, speckB: 0x1c1410,
      wallDark: 0x4a2e1c, wallLight: 0x6e4322, trunk: 0x32201a,
      accent: 0xff7b00,
    },
    prelude: [
      `If no one would hand me a real shot, I'd build my own.`,
      `LearnFlow. Co-founder. Founding engineer. My thing.`,
      `30-hour weeks on top of a full course load.`,
      `This was the chapter that actually taught me — not how to pass a test. How to learn anything.`,
    ],
    intro: ['THE FORGE', 'Build your own weapon. 30-hour weeks. Pitch to anyone who\'ll listen.'],
    briefing: `No one will hand you a real shot — so build your own. Forge a weapon out of six systems, piece by piece. Then put it in front of a room and make them care.`,
    position: `POSITION · CO-FOUNDER & FOUNDING ENGINEER — LEARNFLOW`,
    recap: `Zero interviews. One unpaid seat. Now you build your own.`,
    objective: { label: 'FORGE LEARNFLOW', kind: 'forge' },
    script: [
      { t: 'sign', i: 0, label: 'The brief', thought: "Build the weapon. Then show it to anyone who'll look." },
      { t: 'gather', label: 'Collect the systems', thought: 'Six systems, scattered. Gather every one.' },
      { t: 'sign', i: 1, label: 'The numbers', thought: 'First time the work felt like it was actually mine.' },
      { t: 'act', kind: 'anvil', label: 'Forge it', thought: 'Take them to the anvil. Forge one tool.' },
      { t: 'sign', i: 2, label: 'The stage', thought: 'Put it in a full room and make them care.' },
      { t: 'act', kind: 'pitch', label: 'Pitch it', thought: 'Step on the stage. Pitch it.' },
    ],
    gatedByObjective: true,
    beats: [
      { at: 'collected', text: `Six systems in hand. Take them to the anvil.` },
      { at: 'forged', text: `It's real now. One tool, yours. Go make them watch.` },
    ],
    thoughts: [
      `Build the weapon. Then show it to anyone who'll look.`,
      `First time the work felt like it was actually mine.`,
      `The light's bigger in here. I'm starting to see what I can do.`,
    ],
    revelation: `The light got bigger here. And I finally got it — it was never the world brightening. It was me. The confidence I never had growing up, I was building it one real thing at a time.`,
    // BUILD + PITCH: the torch JUMP + revelation now fire when you land the pitch
    // (the minigame), not on a sign — the beat is earned by doing, not reading.
    torchBeat: null,
    portalHiddenUntilRead: false,
    map: [
      '##############################',
      '#@..........c...............*#',
      '#...........####.............#',
      '#....S......####.....N.......#',
      '#......c............P........#',
      '#......*.....................#',
      '#.................####.......#',
      '#....####....c...............#',
      '#....####.........####...M...#',
      '#..........A.................#',
      '#.........*........S.........#',
      '#.................c..........#',
      '#....N.......####............#',
      '#............####......*.....#',
      '#.......c....................#',
      '#.......S....................#',
      '#..........####..........>...#',
      '#..........####.........c....#',
      '#........................R...#',
      '##############################',
    ],
    signs: [
      {
        quote: `LearnFlow — OCR, transcription, a 6-stage retrieval pipeline. One tool.`,
        inner: `An AI study tool that understands how you learn, not just what you're studying. I forged six systems into one thing that worked.`,
      },
      {
        quote: `150+ users. 30-hour weeks. Built mostly alone.`,
        inner: `Nobody assigned this. No grade attached. I built it because building it was the point.`,
      },
      {
        quote: `Startup expo. Pitch fest. Demoed to 5+ professors and faculty.`,
        inner: `I put it in front of full rooms and made them care. That's when I found out I could pitch — not just build.`,
      },
    ],
    shards: [
      { skill: 'Founder', xp: 18 },
      { skill: 'Full-Stack', xp: 16 },
      { skill: 'RAG / Retrieval', xp: 16 },
      { skill: 'Pitching', xp: 16 },
    ],
    screens: ['learnflow'],
    npcs: [
      { name: 'Professor', lines: ['"You presented this to my class?"', '"...this is genuinely good work."'] },
      { name: 'Classmate', lines: ['"Wait — you BUILT this? The whole thing?"'] },
    ],
    // BUILD: collect all six systems, then forge them into one tool at the anvil.
    components: [
      { name: 'OCR', note: 'Google Vision' },
      { name: 'Whisper', note: 'transcription' },
      { name: 'GPT-4', note: 'explanations' },
      { name: 'Retrieval', note: '6-stage pipeline' },
      { name: 'Supabase', note: 'data' },
      { name: 'Electron', note: 'desktop' },
    ],
    anvils: [
      { line: `Six systems, forged into one tool that actually worked. LearnFlow — built mostly alone, because building it was the point.` },
    ],
    // PITCH: step on the stage, land the beats — the light JUMPS and the one
    // spoken revelation lands. growTo carries the torchBeat that used to fire on a sign.
    pitches: [{ growTo: 320 }],
    relics: [{ id: 'ai900', name: 'AI-900', xp: 16 }],
    achievement: { title: 'Built the Weapon', desc: '150+ users, 30-hour weeks, your own thing.' },
  },

  // ===========================================================================
  // ZONE 4 — MISSION CONTROL (NASA Space Apps) — the trophy room (GDD §5)
  // ===========================================================================
  {
    key: 'mission',
    chapter: 'IV',
    name: 'MISSION CONTROL',
    subtitle: 'Team Relentless. A world stage. ~1,290 of 11,500+ projects.',
    torchRadius: 380,
    wallStyle: 'block',
    next: 'arena',
    portalLabel: 'THE ARENA →',
    palette: {
      floor: 0x0d1424, speckA: 0x1a2540, speckB: 0x0a0f1c,
      wallDark: 0x1a2238, wallLight: 0x2a3656, trunk: 0x141c30,
      accent: 0x00d9f5,
    },
    prelude: [
      `We took something we believed in to one of the biggest hackathons on Earth.`,
      `Team Relentless. The name was real before it was ever a portfolio.`,
      `An idea on Friday. A live production URL by Sunday.`,
      `I needed to know if the work could stand next to the best in the world.`,
    ],
    intro: ['MISSION CONTROL', 'The work could stand on a world stage.'],
    briefing: `You've been dropped into one of the biggest hackathons on Earth. Idea Friday, live URL by Sunday. The clock's already running — build your way out.`,
    position: `TEAM RELENTLESS · NASA SPACE APPS — 48 HOURS`,
    recap: `Rejections, an unpaid grind, a tool you built — now a world stage.`,
    objective: { label: 'SHIP AIRCAST', kind: 'deploy' },
    script: [
      { t: 'sign', i: 0, label: 'The challenge', thought: 'Zero to production in 48 hours. Build your way out.' },
      { t: 'wire', label: 'Wire the data sources', thought: 'Wire every source into the control room.' },
      { t: 'sign', i: 1, label: 'The stakes', thought: "Most never find out if they're good enough at this level." },
      { t: 'act', kind: 'lever', label: 'Deploy AirCast', thought: "Pipeline's hot. Pull the lever." },
      // the recognition comes AFTER the work shipped — the email is the last beat
      { t: 'screen', id: 'nasa', label: 'The recognition', thought: 'The work shipped. Then the recognition came — read it.' },
    ],
    gatedByObjective: true,
    beats: [
      { at: 'first', text: `One source live. Clock's still running.` },
      { at: 'wired', text: `Pipeline's hot. Pull the lever.` },
      { at: 'deployed', text: `AirCast is live. You shipped it in a weekend.` },
    ],
    thoughts: [
      `Most people never find out if they're good enough at this level. I wanted to find out.`,
      `Cleaner air, real data, real users — built in one weekend.`,
    ],
    revelation: null,
    torchBeat: null,
    portalHiddenUntilRead: false,
    map: [
      '##############################',
      '#@..........................*#',
      '#.....o......................#',
      '#....*.......######..........#',
      '#............#....#.....S.....#',
      '#............#....#...........#',
      '#............#.MM.#...........#',
      '#............#....#...........#',
      '#....S.......##..##.......*...#',
      '#....................o.......#',
      '#.............Y..............#',
      '#......*.....................#',
      '#.................####.......#',
      '#....S............####...N...#',
      '#............................#',
      '#..........o.................#',
      '#..........................>.#',
      '#...R........................#',
      '#............................#',
      '##############################',
    ],
    signs: [
      {
        quote: `AirCast — AI air-quality forecasting on NASA TEMPO data. 6-hour AQI. Azure + CI/CD.`,
        inner: `Zero to production in 48 hours. Satellite data, ground sensors, a live map. Real — not a demo.`,
      },
      {
        quote: `Team Relentless. We didn't just enter. We stood out.`,
        inner: `Out of more than 11,500 projects, ours was named a Global Nominee. Top ~1,290 in the world.`,
      },
      {
        quote: `The name described the people before it described a portfolio.`,
        inner: `Relentless wasn't branding. It was just true about everyone who showed up that weekend.`,
      },
    ],
    shards: [
      { skill: 'NASA', xp: 20 },
      { skill: 'Geospatial', xp: 16 },
      { skill: 'Azure / CI-CD', xp: 16 },
      { skill: 'Teamwork', xp: 16 },
    ],
    // TWO adjacent monitors 'MM' = the centerpiece: the NASA email + the AirCast map
    screens: ['nasa', 'aircast'],
    npcs: [
      { name: 'Teammate', lines: ['"Global Nominee, bro."', '"~1,290 teams. Out of more than 11,500 projects. Worldwide."'] },
    ],
    // DEPLOY: three data-source globes. Connect each to the control-room screens;
    // wire all three and AirCast goes live — zero to production in 48 hours.
    dataNodes: [
      { name: 'NASA TEMPO', marker: 'NO₂' },
      { name: 'OpenAQ', marker: 'PM2.5' },
      { name: 'OpenWeather', marker: 'O₃' },
    ],
    relics: [{ id: 'sc900', name: 'SC-900', xp: 16 }],
    achievement: { title: 'Global Nominee', desc: 'Stood out on a world stage.' },
  },

  // ===========================================================================
  // ZONE 5 — THE ARENA — first real corporate room (white-labeled: no names) (GDD §5)
  // ===========================================================================
  {
    key: 'arena',
    chapter: 'V',
    name: 'THE ARENA',
    subtitle: 'First time in a real arena — and you belong.',
    torchRadius: 500,
    wallStyle: 'block',
    next: 'horizon',
    portalLabel: 'THE HORIZON →',
    palette: {
      floor: 0x1a1c2e, speckA: 0x24263a, speckB: 0x141526,
      wallDark: 0x2a2d4a, wallLight: 0x3c4068, trunk: 0x22243c,
      accent: 0xffcf3a,
    },
    prelude: [
      `First time in a real corporate room. I didn't ease in.`,
      `First week, I found and fixed a critical auth vulnerability in production. Nobody asked me to. I just found it.`,
      `They bet on me early — put me on something that mattered. A startup operating model inside a giant company.`,
      `No safety net. Just: build something real and make it count.`,
    ],
    intro: ['THE ARENA', 'You carry your own light now.'],
    briefing: `First real corporate room, and you don't get to ease in. The calendar's already overflowing. Cut through the noise, ship something that lands, and make the room remember your name.`,
    position: `POSITION ACCEPTED · THE ROOM YOU WERE AIMING FOR`,
    recap: `Zero interviews. One unpaid seat. A tool you built alone. A world stage. And now — the position you've been waiting for this whole time. Don't ease in.`,
    objective: { label: 'EARN THE ROOM', kind: 'present' },
    script: [
      { t: 'sign', i: 0, label: 'The room', thought: "First room like this. Don't ease in — arrive." },
      { t: 'act', kind: 'present', label: 'Present to leadership', thought: 'Through the noise. Reach the room that matters, and present.' },
      { t: 'sign', i: 2, label: 'It reached upstairs', thought: "You earned it from zero, in a room you'd never operated in." },
    ],
    gatedByObjective: true,
    beats: [
      { at: 'boardroom', text: `This is the room that matters. Don't waste it.` },
      { at: 'presented', text: `They noticed. It reached upstairs.` },
    ],
    thoughts: [
      `More meetings in a week than most people here have in a month.`,
      `I don't carry a torch in here anymore. I am the light.`,
      `I came in with something to prove. I'm proving it.`,
    ],
    revelation: null,
    torchBeat: null,
    portalHiddenUntilRead: false,
    map: [
      '##############################',
      '#@..........................*#',
      '#....S.......#......#....S....#',
      '#............#......#.........#',
      '#....######..#......#..####...#',
      '#.........#..........#....#...#',
      '#.........#.....*....#....#...#',
      '#.....B......B......B........#',
      '#...####.........#####.......#',
      '#...#..N#........#.MM#........#',
      '#...#...#........#...#........#',
      '#...#...#........#...#...*....#',
      '#.........B........B.........#',
      '#.......................X....#',
      '#....######.......#####......#',
      '#....#.S.#........#.N.#...>...#',
      '#....#...#........#...#.......#',
      '#.....................V......#',
      '#............................#',
      '##############################',
    ],
    signs: [
      {
        quote: `First time in a room like this. I didn't ease in — I arrived.`,
        inner: `I co-built an analytics engine that turns scattered security data into clear, prioritized action. AI agents that don't just report it — they reason about it.`,
      },
      {
        quote: `Back-to-back. Sync after sync. More in a week than most have in a month.`,
        inner: `Once I joined the intern capstone 30 minutes late — not slacking, just buried in conflicts. Grateful to be the one carrying that much load.`,
      },
      {
        quote: `The work reached senior leadership — named as an example of what this was built to produce.`,
        inner: `What it meant to me wasn't the recognition. It was knowing I earned it from zero, in a room I'd never operated in before.`,
      },
    ],
    shards: [
      { skill: 'Corporate', xp: 20 },
      { skill: 'Impact', xp: 18 },
      { skill: 'Ownership', xp: 18 },
      { skill: 'Discipline', xp: 18 },
    ],
    // monitors 'MM' = the absurd calendar gag + a teammate's near-empty one
    screens: ['calendar', 'teammate-calendar'],
    npcs: [
      { name: 'A director', lines: ['"So walk me through what you built."', '"...nice. Really nice. Keep going."'] },
      { name: 'Leadership', lines: ['"That work got mentioned upstairs."', '"People noticed. Keep going."'] },
    ],
    // OWN THE ROOM: meeting doors you can't help passing — the overload shown
    // through friction, not a screenshot. Ambient (not a required beat).
    meetings: [
      { name: 'Daily Standup' },
      { name: 'Product Sync' },
      { name: '1:1 with the lead' },
      { name: 'Architecture Review' },
      { name: 'Sprint Planning' },
    ],
    // the hidden vuln hunt — NOT on the main path; gold-beaconed once the story
    // beats are done (fully-guided), and rewards a secret achievement.
    vulns: [
      {
        title: 'Critical auth vulnerability',
        line: `Week one. A critical auth vulnerability, live in production. Nobody assigned it to me. I just noticed it was wrong — and fixed it before anyone asked.`,
        achievement: { title: 'Nobody Asked', desc: 'Found and fixed a critical auth vuln in week one.' },
      },
    ],
    achievement: { title: 'In the Arena', desc: 'Walked in with something to prove. Proved it.' },
  },

  // ===========================================================================
  // ZONE 6 — THE HORIZON (the unwritten chapter + the why) — full daylight (GDD §5)
  // ===========================================================================
  {
    key: 'horizon',
    chapter: 'VI',
    name: 'THE HORIZON',
    subtitle: 'The torch was never the point — learning to see in the dark was.',
    torchRadius: 1400, // effectively full daylight — the arc completes
    wallStyle: 'block',
    next: null,
    portalLabel: null,
    palette: {
      floor: 0x1f3a24, speckA: 0x284a2e, speckB: 0x18301e,
      wallDark: 0x2a4a30, wallLight: 0x3a6242, trunk: 0x24401e,
      accent: 0xffe9a8,
    },
    prelude: [
      `Out of the buildings. Out of the dark. The whole world's lit now.`,
      `Here's the part that's still being written.`,
    ],
    intro: ['THE HORIZON', 'Full daylight. The whole world is lit.'],
    briefing: `Out of the buildings. Out of the dark. The whole world's lit now. The story's still being written — so say what comes next.`,
    position: `STATUS · STILL BEING WRITTEN`,
    objective: { label: 'SEND IT', kind: 'send' },
    script: [
      { t: 'sign', i: 0, label: 'The story so far', thought: 'The torch was never the point.' },
      { t: 'sign', i: 1, label: 'The why', thought: 'Learning to see in the dark was.' },
      { t: 'screen', id: 'contact', label: 'Send it', thought: 'Reach the terminal. Say what comes next.' },
    ],
    beats: [
      { at: 'terminal', text: `This part's still being written. Start typing.` },
      { at: 'sent', text: `That's the story. The real one. Thanks for walking it.` },
    ],
    thoughts: [
      `The torch was never the point.`,
      `Learning to see in the dark was.`,
    ],
    revelation: null,
    torchBeat: null,
    portalHiddenUntilRead: false,
    map: [
      '##############################',
      '#@...........................#',
      '#............................#',
      '#.......*...........*........#',
      '#............................#',
      '#............................#',
      '#..........######............#',
      '#..........#....#............#',
      '#..........#.MM.#............#',
      '#..........#....#............#',
      '#..........##..##............#',
      '#............................#',
      '#..........*.................#',
      '#............................#',
      '#.........S......S...........#',
      '#............................#',
      '#............................#',
      '#............................#',
      '#............................#',
      '##############################',
    ],
    signs: [
      {
        quote: `The story's still being written.`,
        inner: `The torch was never the point. Learning to see in the dark was. I can do that now — anywhere, with or without the light.`,
      },
      {
        quote: `Be 35 and free. Locked in until then.`,
        inner: `Money was the first motivator. Somewhere it stopped being about money and became about the work. I want these years hammer-down — so later I'm free to explore, grow, and learn things just for the love of it. Not retire. Just never owe anyone my time again.`,
      },
    ],
    shards: [
      { skill: 'Curiosity', xp: 22 },
      { skill: 'Vision', xp: 20 },
      { skill: 'Freedom', xp: 20 },
    ],
    // monitors 'MM' = contact terminal (the reveal) + the read-my-story escape hatch
    screens: ['contact', 'read-hatch'],
    npcs: [],
    // shown once, after the final achievement / contact closes (§7 closing card)
    closingCard: `Most of it happened in the dark. Thanks for walking through it with me.`,
    achievement: { title: 'The Horizon', desc: 'Out of the dark. The whole world, lit.' },
  },
];

export const ZONE_BY_KEY = Object.fromEntries(ZONES.map((z) => [z.key, z]));
export const FIRST_ZONE = ZONES[0].key;
