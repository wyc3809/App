/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it } from "vitest";
import { useWorthStore } from "./store";

describe("worth store features", () => {
  beforeEach(() => {
    localStorage.clear();
    useWorthStore.setState({
      accounts: [],
      valueEntries: [],
      transactions: [],
      snapshots: [],
      hydrated: true,
    });
  });

  it("adds an account and seeds value history", () => {
    useWorthStore.getState().addAccount({
      name: "Cash",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 1000,
      asOfDate: "2026-08-01",
    });
    const { accounts, valueEntries } = useWorthStore.getState();
    expect(accounts).toHaveLength(1);
    expect(accounts[0].name).toBe("Cash");
    expect(valueEntries.some((e) => e.accountId === accounts[0].id)).toBe(true);
  });

  it("adds a ledger expense linked to a liability account", () => {
    useWorthStore.getState().addAccount({
      name: "Mortgage",
      category: "loan",
      isLiability: true,
      currency: "HKD",
      currentValue: 331533.14,
      asOfDate: "2026-09-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 520000,
      currency: "HKD",
      date: "2026-09-02",
      title: "Food",
      category: "food",
      accountId,
    });
    const { accounts, valueEntries } = useWorthStore.getState();
    expect(accounts[0].currentValue).toBe(851533.14);
    const linked = valueEntries.find((e) => e.transactionId);
    expect(linked?.delta).toBe(520000);
    expect(linked?.value).toBe(851533.14);
  });

  it("fixes legacy negative liability balances when linking ledger", () => {
    useWorthStore.getState().addAccount({
      name: "HSBC Savings",
      category: "loan",
      isLiability: true,
      currency: "HKD",
      currentValue: 331533.14,
      asOfDate: "2026-09-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().upsertValueEntry({
      accountId,
      date: "2026-09-01",
      value: -331533.14,
      note: "legacy signed row",
    });
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 520000,
      currency: "HKD",
      date: "2026-09-02",
      title: "Food",
      category: "food",
      accountId,
    });
    const { accounts } = useWorthStore.getState();
    expect(accounts[0].currentValue).toBe(851533.14);
  });

  it("adds a ledger expense linked to an account", () => {
    useWorthStore.getState().addAccount({
      name: "Cash",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 1000,
      asOfDate: "2026-08-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 100,
      currency: "HKD",
      date: "2026-08-02",
      title: "Lunch",
      category: "food",
      accountId,
    });
    const { transactions, accounts } = useWorthStore.getState();
    expect(transactions).toHaveLength(1);
    expect(accounts[0].currentValue).toBe(900);
  });

  it("merges CSV account and ledger rows", () => {
    const result = useWorthStore.getState().importCsvData({
      accounts: [
        {
          name: "HSBC",
          category: "cash",
          isLiability: false,
          currency: "HKD",
          currentValue: 5000,
          asOfDate: "2026-08-01",
        },
      ],
      transactions: [
        {
          type: "expense",
          amount: 50,
          currency: "HKD",
          date: "2026-08-03",
          title: "Taxi",
          category: "transport",
          accountName: "HSBC",
        },
      ],
    });
    expect(result.accountsAdded).toBe(1);
    expect(result.transactionsAdded).toBe(1);
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(4950);
  });

  it("skips duplicate account names on CSV import", () => {
    useWorthStore.getState().importCsvData({
      accounts: [
        {
          name: "Cash",
          category: "cash",
          isLiability: false,
          currency: "HKD",
          currentValue: 100,
          asOfDate: "2026-08-01",
        },
      ],
      transactions: [],
    });
    const again = useWorthStore.getState().importCsvData({
      accounts: [
        {
          name: "Cash",
          category: "cash",
          isLiability: false,
          currency: "HKD",
          currentValue: 999,
          asOfDate: "2026-08-01",
        },
      ],
      transactions: [],
    });
    expect(again.accountsAdded).toBe(0);
    expect(useWorthStore.getState().accounts).toHaveLength(1);
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(100);
  });

  it("upserts a negative value entry for signed balances", () => {
    useWorthStore.getState().addAccount({
      name: "Cash",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 1000,
      asOfDate: "2026-08-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().upsertValueEntry({
      accountId,
      date: "2026-08-04",
      value: -250,
      note: "overdraft",
    });
    const { accounts, valueEntries } = useWorthStore.getState();
    expect(accounts[0].currentValue).toBe(-250);
    expect(valueEntries.some((e) => e.value === -250)).toBe(true);
  });
});
