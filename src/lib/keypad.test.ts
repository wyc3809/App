import { describe, expect, it } from "vitest";
import {
  appendKey,
  appendOperator,
  backspace,
  evaluateExpression,
  formatKeypadDisplay,
} from "./keypad";

describe("keypad", () => {
  it("appends digits and replaces leading zero", () => {
    expect(appendKey("", "5")).toBe("5");
    expect(appendKey("0", "5")).toBe("5");
    expect(appendKey("12", "00")).toBe("1200");
  });

  it("handles decimal points per operand", () => {
    expect(appendKey("", ".")).toBe("0.");
    expect(appendKey("1.2", ".")).toBe("1.2");
    expect(appendKey("1+", ".")).toBe("1+0.");
  });

  it("evaluates left-to-right without precedence", () => {
    expect(evaluateExpression("10+2*3")).toBe(36);
    expect(evaluateExpression("100/4")).toBe(25);
    expect(evaluateExpression("9.5+0.5")).toBe(10);
    expect(evaluateExpression("")).toBeNull();
  });

  it("supports operators and backspace", () => {
    expect(appendOperator("12", "+")).toBe("12+");
    expect(appendOperator("12+", "-")).toBe("12-");
    expect(backspace("12+3")).toBe("12+");
  });

  it("formats display with currency symbol", () => {
    expect(formatKeypadDisplay("", "HK$")).toBe("HK$0");
    expect(formatKeypadDisplay("10*2", "HK$")).toBe("HK$10×2");
  });
});
