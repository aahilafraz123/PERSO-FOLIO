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
 * Torch radius per zone encodes the thesis (GDD §0, §2): darkness → light.
 */

export const ZONES = [
  // ===========================================================================
  // ZONE 1 — THE WILDERNESS (the rejection arc)
  // ===========================================================================
  {
    key: 'wilderness',
    chapter: 'I',
    name: 'THE WILDERNESS',
    subtitle: '0 interviews. 3 rounds. No light but the one you carry.',
    torchRadius: 82,
    wallStyle: 'tree',
    next: 'hollow',
    portalLabel: 'THE GRIND →',
    palette: {
      floor: 0x13251a, speckA: 0x183020, speckB: 0x0f1f15,
      wallDark: 0x16361f, wallLight: 0x1f4a2b, trunk: 0x3a2616,
      accent: 0x00d9f5,
    },
    intro: ['THE WILDERNESS', 'Round A. Round B. Round C. The path was never lit.'],
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
      '#...........###..............#',
      '#...........###..........>...#',
      '#............................#',
      '##############################',
    ],
    // 4 signs (rejection-speak, GDD §5 + §10)
    signs: [
      '"We\'ve decided to move forward with other candidates."',
      'Round A: no. Round B: no. Round C: no.\nThe path was never lit — so I made my own light.',
      '"We\'ll keep your resume on file for future openings."',
      '"This position has been closed."',
    ],
    // 4 shards
    shards: [
      { skill: 'Resilience', xp: 14 },
      { skill: 'Grit', xp: 12 },
      { skill: 'Patience', xp: 12 },
      { skill: 'Resolve', xp: 12 },
    ],
    // 1 monitor → the rejection inbox
    screens: ['rejections'],
    npcs: [],
    achievement: { title: 'Still Standing', desc: '0 offers, didn\'t quit.' },
  },

  // ===========================================================================
  // ZONE 2 — THE HOLLOW (the first co-op) — honest, never bitter (GDD §5)
  // ===========================================================================
  {
    key: 'hollow',
    chapter: 'II',
    name: 'THE HOLLOW',
    subtitle: 'No structure, no map, long silences. The place that forged the grind.',
    torchRadius: 112,
    wallStyle: 'block',
    next: 'forge',
    portalLabel: 'KEEP BUILDING →',
    palette: {
      floor: 0x1a1c24, speckA: 0x232631, speckB: 0x14161c,
      wallDark: 0x2a2d3a, wallLight: 0x3a3e4f, trunk: 0x20232e,
      accent: 0x6b7088,
    },
    intro: ['THE HOLLOW', 'It looked like a job. It was really a trial.'],
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
      'No structure, no map, long silences.\nI learned the grind by living without anything else.',
      'Weeks would pass with no contact.\nSo I stopped waiting to be told what to do.',
      'I shipped a Redis caching layer here.\nReal work, in a quiet room.',
      'Migrated 30+ components Angular → React.\n−25% bundle. −35% load time. Kept going.',
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
  // ZONE 3 — THE FORGE (LearnFlow) — light really starts to grow (GDD §5)
  // ===========================================================================
  {
    key: 'forge',
    chapter: 'III',
    name: 'THE FORGE',
    subtitle: 'Built it myself. 150+ users. Thirty-hour weeks. My own thing.',
    torchRadius: 172,
    wallStyle: 'block',
    next: 'mission',
    portalLabel: 'THE WORLD STAGE →',
    palette: {
      floor: 0x241a16, speckA: 0x2e221a, speckB: 0x1c1410,
      wallDark: 0x4a2e1c, wallLight: 0x6e4322, trunk: 0x32201a,
      accent: 0xff7b00,
    },
    intro: ['THE FORGE', 'Build your own weapon. 30-hour weeks. Pitch to anyone who\'ll listen.'],
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
      'LearnFlow. Co-founder, founding engineer.\nOCR, transcription, a 6-stage retrieval pipeline — forged into one tool.',
      'Built it myself. 150+ users, thirty-hour weeks,\npitched to anyone who\'d listen.',
      'Startup expo. Pitch fest. 5+ professors and faculty.\nIt taught me how to learn, not how to solve a puzzle.',
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
      { name: 'Classmate', lines: ['"Wait, you BUILT this? Like the whole thing?"'] },
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
    torchRadius: 232,
    wallStyle: 'block',
    next: 'arena',
    portalLabel: 'THE ARENA →',
    palette: {
      floor: 0x0d1424, speckA: 0x1a2540, speckB: 0x0a0f1c,
      wallDark: 0x1a2238, wallLight: 0x2a3656, trunk: 0x141c30,
      accent: 0x00d9f5,
    },
    intro: ['MISSION CONTROL', 'The work could stand on a world stage.'],
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
      'AirCast — AI air-quality forecasting on NASA TEMPO data.\n6-hour AQI predictions. Azure + CI/CD. Maps + charts.',
      'Team Relentless.\nWe didn\'t just enter. We stood out.',
      'The name was real before it was a portfolio.\nIt described the people first.',
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
  // ZONE 5 — THE ARENA — bright, in command (the first real corporate room).
  // White-labeled: no real people / employer named here; the Read view holds the
  // specifics (recruiter-appropriate). The game keeps the feeling, not the names.
  // ===========================================================================
  {
    key: 'arena',
    chapter: 'V',
    name: 'THE ARENA',
    subtitle: 'First time in a real arena — and you belong.',
    torchRadius: 320,
    wallStyle: 'block',
    next: 'horizon',
    portalLabel: 'THE HORIZON →',
    palette: {
      floor: 0x1a1c2e, speckA: 0x24263a, speckB: 0x141526,
      wallDark: 0x2a2d4a, wallLight: 0x3c4068, trunk: 0x22243c,
      accent: 0xffcf3a,
    },
    intro: ['THE ARENA', 'You carry your own light now.'],
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
      'First time in a room like this.\nYou did not ease in. You arrived.',
      'Back-to-back. Sync after sync.\nMore in a week than most have in a month.',
      'More than you could make it to.\nGrateful to be the one carrying the load.',
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
  // ZONE 6 — THE HORIZON (the unwritten chapter) — full daylight (GDD §5)
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
    intro: ['THE HORIZON', 'Full daylight. The whole world is lit.'],
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
      'The story\'s still being written.\nThe torch was never the point — learning to see in the dark was.',
      'Be 35 and free. Locked in until then.\nThen explore, grow, and learn for the love of it.',
    ],
    shards: [
      { skill: 'Curiosity', xp: 22 },
      { skill: 'Vision', xp: 20 },
      { skill: 'Freedom', xp: 20 },
    ],
    // monitors 'MM' = contact terminal + the read-my-story escape hatch
    screens: ['contact', 'read-hatch'],
    npcs: [],
    achievement: { title: 'The Horizon', desc: 'Out of the dark. The whole world, lit.' },
  },
];

export const ZONE_BY_KEY = Object.fromEntries(ZONES.map((z) => [z.key, z]));
export const FIRST_ZONE = ZONES[0].key;
