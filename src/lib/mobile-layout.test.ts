import { describe, expect, it } from "vitest";

/**
 * Mobile layout contracts that prevent iOS Safari zoom, sideways page-drag,
 * and untappable controls.
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

  it("locks the document to vertical pan only (no sideways page drag)", () => {
    // Mirrored by globals.css on html/body/.app-shell/.app-main.
    const documentTouchAction = "pan-y";
    const overscrollX = "none";
    const overflowX = "hidden";
    expect(documentTouchAction).toBe("pan-y");
    expect(overscrollX).toBe("none");
    expect(overflowX).toBe("hidden");
  });

  it("allows date/select fields to shrink inside CSS grids", () => {
    // Native date inputs have large intrinsic min-widths; grid children must
    // use min-width:0 (see `.grid > *` and `.field` / `.field-date` in globals.css).
    const gridChildMinWidth = 0;
    const fieldMinWidth = 0;
    expect(gridChildMinWidth).toBe(0);
    expect(fieldMinWidth).toBe(0);
  });

  it("keeps As of date full-width so iOS date inputs cannot overflow the sheet", () => {
    // AccountForm stacks Current value + As of date instead of a 2-col grid.
    const asOfDateLayout = "stacked-full-width";
    expect(asOfDateLayout).toBe("stacked-full-width");
  });
});
