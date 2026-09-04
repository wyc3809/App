import { describe, expect, it } from "vitest";
import {
  parseCsvDate,
  parseWorthCsv,
  splitCsvLine,
} from "./import-csv";

describe("import-csv", () => {
  it("splits quoted CSV fields", () => {
    expect(splitCsvLine('a,"b,c",d')).toEqual(["a", "b,c", "d"]);
    expect(splitCsvLine('a,"say ""hi""",b')).toEqual(["a", 'say "hi"', "b"]);
  });

  it("parses common date formats", () => {
    expect(parseCsvDate("2026-08-04")).toBe("2026-08-04");
    expect(parseCsvDate("4/8/2026")).toBe("2026-08-04");
    expect(parseCsvDate("04-08-2026")).toBe("2026-08-04");
    expect(parseCsvDate("2026/8/4")).toBe("2026-08-04");
  });

  it("parses accounts CSV", () => {
    const csv = `name,type,category,currency,value,as_of_date
Cash,asset,cash,HKD,1000,2026-08-01
Loan,liability,loan,HKD,5000,2026-08-01
`;
    const result = parseWorthCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("accounts");
    expect(result.accounts).toHaveLength(2);
    expect(result.accounts[0].isLiability).toBe(false);
    expect(result.accounts[1].isLiability).toBe(true);
    expect(result.accounts[1].currentValue).toBe(5000);
  });

  it("parses ledger CSV", () => {
    const csv = `date,type,amount,currency,title,category,account
2026-08-01,income,28000,HKD,Salary,salary,Cash
2026-08-02,expense,50,HKD,Lunch,food,Cash
`;
    const result = parseWorthCsv(csv);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.kind).toBe("ledger");
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].type).toBe("income");
    expect(result.transactions[1].accountName).toBe("Cash");
  });

  it("parses mortgage type as liability and payment as income", () => {
    const accountsCsv = `name,type,currency,value,as_of_date
HSBC Mortgage,mortgage,HKD,2000000,2026-08-01
Amex,credit_card,HKD,8000,2026-08-01
`;
    const accounts = parseWorthCsv(accountsCsv);
    expect(accounts.ok).toBe(true);
    if (!accounts.ok) return;
    expect(accounts.accounts[0].isLiability).toBe(true);
    expect(accounts.accounts[0].category).toBe("mortgage");
    expect(accounts.accounts[1].isLiability).toBe(true);
    expect(accounts.accounts[1].category).toBe("credit_card");

    const ledgerCsv = `date,type,amount,currency,title,category,account
2026-08-02,payment,5000,HKD,Card payment,transfer,Amex
`;
    const ledger = parseWorthCsv(ledgerCsv);
    expect(ledger.ok).toBe(true);
    if (!ledger.ok) return;
    expect(ledger.transactions[0].type).toBe("income");
  });
});
