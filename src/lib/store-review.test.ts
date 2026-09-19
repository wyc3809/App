import { describe, expect, it } from "vitest";
import {
  shouldRequestStoreReview,
  STORE_REVIEW_STREAK_DAYS,
} from "./store-review";

describe("shouldRequestStoreReview", () => {
  it("asks only on native when streak celebration hits day 3", () => {
    expect(
      shouldRequestStoreReview({
        celebrationDay: STORE_REVIEW_STREAK_DAYS,
        alreadyPromptedForStreak3: false,
        isNative: true,
      }),
    ).toBe(true);
  });

  it("never asks on web", () => {
    expect(
      shouldRequestStoreReview({
        celebrationDay: 3,
        alreadyPromptedForStreak3: false,
        isNative: false,
      }),
    ).toBe(false);
  });

  it("never asks on launch-like days (1) or other milestones", () => {
    expect(
      shouldRequestStoreReview({
        celebrationDay: 1,
        alreadyPromptedForStreak3: false,
        isNative: true,
      }),
    ).toBe(false);
    expect(
      shouldRequestStoreReview({
        celebrationDay: 7,
        alreadyPromptedForStreak3: false,
        isNative: true,
      }),
    ).toBe(false);
  });

  it("asks only once for the 3-day milestone", () => {
    expect(
      shouldRequestStoreReview({
        celebrationDay: 3,
        alreadyPromptedForStreak3: true,
        isNative: true,
      }),
    ).toBe(false);
  });
});
