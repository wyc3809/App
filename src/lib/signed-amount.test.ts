import { describe, expect, it } from "vitest";
import {
  combineSignedAmount,
  flipAmountSign,
  splitSignedAmount,
} from "./signed-amount";

describe("signed-amount", () => {
  it("splits positive, negative, and zero", () => {
    expect(splitSignedAmount(4577094)).toEqual({
      magnitude: "4577094",
      sign: 1,
    });
    expect(splitSignedAmount(-250.5)).toEqual({
      magnitude: "250.5",
      sign: -1,
    });
    expect(splitSignedAmount(0)).toEqual({ magnitude: "0", sign: 1 });
  });

  it("combines magnitude with sign", () => {
    expect(combineSignedAmount("4577094", 1)).toBe(4577094);
    expect(combineSignedAmount("250.5", -1)).toBe(-250.5);
    expect(combineSignedAmount(" 12 ", -1)).toBe(-12);
    expect(combineSignedAmount("-9", 1)).toBe(9);
    expect(combineSignedAmount("", 1)).toBeNull();
    expect(combineSignedAmount("abc", -1)).toBeNull();
  });

  it("flips sign", () => {
    expect(flipAmountSign(1)).toBe(-1);
    expect(flipAmountSign(-1)).toBe(1);
  });
});
