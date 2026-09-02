import { chromium } from "@playwright/test";
import { mkdirSync } from "node:fs";
import path from "node:path";

const OUT = "/opt/cursor/artifacts/screenshots";
mkdirSync(OUT, { recursive: true });

async function waitForAppReady(page) {
  await page.getByRole("navigation", { name: "Primary" }).waitFor({ timeout: 20000 });
}

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
});

await page.addInitScript(() => {
  try {
    localStorage.clear();
  } catch {
    /* ignore */
  }
});

await page.goto("http://localhost:3000/");
await waitForAppReady(page);
await page.getByRole("button", { name: /Load demo portfolio|載入示範組合|加载演示组合/i }).click();
await page.waitForTimeout(1500);

// Auto weekly Wrapped after demo load
await page.getByText("Your week in WorthBook").waitFor({ timeout: 15000 });
await page.screenshot({ path: path.join(OUT, "wrapped-weekly-intro.png") });

const nextBtn = () => page.locator("footer .btn-primary");
for (let i = 0; i < 3; i++) {
  await nextBtn().click();
  await page.waitForTimeout(550);
}
await page.screenshot({ path: path.join(OUT, "wrapped-weekly-rank.png") });

for (let i = 0; i < 8; i++) {
  const footer = page.locator("footer .btn-primary");
  const label = await footer.textContent();
  await footer.click();
  await page.waitForTimeout(400);
  if (label?.match(/Done|完成/i)) break;
}

// Monthly queued after weekly
const monthly = page.getByText("Your month in WorthBook");
if (await monthly.isVisible().catch(() => false)) {
  await page.screenshot({ path: path.join(OUT, "wrapped-monthly-intro.png") });
  await nextBtn().click();
  await page.waitForTimeout(500);
  await nextBtn().click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, "wrapped-monthly-change.png") });
  await page.getByRole("button", { name: /^Close$|^關閉$|^关闭$/i }).click();
}

await page.goto("http://localhost:3000/settings/");
await waitForAppReady(page);
await page.getByRole("button", { name: /^Close$|^關閉$|^关闭$/i }).click().catch(() => {});
await page.getByRole("heading", { name: /Wrapped recaps|結算回顧|结算回顾/i }).scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await page.screenshot({ path: path.join(OUT, "wrapped-settings-section.png") });

console.log("Saved screenshots to", OUT);
await browser.close();
