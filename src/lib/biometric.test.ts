/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  authenticateBiometric,
  getBiometricAvailability,
} from "./biometric";

describe("biometric", () => {
  it("reports unavailable on web", async () => {
    const avail = await getBiometricAvailability();
    expect(avail.available).toBe(false);
    if (!avail.available) {
      expect(avail.reason).toMatch(/iOS|Android|app/i);
    }
  });

  it("does not authenticate on web", async () => {
    expect(await authenticateBiometric()).toBe(false);
  });
});
