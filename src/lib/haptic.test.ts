import { afterEach, describe, expect, it, vi } from "vitest";
import { canHaptic, haptic, hapticSuccess, hapticTap } from "./haptic";

describe("haptic", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("no-ops when vibrate is unavailable", () => {
    vi.stubGlobal("navigator", {});
    expect(canHaptic()).toBe(false);
    expect(hapticTap()).toBe(false);
  });

  it("fires short pulse for tap", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    expect(canHaptic()).toBe(true);
    expect(hapticTap()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(8);
  });

  it("fires pattern for success", () => {
    const vibrate = vi.fn(() => true);
    vi.stubGlobal("navigator", { vibrate });
    expect(hapticSuccess()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith([10, 40, 12]);
  });

  it("returns false when vibrate throws", () => {
    const vibrate = vi.fn(() => {
      throw new Error("blocked");
    });
    vi.stubGlobal("navigator", { vibrate });
    expect(haptic("tap")).toBe(false);
  });
});
