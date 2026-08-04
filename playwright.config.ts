import { defineConfig, devices } from "@playwright/test";

/**
 * E2E tests for WorthBook (static `output: "export"`).
 * Builds the app and serves `out/` — avoids flaky Next.js dev HMR hydration.
 * Set PLAYWRIGHT_BASE_URL to target an already-running server instead.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    ...devices["Pixel 7"],
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx serve out -l 3000 --no-request-logging",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
