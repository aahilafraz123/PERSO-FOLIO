/**
 * Objective — the single source of truth for a level's goal.
 *
 * Each zone declares `objective: { label, kind }` in story.js. Given the live
 * ZoneScene, objectiveState() reads the relevant mechanic state and returns
 * `{ label, text, done, total, complete }`. The scene uses this to drive the
 * top-center objective banner AND to gate the exit (the portal only reveals when
 * `complete`). Per-kind logic lives here so it doesn't scatter across ZoneScene.
 *
 * kinds: burn (Wilderness) · ship (Hollow) · forge (Forge) · deploy (Mission) ·
 *        present (Arena) · send (Horizon).
 */

function forgeState(s) {
  const total = s.buildTotal || 0;
  if (s.pitched) return { text: 'pitched', done: 1, total: 1, complete: true };
  if (s.forged) return { text: 'Pitch it on the stage', done: total, total, complete: false };
  if ((s.buildCount || 0) >= total) return { text: 'Forge it at the anvil', done: total, total, complete: false };
  return { text: `Collect the systems · ${s.buildCount || 0}/${total}`, done: s.buildCount || 0, total, complete: false };
}

function burnState(s) {
  const total = s.burnTotal || 0;
  const done = s.burnedCount || 0;
  return { text: `Rejections burned · ${done}/${total}`, done, total, complete: total > 0 && done >= total };
}

function shipState(s) {
  const total = s.shipTotal || 0;
  const done = s.shippedCount || 0;
  return { text: `Work shipped · ${done}/${total}`, done, total, complete: total > 0 && done >= total };
}

function deployState(s) {
  const total = s.deployTotal || 0;
  const done = s.connectedCount || 0;
  if (s.deployed) return { text: 'AirCast is live', done: total, total, complete: true };
  if (done >= total) return { text: 'Pull the deploy lever', done, total, complete: false };
  return { text: `Data sources wired · ${done}/${total}`, done, total, complete: false };
}

function presentState(s) {
  if (s.presented) return { text: 'presented', done: 1, total: 1, complete: true };
  if (s.reachedBoardroom) return { text: 'Present to leadership', done: 0, total: 1, complete: false };
  return { text: 'Reach the boardroom', done: 0, total: 1, complete: false };
}

function sendState(s) {
  if (s.sent) return { text: 'sent', done: 1, total: 1, complete: true };
  return { text: 'Reach the contact terminal', done: 0, total: 1, complete: false };
}

const KINDS = {
  forge: forgeState, burn: burnState, ship: shipState,
  deploy: deployState, present: presentState, send: sendState,
};

export function objectiveState(scene) {
  const o = scene.zone.objective;
  if (!o) return null;
  const fn = KINDS[o.kind];
  const base = fn ? fn(scene) : { text: '', done: 0, total: 0, complete: false };
  return { label: o.label, ...base };
}
