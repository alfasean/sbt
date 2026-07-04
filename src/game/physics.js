// Pure, framework-free helpers for the golf game. No Phaser/DOM imports so
// these can be unit-tested directly.

export const ASSIST = {
  baseRadius: 10,      // capture half-width (world px) on the first shot
  growthPerMiss: 16,   // how much the capture zone widens after each miss
  guaranteeAttempt: 4, // on this attempt (1-indexed) the shot always sinks
};

// Half-width of the "counts as in the cup" zone for a given attempt.
export function captureRadius(attempt, cfg = ASSIST) {
  return cfg.baseRadius + Math.max(0, attempt - 1) * cfg.growthPerMiss;
}

// Did the ball (resting at ballX) end up in the cup (at cupX) this attempt?
// The zone widens after each miss and is guaranteed once guaranteeAttempt hits,
// so the player always eventually sinks it.
export function isSunk(ballX, cupX, attempt, cfg = ASSIST) {
  if (attempt >= cfg.guaranteeAttempt) return true;
  return Math.abs(ballX - cupX) <= captureRadius(attempt, cfg);
}

// Randomised wind for a shot. `rand` is injectable for deterministic tests.
// direction: -1 (left) or +1 (right); strength: 0..1 (2 decimals).
export function generateWind(rand = Math.random) {
  const strength = Math.round(rand() * 100) / 100;
  const direction = rand() < 0.5 ? -1 : 1;
  return { direction, strength };
}
