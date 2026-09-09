import { expect, test } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";

const artifactsDir = "/opt/cursor/artifacts";

async function clearAppData(
  page: import("@playwright/test").Page,
) {
  await page.addInitScript(() => {
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
  });
}

async function waitForAppReady(page: import("@playwright/test").Page) {
  await page.waitForFunction(
    () => Boolean(document.querySelector('[aria-label="Primary"]')),
    { timeout: 20_000 },
  );
}

async function dismissIntro(page: import("@playwright/test").Page) {
  const skip = page.getByRole("button", { name: /^Skip$/i });
  await skip.waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ force: true });
  }
}

test("daily streak: Settings card + celebration, Home stays clean", async ({
  page,
}) => {
  fs.mkdirSync(artifactsDir, { recursive: true });
  await clearAppData(page);
  await page.goto("/");
  await waitForAppReady(page);
  await dismissIntro(page);

  // Home must not show streak chrome
  await expect(page.getByText(/Daily streak|每日連續|每日连续/i)).toHaveCount(0);
  await page.screenshot({
    path: path.join(artifactsDir, "streak-home-clean.png"),
    fullPage: true,
  });

  await page.goto("/settings/");
  await waitForAppReady(page);
  await dismissIntro(page);

  const streakCard = page.getByRole("heading", { name: /Daily streak|每日連續|每日连续/i });
  await expect(streakCard).toBeVisible();
  await page.locator("text=/Check in today|今日簽到|今日签到/i").scrollIntoViewIfNeeded();
  await page.screenshot({
    path: path.join(artifactsDir, "streak-settings-card.png"),
    fullPage: true,
  });

  await page.getByRole("button", { name: /Check in today|今日簽到|今日签到/i }).click();

  const celebration = page.getByText(/Streak extended|連續紀錄已延長|连续记录已延长/i);
  await expect(celebration).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole("button", { name: /^Share$/i })).toHaveCount(0);
  await page.screenshot({
    path: path.join(artifactsDir, "streak-celebration.png"),
  });

  await page.getByRole("button", { name: /Nice|好/i }).click();
  await expect(celebration).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /Done today|今日已完成/i }),
  ).toBeVisible();
});
