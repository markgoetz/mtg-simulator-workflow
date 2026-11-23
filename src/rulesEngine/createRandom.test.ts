import { describe, expect, it } from "vitest";
import createRandom from "./createRandom.js";

const take = (seed: number, count: number) => {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => random());
};

describe("createRandom", () => {
  // Expected values come from a separate mulberry32 program. For seed 1 the first value, 0.6270739405881613,
  // is the widely published mulberry32 reference value.
  it.each([
    [1, [0.6270739405881613, 0.002735721180215478, 0.5274470399599522]],
    [42, [0.6011037519201636, 0.44829055899754167, 0.8524657934904099]],
    [4294967295, [0.8964226141106337, 0.189478256739676, 0.7156526781618595]],
  ])("gives the known mulberry32 numbers for seed %s", (seed, expected) => {
    expect(take(seed, 3)).toEqual(expected);
  });

  it("gives the same numbers every time for the same seed", () => {
    expect(take(7, 5)).toEqual(take(7, 5));
  });

  it("keeps every number from 0 up to, but not including, 1", () => {
    for (const value of take(123, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
