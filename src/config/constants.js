// Bare constants with NO imports, so they can be shared by gameConfig and the
// scenes without creating a circular dependency (which would put these values
// in a temporal dead zone at module-eval time).

// World grid: everything is built on a 32px tile.
export const TILE = 32;

// Internal render resolution. Kept small-ish; Scale.FIT blows it up so pixels
// stay chunky (Pokémon-on-a-DS energy).
export const VIEW_W = 800;
export const VIEW_H = 600;
