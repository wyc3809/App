#!/usr/bin/env node
/**
 * Generate App Store Connect screenshots + marketing frames for WorthBook.
 *
 *   npm run build
 *   node scripts/generate-app-store-screenshots.mjs
 *
 * Outputs under app-store/screenshots/:
 *   raw/                 — device UI captures
 *   6.7/{en,zh-Hant}/    — 1290×2796 marketing frames
 *   6.1/{en,zh-Hant}/    — 1179×2556 marketing frames
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
  "6.7": { w: 1290, h: 2796 },
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

function wrapTitle(title, locale) {
  if (locale === "zh") {
    if (title.length <= 8) return [title];
    const mid = Math.ceil(title.length / 2);
    return [title.slice(0, mid), title.slice(mid)];
  }
  if (title.length <= 18) return [title];
  const words = title.split(/\s+/);
  const lines = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length > 18 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

function frameBackgroundSvg(w, h, copy, locale) {
  const lines = wrapTitle(copy.title, locale);
  const font =
    locale === "zh"
      ? "'WenQuanYi Micro Hei','Droid Sans Fallback',sans-serif"
      : "ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif";
  const titleY = Math.round(h * 0.072);
  const lineH = Math.round(h * 0.042);
  const titleSize = Math.round(h * 0.038);
  const eyebrowSize = Math.round(h * 0.016);
  const subSize = Math.round(h * 0.0175);
  const subY = titleY + lines.length * lineH + Math.round(h * 0.014);
  const tspans = lines
    .map(
      (line, i) =>
        `<tspan x="50%" dy="${i === 0 ? 0 : lineH}">${esc(line)}</tspan>`,
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#07140f"/>
      <stop offset="45%" stop-color="#0c1f17"/>
      <stop offset="100%" stop-color="#10261c"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="28%" r="55%">
      <stop offset="0%" stop-color="#22c55e" stop-opacity="0.28"/>
      <stop offset="55%" stop-color="#16a34a" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  <rect width="${w}" height="${h}" fill="url(#glow)"/>
  <circle cx="${Math.round(w * 0.12)}" cy="${Math.round(h * 0.82)}" r="${Math.round(w * 0.28)}" fill="#14532d" opacity="0.35"/>
  <circle cx="${Math.round(w * 0.9)}" cy="${Math.round(h * 0.18)}" r="${Math.round(w * 0.22)}" fill="#166534" opacity="0.25"/>
  <text x="50%" y="${Math.round(h * 0.048)}" text-anchor="middle"
        font-family="${font}" font-size="${eyebrowSize}" font-weight="700"
        letter-spacing="0.18em" fill="#4ade80">${esc(copy.eyebrow)}</text>
  <text x="50%" y="${titleY}" text-anchor="middle"
        font-family="${font}" font-size="${titleSize}" font-weight="800"
        fill="#f4f7f5">${tspans}</text>
  <text x="50%" y="${subY}" text-anchor="middle"
        font-family="${font}" font-size="${subSize}" font-weight="500"
        fill="#a3ada7">${esc(copy.subtitle)}</text>
  <text x="50%" y="${Math.round(h * 0.965)}" text-anchor="middle"
        font-family="${font}" font-size="${Math.round(h * 0.014)}" font-weight="600"
        letter-spacing="0.12em" fill="#727d76">WORTHBOOK</text>
</svg>`;
}

async function bootApp(page) {
  // Init scripts re-run on every navigation — only wipe storage once.
  await page.addInitScript(() => {
    try {
      if (!sessionStorage.getItem("__wb_shot_seeded")) {
        localStorage.clear();
        sessionStorage.setItem("__wb_shot_seeded", "1");
      }
    } catch {
      /* ignore */
    }
    document.documentElement.classList.add("dark");
  });

  await page.goto("/", { waitUntil: "networkidle", timeout: 60_000 });

  // Hook is only installed under Playwright (navigator.webdriver).
  await page.waitForFunction(
    () => typeof window.__worthLoadDemo === "function",
    null,
    { timeout: 30_000 },
  );

  // Wait until zustand persist has finished its first rehydrate write.
  // Calling loadDemo earlier can be overwritten by empty rehydration.
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
    document.documentElement.classList.add("dark");
  });

  // Confirm demo accounts persisted and onboarding is marked complete.
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

  // Intro / Wrapped overlays should be gone; dismiss if any linger.
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
  await page.waitForTimeout(500);
}

async function composeFrame({ sizeKey, locale, copy, rawPng, destPath }) {
  const { w, h } = SIZE[sizeKey];
  const frameTop = Math.round(h * 0.2);
  const frameBottom = Math.round(h * 0.06);
  const frameSide = Math.round(w * 0.1);
  const phoneW = w - frameSide * 2;
  const phoneH = h - frameTop - frameBottom;
  const radius = Math.round(phoneW * 0.12);
  const bezel = Math.round(phoneW * 0.018);
  const innerW = phoneW - bezel * 2;
  const innerH = phoneH - bezel * 2;
  const innerR = Math.max(8, radius - bezel);

  const bgSvg = frameBackgroundSvg(w, h, copy, locale);

  const resizedScreen = await sharp(rawPng)
    .resize(innerW, innerH, { fit: "cover", position: "top" })
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
          <stop offset="0%" stop-color="#2a2f2c"/>
          <stop offset="100%" stop-color="#121614"/>
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
                  fill="rgba(0,0,0,0.45)"/>
          </svg>`,
        ),
      },
    ])
    .blur(18)
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
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    colorScheme: "dark",
    locale: "en-US",
    baseURL: baseUrl,
  });
  const page = await context.newPage();
  page.setDefaultTimeout(60_000);

  console.log("Preparing demo session…");
  await bootApp(page);

  const rawBuffers = {};
  for (const slide of SLIDES) {
    console.log("Capturing", slide.id, slide.path);
    await page.goto(slide.path, { waitUntil: "networkidle" });
    await page.evaluate(() => {
      document.documentElement.classList.add("dark");
      // Re-apply demo if a navigation somehow wiped state.
      try {
        const raw = localStorage.getItem("worthtracker-v1");
        const parsed = raw ? JSON.parse(raw) : null;
        const state = parsed?.state ?? parsed;
        if (!state?.accounts?.length) window.__worthLoadDemo?.();
      } catch {
        window.__worthLoadDemo?.();
      }
    });
    await page.waitForSelector('[aria-label="Primary"]', { timeout: 20_000 });
    await page.waitForTimeout(900);
    const buf = await page.screenshot({ type: "png", fullPage: false });
    rawBuffers[slide.id] = buf;
    const rawPath = join(OUT, "raw", `${slide.id}.png`);
    writeFileSync(rawPath, buf);
    console.log("  raw →", rawPath.replace(ROOT + "/", ""));
  }

  await browser.close();
  if (server) server.close();

  console.log("Compositing marketing frames…");
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
