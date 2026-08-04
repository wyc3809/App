import { describe, expect, it } from "vitest";
import {
  categoryAfterTypeFlip,
  categoryColor,
  categoryLabel,
} from "./categories";

describe("categories", () => {
  it("returns labels and colors", () => {
    expect(categoryLabel("cash")).toMatch(/Cash/i);
    expect(categoryColor("investment")).toMatch(/^#/);
  });

  it("picks default category after type flip", () => {
    expect(categoryAfterTypeFlip(true)).toBe("loan");
    expect(categoryAfterTypeFlip(false)).toBe("cash");
  });
});
