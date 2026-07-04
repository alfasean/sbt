import { describe, it, expect } from "vitest";
import { ASSIST, captureRadius, isSunk, generateWind } from "./physics";

describe("captureRadius", () => {
  it("is baseRadius on the first attempt", () => {
    expect(captureRadius(1)).toBe(ASSIST.baseRadius);
  });

  it("widens with each miss", () => {
    expect(captureRadius(3)).toBe(ASSIST.baseRadius + 2 * ASSIST.growthPerMiss);
    expect(captureRadius(3)).toBeGreaterThan(captureRadius(1));
  });
});

describe("isSunk", () => {
  it("sinks a ball inside the capture zone", () => {
    expect(isSunk(680, 680, 1)).toBe(true);
    expect(isSunk(680 - ASSIST.baseRadius, 680, 1)).toBe(true);
  });

  it("misses a ball outside the capture zone on an early attempt", () => {
    expect(isSunk(680 - ASSIST.baseRadius - 5, 680, 1)).toBe(false);
  });

  it("is guaranteed once guaranteeAttempt is reached, regardless of distance", () => {
    expect(isSunk(0, 680, ASSIST.guaranteeAttempt)).toBe(true);
    expect(isSunk(0, 680, ASSIST.guaranteeAttempt + 2)).toBe(true);
  });
});

describe("generateWind", () => {
  it("uses the injected rng for strength and direction", () => {
    const values = [0.42, 0.2]; // first call -> strength, second -> direction
    const rand = () => values.shift();
    const wind = generateWind(rand);
    expect(wind.strength).toBe(0.42);
    expect(wind.direction).toBe(-1); // 0.2 < 0.5 => left
  });

  it("keeps strength within [0,1]", () => {
    const wind = generateWind(() => 0.999);
    expect(wind.strength).toBeGreaterThanOrEqual(0);
    expect(wind.strength).toBeLessThanOrEqual(1);
  });
});
