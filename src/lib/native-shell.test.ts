import { describe, expect, it } from "vitest";
import { hideNativeSplash, syncNativeChrome } from "./native-shell";

describe("native-shell", () => {
  it("no-ops on web for splash and status bar", async () => {
    await expect(hideNativeSplash()).resolves.toBeUndefined();
    await expect(syncNativeChrome("light")).resolves.toBeUndefined();
    await expect(syncNativeChrome("dark")).resolves.toBeUndefined();
  });
});
