import type { Currency } from "./types";

/** Default rates relative to HKD as base (1 unit of currency = X HKD). */
export const DEFAULT_CURRENCIES: Currency[] = [
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar", exchangeRateToBase: 1 },
  { code: "USD", symbol: "$", name: "US Dollar", exchangeRateToBase: 7.8 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", exchangeRateToBase: 1.08 },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", exchangeRateToBase: 0.052 },
  { code: "EUR", symbol: "€", name: "Euro", exchangeRateToBase: 8.45 },
  { code: "GBP", symbol: "£", name: "British Pound", exchangeRateToBase: 9.9 },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", exchangeRateToBase: 5.85 },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", exchangeRateToBase: 5.1 },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", exchangeRateToBase: 5.7 },
  { code: "TWD", symbol: "NT$", name: "Taiwan Dollar", exchangeRateToBase: 0.24 },
];

export function getCurrencyMap(currencies: Currency[]): Record<string, Currency> {
  return Object.fromEntries(currencies.map((c) => [c.code, c]));
}

/**
 * Convert an amount from `fromCode` to `toCode` using rates expressed
 * as "units of base currency per 1 unit of this currency".
 */
export function convertAmount(
  amount: number,
  fromCode: string,
  toCode: string,
  currencies: Currency[],
): number {
  if (fromCode === toCode) return amount;
  const map = getCurrencyMap(currencies);
  const from = map[fromCode];
  const to = map[toCode];
  if (!from || !to || from.exchangeRateToBase <= 0 || to.exchangeRateToBase <= 0) {
    return amount;
  }
  const inBase = amount * from.exchangeRateToBase;
  return inBase / to.exchangeRateToBase;
}

export function toBaseCurrency(
  amount: number,
  currencyCode: string,
  currencies: Currency[],
): number {
  const map = getCurrencyMap(currencies);
  const currency = map[currencyCode];
  if (!currency) return amount;
  return amount * currency.exchangeRateToBase;
}

/**
 * Rebase all exchange rates when the user changes base currency.
 * Rates remain "units of (new) base per 1 unit of currency".
 */
export function rebaseCurrencyRates(
  currencies: Currency[],
  newBaseCode: string,
): Currency[] {
  const map = getCurrencyMap(currencies);
  const newBase = map[newBaseCode];
  if (!newBase || newBase.exchangeRateToBase <= 0) return currencies;

  const factor = newBase.exchangeRateToBase;
  return currencies.map((c) => ({
    ...c,
    exchangeRateToBase:
      c.code === newBaseCode ? 1 : Number((c.exchangeRateToBase / factor).toFixed(6)),
  }));
}
