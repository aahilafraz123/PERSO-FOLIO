/**
 * TorchResource — makes the signature light something you DO, not just something
 * that happens to you on zone entry (GDD §0, §2).
 *
 * It sits on top of LightSystem and, when a zone opts in (`zone.torchDecay`),
 * gently breathes the torch radius: standing still / reading lets the dark creep
 * back in; moving forward feeds the flame. Reading a demoralizing sign can fire a
 * discrete `pulse()` dip. This is ATMOSPHERIC ONLY — the radius is hard-clamped
 * to a `floor` that always keeps the player + a nearby sign readable, so the
 * light can never die, trap, or block progress (locked design decision).
 *
 * Zones that don't opt in get the original behavior verbatim: TorchResource just
 * forwards update() to LightSystem and never touches the radius.
 */
export default class TorchResource {
  constructor(scene, light, { base, decay = false } = {}) {
    this.scene = scene;
    this.light = light;
    this.enabled = !!decay;
    this.base = base ?? light.torchRadius;

    // never dim below this — keeps a sign one tile away always lit (screen px).
    // ~76% of base, with an absolute readability minimum.
    this.floor = Math.max(118, Math.round(this.base * 0.76));

    // start wherever the zone-entry tween left us, then let breathing take over
    this.value = light.torchRadius;

    this.decayRate = 26;    // px/sec the dark reclaims while still
    this.recoverRate = 70;  // px/sec the flame regains while moving
  }

  /** A discrete knock to the flame (reading a rejection, bumping a locked gate). */
  pulse(amount = 22) {
    if (!this.enabled) return;
    this.value = Math.max(this.floor, this.value - amount);
  }

  /** A permanent confidence bump to the ceiling (forging a component, etc.). */
  raiseBase(delta, ms = 900) {
    this.base += delta;
    this.light.growTo(this.base, ms);
    if (!this.enabled) this.value = this.base;
  }

  /**
   * Drive the light. `moving` = the player is actually walking this frame.
   * Call this from ZoneScene.update in place of light.update(player).
   */
  update(player, moving) {
    if (this.enabled) {
      const dt = Math.min(this.scene.game.loop.delta, 50) / 1000;
      this.value += (moving ? this.recoverRate : -this.decayRate) * dt;
      this.value = Math.max(this.floor, Math.min(this.base, this.value));
      this.light.torchRadius = this.value;
    }
    this.light.update(player);
  }
}
