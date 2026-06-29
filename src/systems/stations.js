/**
 * stations.js — the vocabulary of NEW interactables beyond sign/screen/npc, so
 * each chapter can have its own verb without bloating ZoneScene.
 *
 * MARKER_SPEC maps an ASCII map char → how to place it and which zone-data array
 * backs it (Nth marker → Nth entry, the same convention signs/shards already
 * use). Every field is optional content: a zone that doesn't define the array
 * simply renders nothing, so adding these is non-breaking and phase-by-phase.
 *
 * `place` drives ZoneScene.placeInteractables:
 *   solid     — a blocker you press E at (gate, anvil, workbench, data node, vuln)
 *   pickup    — walk over to collect (component piece, cert relic)
 *   proximity — fires automatically when you get near (meeting door, ember node)
 *   step      — a floor trigger you stand on (pitch stage)
 *
 * STATION_HANDLERS runs on activation; handlers delegate to ZoneScene methods
 * added in the relevant phase (optional-chained, so an unwired kind is a no-op).
 */

export const MARKER_SPEC = {
  G: { char: 'G', kind: 'gate',      arr: 'gates',      tex: 'gate',      place: 'solid' },
  c: { char: 'c', kind: 'component', arr: 'components', tex: 'component', place: 'pickup' },
  A: { char: 'A', kind: 'anvil',     arr: 'anvils',     tex: 'anvil',     place: 'solid' },
  P: { char: 'P', kind: 'pitch',     arr: 'pitches',    tex: 'stage',     place: 'step' },
  W: { char: 'W', kind: 'workbench', arr: 'ships',      tex: 'workbench', place: 'solid' },
  o: { char: 'o', kind: 'dataNode',  arr: 'dataNodes',  tex: 'globe',     place: 'solid' },
  B: { char: 'B', kind: 'meeting',   arr: 'meetings',   tex: 'door_room', place: 'proximity' },
  V: { char: 'V', kind: 'vuln',      arr: 'vulns',      tex: 'anomaly',   place: 'solid', secret: true },
  R: { char: 'R', kind: 'relic',     arr: 'relics',     tex: 'relic',     place: 'pickup', secret: true },
  F: { char: 'F', kind: 'ember',     arr: 'emberNodes', tex: 'ember_node',place: 'proximity' },
  L: { char: 'L', kind: 'letter',    arr: 'letters',    tex: 'letter',    place: 'pickup' },
  K: { char: 'K', kind: 'campfire',  arr: 'campfires',  tex: 'campfire',  place: 'solid' },
  Y: { char: 'Y', kind: 'lever',     arr: 'levers',     tex: 'lever',     place: 'solid' },
  X: { char: 'X', kind: 'present',   arr: 'podiums',    tex: 'podium',    place: 'solid' },
};

export const MARKER_CHARS = Object.keys(MARKER_SPEC);

// station kinds the Guide should lead the player through like a story beat
// (they count toward zone completion, same as signs/screens/npcs).
export const GUIDED_STATION_KINDS = new Set(['workbench', 'dataNode', 'component', 'anvil', 'pitch', 'lever', 'present']);

// verb shown in the floating [E] prompt for press-E station kinds
export const STATION_VERB = {
  gate: 'Try', anvil: 'Forge', workbench: 'Ship', dataNode: 'Connect', vuln: 'Inspect',
  campfire: 'Burn', lever: 'Pull', present: 'Present',
};

const STATION_HANDLERS = {
  gate:      (s, st) => s.bumpGate?.(st),
  workbench: (s, st) => s.shipWork?.(st),
  anvil:     (s, st) => s.tryForge?.(st),
  dataNode:  (s, st) => s.connectNode?.(st),
  vuln:      (s, st) => s.fixVuln?.(st),
  campfire:  (s, st) => s.burnLetter?.(st),
  lever:     (s, st) => s.pullLever?.(st),
  present:   (s, st) => s.startPresent?.(st),
};

export function runStation(scene, station) {
  STATION_HANDLERS[station.kind]?.(scene, station);
}
