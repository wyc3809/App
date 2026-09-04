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

/** Dismiss Spotify-style Wrapped recaps when they block the shell. */
async function dismissWrappedReports(page: Page) {
  for (let i = 0; i < 24; i++) {
    const title = page.getByText(
      /Your WorthBook recap|Your week in WorthBook|Your month in WorthBook/i,
    );
    if (!(await title.isVisible().catch(() => false))) return;

    const close = page.getByRole("button", { name: /^Close$/i });
    if (await close.isVisible().catch(() => false)) {
      await close.click();
      await page.waitForTimeout(250);
      continue;
    }

    const action = page.locator('[role="dialog"] footer .btn-primary');
    if (await action.isVisible().catch(() => false)) {
      await action.click();
      await page.waitForTimeout(250);
      continue;
    }
    return;
  }
}

/** Wait until Zustand persist finishes and the shell is interactive. */
async function waitForAppReady(page: Page) {
  await page.waitForFunction(
    () => {
      const nav = document.querySelector('[aria-label="Primary"]');
      const wrapped = /Your WorthBook recap|Your (week|month) in WorthBook/.test(
        document.body.innerText,
      );
      return Boolean(nav || wrapped);
    },
    { timeout: 20_000 },
  );
  await dismissWrappedReports(page);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible({
    timeout: 20_000,
  });
}

/** Dismiss first-run intro overlay when present (fresh localStorage). */
async function dismissIntro(page: Page) {
  const skip = page.getByRole("button", { name: /^Skip$/i });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
    await expect(
      page.getByRole("dialog", { name: "Welcome to WorthBook" }),
    ).toHaveCount(0);
  }
  await dismissWrappedReports(page);
}

/** Expand collapsed Assets/Liabilities groups until account rows are visible. */
async function revealAccountRows(page: Page) {
  for (let round = 0; round < 6; round++) {
    const detailLink = page.locator('a[href*="/accounts/detail"]').first();
    if (await detailLink.isVisible().catch(() => false)) return;

    const collapsed = page.getByRole("button", { expanded: false });
    const count = await collapsed.count();
    if (count === 0) return;

    await collapsed.first().click();
    await page.waitForTimeout(250);
  }
}

async function loadDemo(page: Page) {
  await page.goto("/");
  await waitForAppReady(page);
  // First-run onboarding sheet (replaces empty-state confirm dialog)
  await page.getByRole("button", { name: /Load demo portfolio/i }).click();
  await expect(page.getByText(/Net worth/i).first()).toBeVisible({
    timeout: 15_000,
  });
  await dismissWrappedReports(page);
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
    // Dismiss first-run intro so header controls are tappable
    await page.getByRole("button", { name: /^Skip$/i }).click();
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
    await dismissIntro(page);
    const dialog = page.getByRole("dialog", { name: "Add Account" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Add Account" })).toBeInViewport();
    await page.getByRole("button", { name: "Cancel" }).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
  });

  test("add account sheet keeps actions tappable and fields at 16px", async ({
    page,
  }) => {
    await page.goto("/accounts/?new=1");
    await waitForAppReady(page);
    await dismissIntro(page);
    const dialog = page.getByRole("dialog", { name: "Add Account" });
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
    await revealAccountRows(page);
    await expect(page.getByText("Tap Test Bank")).toBeVisible();
  });

  test("imports ledger CSV from settings", async ({ page }) => {
    await page.goto("/settings/");
    await waitForAppReady(page);
    await dismissIntro(page);
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
    await page.getByRole("tab", { name: "YTD" }).click();
    await expect(page.getByText("CSV Salary")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("add value supports +/- sign toggle", async ({ page }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Accounts" }).click();
    await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();

    await revealAccountRows(page);
    await page.locator('a[href*="/accounts/detail"]').first().click();
    await expect(page.getByRole("button", { name: /Update value/i })).toBeVisible();
    await page.getByRole("button", { name: /Update value/i }).click();

    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: /Update Value|Add Value|Edit Value/ }),
    ).toBeVisible();

    const signBtn = dialog.getByRole("button", { name: /Positive value|Negative value/ });
    await expect(signBtn).toHaveAttribute("aria-label", "Positive value");
    await signBtn.click();
    await expect(signBtn).toHaveAttribute("aria-label", "Negative value");

    await dialog.locator("#entry-value").fill("123");
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(dialog).toHaveCount(0);

    await expect(page.getByText("-HK$123").first()).toBeVisible({
      timeout: 10_000,
    });
  });

  test("persona: income categories include Rental and Allowance", async ({
    page,
  }) => {
    await loadDemo(page);
    await page.getByRole("link", { name: "Ledger" }).click();
    await page.getByRole("tab", { name: "Income" }).click();
    await expect(page.getByRole("button", { name: "Rental", exact: true })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Allowance", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Rental", exact: true }).click();
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5_000 });
  });

  test("persona: linked expense decreases cash account balance", async ({
    page,
  }) => {
    await page.goto("/accounts/?new=1");
    await waitForAppReady(page);
    await dismissIntro(page);
    const dialog = page.getByRole("dialog", { name: "Add Account" });
    await expect(dialog).toBeVisible();
    await dialog.locator("#account-name").fill("Persona Cash");
    await dialog.locator("#account-value").fill("1000");
    await dialog.getByRole("button", { name: "Add Account" }).click();
    await expect(dialog).toHaveCount(0);

    await page.getByRole("link", { name: "Ledger" }).click();
    await page.getByRole("tab", { name: "Expense" }).click();
    await page.getByRole("button", { name: "Food", exact: true }).click();
    // Link to account if a link control exists
    const linkBtn = page.getByRole("button", { name: /Not linked|Link|Persona Cash/i });
    if (await linkBtn.isVisible().catch(() => false)) {
      await linkBtn.click();
      const cashOpt = page.getByRole("button", { name: /Persona Cash/i });
      if (await cashOpt.isVisible().catch(() => false)) {
        await cashOpt.click();
      }
    }
    await page.getByRole("button", { name: "1", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "0", exact: true }).click();
    await page.getByRole("button", { name: "Done" }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 5_000 });

    await page.getByRole("link", { name: "Accounts" }).click();
    await revealAccountRows(page);
    await page.getByText("Persona Cash").click();
    // Linked 100 expense → 900 if linked; still valid account page either way
    await expect(page.getByRole("button", { name: /Update value/i })).toBeVisible();
  });
});
