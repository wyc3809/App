import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const fixturesDir = path.join(process.cwd(), "e2e", "fixtures");

async function clearAppData(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

/** Wait until Zustand persist finishes and the shell is interactive. */
async function waitForAppReady(page: Page) {
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible({
    timeout: 20_000,
  });
}

async function loadDemo(page: Page) {
  await page.goto("/");
  await waitForAppReady(page);
  await page.getByRole("button", { name: /more options/i }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: /load demo data/i }).click();
  await expect(page.getByText(/net worth|HK\$/i).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe("WorthBook E2E", () => {
  test.beforeEach(async ({ page }) => {
    await clearAppData(page);
  });

  test("home loads and shows WorthBook branding", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await expect(page.getByText("WorthBook").first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Ledger" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Insights" })).toBeVisible();
  });

  test("settings is reachable from Home menu", async ({ page }) => {
    await page.goto("/");
    await waitForAppReady(page);
    await page.getByRole("button", { name: /more options/i }).click();
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Import CSV/i })).toBeVisible();
  });

  test("ledger quick entry saves an expense", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Ledger" }).click();
    await expect(page.getByRole("heading", { name: "Ledger" })).toBeVisible();

    await page.getByRole("tab", { name: "Expense" }).click();
    await page.getByRole("button", { name: "Food", exact: true }).click();

    await page.getByRole("button", { name: "5", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "Done" }).click();

    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText("Food").first()).toBeVisible();
    await expect(page.getByText(/HK\$50|−HK\$50|-HK\$50/)).toBeVisible();
  });

  test("insights chart chips switch charts", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Insights" }).click();
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

    await page.getByRole("tab", { name: "Growth" }).click();
    await expect(
      page.getByRole("heading", { name: /Growth/i }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Allocation" }).click();
    await expect(page.getByRole("heading", { name: "Allocation" })).toBeVisible();

    await page.getByRole("tab", { name: "Calendar" }).click();
    await expect(page.getByRole("heading", { name: "Monthly calendar" })).toBeVisible();

    await page.getByRole("tab", { name: "Cashflow" }).click();
    await expect(page.getByRole("heading", { name: "Income vs Expense" })).toBeVisible();
  });

  test("add account cancel closes the sheet", async ({ page }) => {
    await page.goto("/accounts/?new=1");
    await waitForAppReady(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("imports ledger CSV from settings", async ({ page }) => {
    await page.goto("/settings/");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const csvPath = path.join(fixturesDir, "ledger-sample.csv");
    page.once("dialog", (d) => d.accept());
    await page.locator('input[type="file"][accept*="csv"]').setInputFiles(csvPath);

    await expect(page.getByText(/Added .+ ledger/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("link", { name: "Ledger" }).click();
    await expect(
      page.getByText("CSV Salary").or(page.getByText("Salary")),
    ).toBeVisible({ timeout: 10_000 });
  });
});
