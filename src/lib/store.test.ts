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

  it("does not overwrite ledger rows when manually updating same-day balance", () => {
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
    useWorthStore.getState().upsertValueEntry({
      accountId,
      date: "2026-08-02",
      value: 850,
      note: "manual reconcile",
    });
    const { valueEntries, accounts } = useWorthStore.getState();
    const dayRows = valueEntries.filter(
      (e) => e.accountId === accountId && e.date === "2026-08-02",
    );
    expect(dayRows).toHaveLength(2);
    expect(dayRows.some((e) => e.transactionId)).toBe(true);
    expect(dayRows.some((e) => !e.transactionId && e.value === 850)).toBe(true);
    expect(accounts[0].currentValue).toBe(850);
  });

  it("editing a manual entry keeps same-day ledger rows", () => {
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
      date: "2026-08-02",
      value: 1000,
      note: "opening",
    });
    const manualId = useWorthStore
      .getState()
      .valueEntries.find((e) => !e.transactionId && e.date === "2026-08-02")!.id;
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 50,
      currency: "HKD",
      date: "2026-08-02",
      title: "Coffee",
      category: "food",
      accountId,
    });
    useWorthStore.getState().upsertValueEntry({
      entryId: manualId,
      accountId,
      date: "2026-08-02",
      value: 990,
      note: "adjusted opening",
    });
    const dayRows = useWorthStore.getState().valueEntries.filter(
      (e) => e.accountId === accountId && e.date === "2026-08-02",
    );
    expect(dayRows).toHaveLength(2);
    expect(dayRows.some((e) => e.transactionId)).toBe(true);
  });

  it("updates linked ledger amount through updateTransaction", () => {
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
    const txId = useWorthStore.getState().transactions[0].id;
    useWorthStore.getState().updateTransaction(txId, { amount: 150 });
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(850);
  });

  it("deletes linked ledger and restores account balance", () => {
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
    const txId = useWorthStore.getState().transactions[0].id;
    useWorthStore.getState().deleteTransaction(txId);
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(1000);
    expect(useWorthStore.getState().valueEntries.filter((e) => e.transactionId)).toHaveLength(0);
  });

  it("persona power user: backdated expense uses pre-flip asset math", () => {
    useWorthStore.getState().addAccount({
      name: "Cash",
      category: "cash",
      isLiability: false,
      currency: "HKD",
      currentValue: 100,
      asOfDate: "2026-08-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 150,
      currency: "HKD",
      date: "2026-08-10",
      title: "Overdraft",
      category: "other",
      accountId,
    });
    expect(useWorthStore.getState().accounts[0].isLiability).toBe(true);
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(50);

    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 10,
      currency: "HKD",
      date: "2026-08-05",
      title: "Snack",
      category: "food",
      accountId,
    });
    // Pre-flip asset: 100 - 10 = 90, then later flip still on top of cascade.
    // Latest after Aug 10 flip row cascaded: 50 + (-10) = 40 liability.
    const state = useWorthStore.getState();
    const snack = state.valueEntries.find((e) => e.note?.includes("Snack"));
    expect(snack?.value).toBe(90);
    expect(snack?.delta).toBe(-10);
    expect(state.accounts[0].isLiability).toBe(true);
    expect(state.accounts[0].currentValue).toBe(40);
  });

  it("persona debtor: card payment as income reduces debt", () => {
    useWorthStore.getState().addAccount({
      name: "Amex",
      category: "credit_card",
      isLiability: true,
      currency: "HKD",
      currentValue: 5000,
      asOfDate: "2026-08-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().addTransaction({
      type: "income",
      amount: 2000,
      currency: "HKD",
      date: "2026-08-15",
      title: "Card payment",
      category: "transfer",
      accountId,
    });
    expect(useWorthStore.getState().accounts[0].currentValue).toBe(3000);
  });

  it("persona investor: backdated snapshot uses history not live totals", () => {
    useWorthStore.getState().addAccount({
      name: "Broker",
      category: "investment",
      isLiability: false,
      currency: "HKD",
      currentValue: 1000,
      asOfDate: "2026-07-01",
    });
    const accountId = useWorthStore.getState().accounts[0].id;
    useWorthStore.getState().upsertValueEntry({
      accountId,
      date: "2026-08-01",
      value: 2000,
    });
    useWorthStore.getState().addTransaction({
      type: "expense",
      amount: 100,
      currency: "HKD",
      date: "2026-07-15",
      title: "Fee",
      category: "other",
      accountId,
    });
    const snap = useWorthStore
      .getState()
      .snapshots.find((s) => s.date === "2026-07-15");
    expect(snap?.netWorthBaseCurrency).toBe(900);
  });
});
