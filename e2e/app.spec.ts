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
  // First-run onboarding sheet (replaces empty-state confirm dialog)
  await page.getByRole("button", { name: /Load demo portfolio/i }).click();
  await expect(page.getByText(/Net worth/i).first()).toBeVisible({
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
    // Dismiss first-run sheet so header controls are tappable
    await page.getByRole("button", { name: /Start empty/i }).click();
    await page.getByRole("button", { name: /more options/i }).click();
    await page.getByRole("link", { name: "Settings", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
    await expect(page.getByRole("button", { name: /Import CSV/i })).toBeVisible();
  });

  test("ledger summary period chips switch Day / Month / YTD", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Ledger" }).click();
    await expect(page.getByRole("heading", { name: "Ledger" })).toBeVisible();

    const periodTabs = page.getByRole("tablist", { name: "Summary period" });
    await expect(periodTabs).toBeVisible();
    await expect(periodTabs.getByRole("tab", { name: "Month" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText(/From 1 /i).first()).toBeVisible();

    await periodTabs.getByRole("tab", { name: "Day" }).click();
    await expect(periodTabs.getByRole("tab", { name: "Day" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText("Today").first()).toBeVisible();

    await periodTabs.getByRole("tab", { name: "YTD" }).click();
    await expect(periodTabs.getByRole("tab", { name: "YTD" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await expect(page.getByText(/YTD · since /i).first()).toBeVisible();
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
    await expect(page.getByText(/−HK\$50|-HK\$50/)).toBeVisible();
  });

  test("insights chart chips switch charts", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Insights" }).click();
    await expect(page.getByRole("heading", { name: "Insights" })).toBeVisible();

    await page.getByRole("tab", { name: "Growth" }).click();
    await expect(
      page.getByRole("heading", { name: /Growth/i }),
    ).toBeVisible();
    // Growth chart should render SVG labels for sparse demo data
    await expect(page.locator(".recharts-bar-rectangles")).toBeVisible();

    await page.getByRole("tab", { name: "Allocation" }).click();
    await expect(page.getByRole("heading", { name: "Allocation" })).toBeVisible();

    await page.getByRole("tab", { name: "Calendar" }).click();
    await expect(page.getByRole("heading", { name: "Monthly calendar" })).toBeVisible();

    await page.getByRole("tab", { name: "Cashflow" }).click();
    await expect(page.getByRole("heading", { name: "Income vs Expense" })).toBeVisible();

    await page.getByRole("tab", { name: "Categories" }).click();
    await expect(page.getByRole("heading", { name: "Ledger categories" })).toBeVisible();
    await expect(page.getByRole("tablist", { name: "Category period" })).toBeVisible();
    await expect(page.getByText("Expense", { exact: false }).first()).toBeVisible();
  });

  test("add account cancel closes the sheet", async ({ page }) => {
    await page.goto("/accounts/?new=1");
    await waitForAppReady(page);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(
      page.getByRole("dialog").getByRole("button", { name: "Add Account" }),
    ).toBeInViewport();
    await page.getByRole("button", { name: "Cancel" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("add account sheet keeps actions tappable and fields at 16px", async ({
    page,
  }) => {
    await page.goto("/accounts/?new=1");
    await waitForAppReady(page);
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const addBtn = dialog.getByRole("button", { name: "Add Account" });
    await expect(addBtn).toBeInViewport();
    await expect(addBtn).toBeEnabled();

    const nameInput = dialog.locator("#account-name");
    const fontSize = await nameInput.evaluate(
      (el) => window.getComputedStyle(el).fontSize,
    );
    expect(Number.parseFloat(fontSize)).toBeGreaterThanOrEqual(16);

    await nameInput.fill("Tap Test Bank");
    await dialog.locator("#account-value").fill("100");
    // After focusing inputs, Save must still be hittable (no zoom clip)
    await expect(addBtn).toBeInViewport();
    await addBtn.click();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByText("Tap Test Bank")).toBeVisible();
  });

  test("imports ledger CSV from settings", async ({ page }) => {
    await page.goto("/settings/");
    await waitForAppReady(page);
    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    const csvPath = path.join(fixturesDir, "ledger-sample.csv");
    await page.locator('input[type="file"][accept*="csv"]').setInputFiles(csvPath);

    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("heading", { name: /Import CSV/i })).toBeVisible();
    await confirm.getByRole("button", { name: "Import" }).click();

    await expect(page.getByText(/Added .+ ledger/i)).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("link", { name: "Ledger" }).click();
    await expect(page.getByText("CSV Salary")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("add value supports +/- sign toggle", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Accounts" }).click();
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();

    // Open first account detail (not the Accounts nav link)
    await page.locator('a[href*="/accounts/detail"]').first().click();
    await expect(page.getByRole("button", { name: /Update value/i })).toBeVisible();
    await page.getByRole("button", { name: /Update value/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading", { name: /Add Value|Edit Value/ })).toBeVisible();

    const signBtn = dialog.getByRole("button", { name: /Positive value|Negative value/ });
    await expect(signBtn).toHaveAttribute("aria-label", "Positive value");
    await signBtn.click();
    await expect(signBtn).toHaveAttribute("aria-label", "Negative value");

    await dialog.locator("#entry-value").fill("123");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toHaveCount(0);

    // formatMoney renders negatives as -HK$123
    await expect(page.getByText("-HK$123").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
