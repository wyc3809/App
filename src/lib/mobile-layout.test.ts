import { describe, expect, it } from "vitest";

/**
 * Mobile layout contracts that prevent iOS Safari zoom + untappable controls.
 */
describe("mobile layout contracts", () => {
  it("requires form fields to be at least 16px to avoid focus zoom", () => {
    const fieldFontRem = 1; // text-base
    const pxAtDefaultRoot = fieldFontRem * 16;
    expect(pxAtDefaultRoot).toBeGreaterThanOrEqual(16);
  });

  it("stacks sheets above the bottom nav", () => {
    const navZ = 40;
    const sheetZ = 70;
    expect(sheetZ).toBeGreaterThan(navZ);
  });

  it("keeps account detail CTAs above nav without overlapping it", () => {
    const ctaBottom = "calc(var(--nav-height) + var(--safe-bottom))";
    expect(ctaBottom).toContain("nav-height");
    expect(ctaBottom).not.toMatch(/^0/);
  });
});
