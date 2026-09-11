#!/usr/bin/env node
/**
 * Generate App Store Connect screenshots + marketing frames for WorthBook (light mode).
 *
 *   npm run build
 *   node scripts/generate-app-store-screenshots.mjs
 *
 * Outputs under app-store/screenshots/:
 *   raw/                 — device UI captures (1242×2688)
 *   6.7/{en,zh-Hant}/    — 1242×2688 marketing frames (iPhone 6.5" slot)
 *   6.1/{en,zh-Hant}/    — 1179×2556 marketing frames (iPhone 6.1" slot)
 */
import { createServer } from "node:http";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const STATIC = join(ROOT, "out");
const OUT = join(ROOT, "app-store", "screenshots");

const SIZE = {
  // Primary upload size requested: 1242×2688 (classic 6.5" Display).
  // Also ship 1179×2556 for the 6.1" slot.
  "6.7": { w: 1242, h: 2688 },
  "6.1": { w: 1179, h: 2556 },
};

const SLIDES = [
  {
    id: "01-home",
    path: "/",
    en: {
      eyebrow: "NET WORTH",
      title: "See your full picture",
      subtitle: "Assets, debts, and growth — private on your iPhone.",
    },
    zh: {
      eyebrow: "淨值一覽",
      title: "一眼睇晒身家",
      subtitle: "資產、負債與趨勢——資料只留在你部手機。",
    },
  },
  {
    id: "02-ledger",
    path: "/history/",
    en: {
      eyebrow: "LEDGER",
      title: "Log spending in seconds",
      subtitle: "Quick entry that links back to your accounts.",
    },
    zh: {
      eyebrow: "日常記帳",
      title: "幾秒記低一筆",
      subtitle: "快捷記帳，可連結帳戶，同步反映淨值。",
    },
  },
  {
    id: "03-insights",
    path: "/graphs/",
    en: {
      eyebrow: "INSIGHTS",
      title: "Charts that stay offline",
      subtitle: "Trends & allocation — no cloud, no ads, no account.",
    },
    zh: {
      eyebrow: "洞察圖表",
      title: "離線圖表一樣清楚",
      subtitle: "趨勢與配置——無雲端、無廣告、唔使註冊。",
    },
  },
];

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".txt": "text/plain",
  ".webmanifest": "application/manifest+json",
};

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function serveStatic(dir, port) {
  const server = createServer((req, res) => {
    try {
      let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
      if (urlPath.endsWith("/")) urlPath += "index.html";
      const filePath = join(dir, urlPath);
      if (!filePath.startsWith(dir) || !existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type": MIME[extname(filePath)] || "application/octet-stream",
        "Cache-Control": "no-store",
      });
      res.end(readFileSync(filePath));
    } catch (err) {
      res.writeHead(500);
      res.end(String(err));
    }
  });
  return new Promise((resolve) => {
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function wrapLines(text, locale, maxChars) {
  const s = String(text).trim();
  if (!s) return [];
  if (locale === "zh") {
    if (s.length <= maxChars) return [s];
    const lines = [];
    let cur = "";
    for (const ch of s) {
      cur += ch;
      if (cur.length >= maxChars) {
        lines.push(cur);
        cur = "";
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 3);
  }
  if (s.length <= maxChars) return [s];
  const words = s.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

/** Pure white marketing backdrop — title + subtitle only (no green eyebrow / footer). */
function frameBackgroundSvg(w, h, copy, locale) {
  const titleLines = wrapLines(copy.title, locale, locale === "zh" ? 9 : 16);
  const subLines = wrapLines(copy.subtitle, locale, locale === "zh" ? 15 : 32);
  const font =
    locale === "zh"
      ? "'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif"
      : "ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif";

  // More top space without eyebrow/footer labels.
  const titleY = Math.round(h * 0.055);
  const titleSize = Math.round(h * 0.036);
  const titleLineH = Math.round(h * 0.042);
  const subSize = Math.round(h * 0.0165);
  const subLineH = Math.round(h * 0.022);
  const subY = titleY + titleLines.length * titleLineH + Math.round(h * 0.012);
  const textFloor = Math.round(h * 0.2);
  const clampedSubY = Math.min(
    subY,
    textFloor - subLineH * Math.max(subLines.length, 1),
  );

  const titleTspans = titleLines
    .map(
      (line, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : titleLineH}">${esc(line)}</tspan>`,
    )
    .join("");
  const subTspans = subLines
    .map(
      (line, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : subLineH}">${esc(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="70%" stop-color="#f8fbf9"/>
      <stop offset="100%" stop-color="#f3faf6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <text x="50%" y="${titleY}" text-anchor="middle"
        font-family="${font}" font-size="${titleSize}" font-weight="800"
        fill="#111827">${titleTspans}</text>
  <text x="50%" y="${clampedSubY}" text-anchor="middle"
        font-family="${font}" font-size="${subSize}" font-weight="500"
        fill="#4b5563">${subTspans}</text>
</svg>`;
}

async function forceLightInPage(page) {
  await page.evaluate(() => {
    const w = window;
    if (typeof w.__worthSetTheme === "function") {
      w.__worthSetTheme("light");
    } else {
      try {
        const raw = localStorage.getItem("worthtracker-v1");
        if (raw) {
          const parsed = JSON.parse(raw);
          const state = parsed.state ?? parsed;
          if (state?.settings) {
            state.settings.theme = "light";
            localStorage.setItem("worthtracker-v1", JSON.stringify(parsed));
          }
        }
      } catch {
        /* ignore */
      }
    }
    document.documentElement.classList.remove("dark");
  });
  await page.waitForFunction(
    () => !document.documentElement.classList.contains("dark"),
    null,
    { timeout: 10_000 },
  );
  await page.waitForTimeout(250);
}

async function bootApp(page) {
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("__wb_shot_seeded")) {
        localStorage.clear();
        sessionStorage.setItem("__wb_shot_seeded", "1");
      }
    } catch {
      /* ignore */
    }
    document.documentElement.classList.remove("dark");
  });

  await page.goto("/", { waitUntil: "networkidle", timeout: 60_000 });

  await page.waitForFunction(
    () => typeof window.__worthLoadDemo === "function",
    null,
    { timeout: 30_000 },
  );

  await page.waitForFunction(
    () => {
      try {
        return localStorage.getItem("worthtracker-v1") != null;
      } catch {
        return false;
      }
    },
    null,
    { timeout: 30_000 },
  );
  await page.waitForTimeout(300);

  await page.evaluate(() => {
    window.__worthLoadDemo?.();
  });

  await page.waitForFunction(
    () => {
      try {
        const raw = localStorage.getItem("worthtracker-v1");
        if (!raw) return false;
        const parsed = JSON.parse(raw);
        const state = parsed.state ?? parsed;
        return (
          Array.isArray(state.accounts) &&
          state.accounts.length > 0 &&
          state.settings?.onboardingCompleted === true
        );
      } catch {
        return false;
      }
    },
    null,
    { timeout: 30_000 },
  );

  // Persist light theme, then reload so ThemeProvider picks it up from store.
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
    try {
      const raw = localStorage.getItem("worthtracker-v1");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const state = parsed.state ?? parsed;
      if (state?.settings) {
        state.settings.theme = "light";
        localStorage.setItem("worthtracker-v1", JSON.stringify(parsed));
      }
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector('[aria-label="Primary"]', { timeout: 20_000 });
  await page.evaluate(() => {
    document.documentElement.classList.remove("dark");
  });

  for (let i = 0; i < 10; i++) {
    const skip = page.getByRole("button", { name: /skip|略過|跳過/i });
    const close = page.getByRole("button", {
      name: /^Close$|^關閉$|^完成$/i,
    });
    if (await skip.isVisible().catch(() => false)) {
      await skip.click({ force: true });
      await page.waitForTimeout(200);
      continue;
    }
    if (await close.isVisible().catch(() => false)) {
      await close.click({ force: true });
      await page.waitForTimeout(200);
      continue;
    }
    break;
  }

  await page.waitForSelector('[aria-label="Primary"]', { timeout: 20_000 });
  await forceLightInPage(page);
  await page.waitForTimeout(400);
}

async function composeFrame({ sizeKey, locale, copy, rawPng, destPath }) {
  const { w, h } = SIZE[sizeKey];
  // Headline band up top. Match phone aspect to the capture and use
  // fit:"contain" so the bottom tab bar is never cropped.
  const frameTop = Math.round(h * 0.195);
  const frameBottom = Math.round(h * 0.035);
  const phoneH = h - frameTop - frameBottom;
  const meta = await sharp(rawPng).metadata();
  const rawW = meta.width || w;
  const rawH = meta.height || h;
  const rawAspect = rawW / rawH;
  let phoneW = Math.round(phoneH * rawAspect);
  let frameSide = Math.round((w - phoneW) / 2);
  // Keep a minimum side margin if the derived phone is too wide.
  const minSide = Math.round(w * 0.06);
  if (frameSide < minSide) {
    frameSide = minSide;
    phoneW = w - frameSide * 2;
  }
  const radius = Math.round(phoneW * 0.12);
  const bezel = Math.round(phoneW * 0.018);
  const innerW = phoneW - bezel * 2;
  const innerH = phoneH - bezel * 2;
  const innerR = Math.max(8, radius - bezel);

  const bgSvg = frameBackgroundSvg(w, h, copy, locale);

  // Prefer fitting the full screen (incl. tab bar). Contain avoids cropping
  // when 6.1" target aspect differs slightly from the 1242×2688 raw capture.
  const resizedScreen = await sharp(rawPng)
    .resize(innerW, innerH, {
      fit: "contain",
      position: "centre",
      background: { r: 245, g: 247, b: 246, alpha: 1 },
    })
    .png()
    .toBuffer();

  const mask = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${innerW}" height="${innerH}">
      <rect width="${innerW}" height="${innerH}" rx="${innerR}" ry="${innerR}" fill="#fff"/>
    </svg>`,
  );
  const roundedScreen = await sharp(resizedScreen)
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const phoneShell = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${phoneW}" height="${phoneH}">
      <defs>
        <linearGradient id="bezel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e8ece9"/>
          <stop offset="100%" stop-color="#c5cdc8"/>
        </linearGradient>
      </defs>
      <rect width="${phoneW}" height="${phoneH}" rx="${radius}" ry="${radius}" fill="url(#bezel)"/>
    </svg>`,
  );

  const shadow = await sharp({
    create: {
      width: phoneW + 40,
      height: phoneH + 40,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${phoneW + 40}" height="${phoneH + 40}">
            <rect x="20" y="24" width="${phoneW}" height="${phoneH}" rx="${radius}" ry="${radius}"
                  fill="rgba(15,23,19,0.18)"/>
          </svg>`,
        ),
      },
    ])
    .blur(16)
    .png()
    .toBuffer();

  await sharp(Buffer.from(bgSvg))
    .png()
    .composite([
      { input: shadow, left: frameSide - 20, top: frameTop - 16 },
      { input: phoneShell, left: frameSide, top: frameTop },
      {
        input: roundedScreen,
        left: frameSide + bezel,
        top: frameTop + bezel,
      },
    ])
    .png()
    .toFile(destPath);

  console.log("  wrote", destPath.replace(ROOT + "/", ""));
}

async function main() {
  if (!existsSync(join(STATIC, "index.html"))) {
    console.error("Missing out/ — run: npm run build");
    process.exit(1);
  }

  ensureDir(join(OUT, "raw"));
  for (const size of Object.keys(SIZE)) {
    ensureDir(join(OUT, size, "en"));
    ensureDir(join(OUT, size, "zh-Hant"));
  }

  let baseUrl = process.env.BASE_URL;
  let server;
  if (!baseUrl) {
    const port = 4177;
    server = await serveStatic(STATIC, port);
    baseUrl = `http://127.0.0.1:${port}`;
    console.log("Serving", STATIC, "at", baseUrl);
  }

  const browser = await chromium.launch({ headless: true });
  // 414×896 @3x → 1242×2688 (iPhone 6.5" App Store size)
  const context = await browser.newContext({
    viewport: { width: 414, height: 896 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "light",
    locale: "en-US",
    baseURL: baseUrl,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  console.log("Preparing light-mode demo session…");
  await bootApp(page);

  const rawBuffers = {};
  for (const slide of SLIDES) {
    console.log("Capturing", slide.id, slide.path);
    await page.goto(slide.path, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.classList.remove("dark");
      try {
        const raw = localStorage.getItem("worthtracker-v1");
        const parsed = raw ? JSON.parse(raw) : null;
        const state = parsed?.state ?? parsed;
        if (!state?.accounts?.length) window.__worthLoadDemo?.();
        if (state?.settings) {
          state.settings.theme = "light";
          localStorage.setItem("worthtracker-v1", JSON.stringify(parsed));
        }
      } catch {
        window.__worthLoadDemo?.();
      }
    });
    await forceLightInPage(page);
    await page.waitForSelector('[aria-label="Primary"]', { timeout: 20_000 });

    // Insights: nudge scroll so the growth chart is the hero (avoids cramped metric chips).
    if (slide.id === "03-insights") {
      await page.evaluate(() => {
        const main =
          document.querySelector("main") ||
          document.querySelector("[data-scroll]") ||
          document.scrollingElement;
        if (main && "scrollTop" in main) main.scrollTop = 72;
        document.documentElement.classList.remove("dark");
      });
      await page.waitForTimeout(400);
    }

    await page.waitForTimeout(700);
    const isDark = await page.evaluate(() =>
      document.documentElement.classList.contains("dark"),
    );
    if (isDark) {
      await forceLightInPage(page);
      await page.waitForTimeout(300);
    }
    const buf = await page.screenshot({ type: "png", fullPage: false });
    rawBuffers[slide.id] = buf;
    const rawPath = join(OUT, "raw", `${slide.id}.png`);
    writeFileSync(rawPath, buf);
    console.log("  raw →", rawPath.replace(ROOT + "/", ""));
  }

  await browser.close();
  if (server) server.close();

  console.log("Compositing light marketing frames…");
  for (const slide of SLIDES) {
    for (const sizeKey of Object.keys(SIZE)) {
      await composeFrame({
        sizeKey,
        locale: "en",
        copy: slide.en,
        rawPng: rawBuffers[slide.id],
        destPath: join(OUT, sizeKey, "en", `${slide.id}.png`),
      });
      await composeFrame({
        sizeKey,
        locale: "zh",
        copy: slide.zh,
        rawPng: rawBuffers[slide.id],
        destPath: join(OUT, sizeKey, "zh-Hant", `${slide.id}.png`),
      });
    }
  }

  writeFileSync(
    join(OUT, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        theme: "light",
        sizes: SIZE,
        uploadOrder: ["01-home.png", "02-ledger.png", "03-insights.png"],
        slides: SLIDES.map((s) => ({
          id: s.id,
          path: s.path,
          headlines: { en: s.en, "zh-Hant": s.zh },
        })),
      },
      null,
      2,
    ),
  );
  console.log("Done → app-store/screenshots/6.7/en/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
