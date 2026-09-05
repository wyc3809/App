import { describe, expect, it } from "vitest";
import {
  formatDateLabel,
  formatMoney,
  formatPercent,
  todayISO,
} from "./format";
import type { Currency } from "./types";

const currencies: Currency[] = [
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", exchangeRateToBase: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", exchangeRateToBase: 7.8 },
];

describe("format", () => {
  it("formats money with symbol and optional sign", () => {
    expect(formatMoney(1234.5, "HKD", currencies)).toBe("HK$1,234.5");
    expect(formatMoney(100, "HKD", currencies, { showSign: true })).toBe("+HK$100");
    expect(formatMoney(-50, "HKD", currencies, { showSign: true })).toBe("-HK$50");
  });

  it("masks money in privacy mode", () => {
    expect(formatMoney(999, "HKD", currencies, { privacy: true })).toBe("••••••");
  });

  it("compacts large amounts", () => {
    expect(formatMoney(12_500, "HKD", currencies, { compact: true })).toBe("HK$12.5K");
    expect(formatMoney(2_500_000, "HKD", currencies, { compact: true })).toBe(
      "HK$2.50M",
    );
  });

  it("formats percent and date labels", () => {
    expect(formatPercent(12.34)).toBe("+12.3%");
    expect(formatPercent(-1.2)).toBe("-1.2%");
    expect(formatDateLabel("2026-08-04")).toMatch(/Aug/);
    expect(todayISO()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("uses the local calendar day for todayISO", () => {
    // 2026-09-05 01:30 in UTC+8 is still 2026-09-04 in UTC
    const localMorning = new Date(2026, 8, 5, 1, 30, 0);
    expect(todayISO(localMorning)).toBe("2026-09-05");
  });
});
