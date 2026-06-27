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
    thoughts: [
      `No map out here. Nobody's coming to give me one.`,
      `Every sign says the same thing in a different font.`,
      `Standing still is the only way to lose for sure. Keep moving.`,
      `The way out was never going to be handed to me. I have to find it.`,
    ],
    revelation: null,
    torchBeat: null,
    portalHiddenUntilRead: true,
    map: [
      '##############################',
      '#@...........................#',
      '#.....S....###...........*...#',
      '#..........###...............#',
      '#...............###..........#',
      '#....*.........###.....S.....#',
      '#..###.......................#',
      '#..###..........####.........#',
      '#...............####.....M...#',
      '#............................#',
      '#.....S......###.............#',
      '#............###.......*.....#',
      '#......###...................#',
      '#......###........####.......#',
      '#.................####.......#',
      '#....*..................S....#',
      '#...........###.........S....#',
      '#...........###..........>...#',
      '#............................#',
      '##############################',
    ],
    // 5 signs — two-beat { quote, inner }. The 5th is nearest the exit.
    signs: [
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
    thoughts: [
      `Nobody's going to tell me what to do here. That's the whole lesson.`,
      `Quiet rooms teach you things loud ones can't.`,
      `I stopped waiting to be managed and started managing myself.`,
    ],
    revelation: null,
    torchBeat: null,
    portalHiddenUntilRead: false,
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
      '#....*..........#............#',
      '#...............#.....M......#',
      '#......####.....#............#',
      '#......#........#......*.....#',
      '#......#...S....#............#',
      '#..........................S.#',
      '#....####.........####.......#',
      '#.......................>....#',
      '#............................#',
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
      {
        quote: `Shipped a Redis caching layer. Real work, in a silent room.`,
        inner: `Nobody asked. Nobody noticed. I did it because it needed doing — and because I needed to know I could.`,
      },
      {
        quote: `Migrated 30+ components, Angular → React. −25% bundle. −35% load.`,
        inner: `Real numbers, real wins, in a place that gave me nothing to work with. This is where the grind got forged.`,
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
    thoughts: [
      `Build the weapon. Then show it to anyone who'll look.`,
      `First time the work felt like it was actually mine.`,
      `The light's bigger in here. I'm starting to see what I can do.`,
    ],
    revelation: `The light got bigger here. And I finally got it — it was never the world brightening. It was me. The confidence I never had growing up, I was building it one real thing at a time.`,
    torchBeat: { afterSignIndex: 2, growTo: 320 }, // fire after the pitch sign
    portalHiddenUntilRead: false,
    map: [
      '##############################',
      '#@..........................*#',
      '#...........####.............#',
      '#....S......####.....N.......#',
      '#............................#',
      '#......*.....................#',
      '#.................####.......#',
      '#....####.........####...M...#',
      '#....####....................#',
      '#............................#',
      '#.........*........S.........#',
      '#............................#',
      '#....N.......####............#',
      '#............####......*.....#',
      '#............................#',
      '#.......S....................#',
      '#..........####..........>...#',
      '#..........####..............#',
      '#............................#',
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
      '#............................#',
      '#....*.......######..........#',
      '#............#....#.....S.....#',
      '#............#....#...........#',
      '#............#.MM.#...........#',
      '#............#....#...........#',
      '#....S.......##..##.......*...#',
      '#............................#',
      '#............................#',
      '#......*.....................#',
      '#.................####.......#',
      '#....S............####...N...#',
      '#............................#',
      '#............................#',
      '#..........................>.#',
      '#............................#',
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
      '#............................#',
      '#...####.........#####.......#',
      '#...#..N#........#.MM#........#',
      '#...#...#........#...#........#',
      '#...#...#........#...#...*....#',
      '#............................#',
      '#............................#',
      '#....######.......#####......#',
      '#....#.S.#........#.N.#...>...#',
      '#....#...#........#...#.......#',
      '#............................#',
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
