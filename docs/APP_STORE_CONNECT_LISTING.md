# App Store Connect — WorthBook listing pack

Copy-paste ready fields for first submission.  
Bundle ID: `app.worthbook.tracker` · SKU: `worthbook001`

---

## 1. App information

| Field | Value |
|--------|--------|
| **Name** | WorthBook |
| **Subtitle (EN, ≤30)** | Private net worth tracker |
| **Subtitle (繁中, ≤30)** | 私密淨值與記帳 |
| **Primary language** | English (U.S.) — add 繁體中文 as localization |
| **Bundle ID** | `app.worthbook.tracker` |
| **SKU** | `worthbook001` |
| **Category (Primary)** | Finance |
| **Category (Secondary)** | Lifestyle *(optional)* |

---

## 2. Short description / promotional text

**Promotional Text (EN, ≤170) — optional, editable anytime:**

```text
Track net worth, accounts, and a daily ledger — 100% on your iPhone. No account. No cloud. Face ID lock when you want it.
```

**推廣文字（繁中, ≤170）：**

```text
追蹤淨值、帳戶與日常記帳——資料只留在你的 iPhone。無需註冊、無雲端。可選 Face ID 鎖定。
```

---

## 3. Description (long)

### English

```text
WorthBook is a private net worth and wealth tracker for people who want clarity without giving their balances to the cloud.

See assets vs liabilities at a glance, update account values over time, and keep a simple income & expense ledger that can link to your accounts — so spending and payments stay in sync with your portfolio.

WHY WORTHBOOK
• Offline-first — your data stays on this device
• No sign-in, no ads, no analytics in this version
• Multi-currency accounts with editable FX rates
• Value history and trends for each account
• Ledger with categories (including Rental & Allowance income)
• Optional Face ID / Touch ID app lock
• JSON backup export & import
• Privacy mode to mask amounts on screen

BUILT FOR WEALTH, NOT EXPENSE CHAOS
WorthBook focuses on total net worth, allocation, and linked bookkeeping — not bank sync or social sharing.

Your money. Your phone. Your control.
```

### 繁體中文

```text
WorthBook 是一款私密的淨值與財富追蹤 App，讓你清楚掌握資產與負債，而不必把結餘上傳雲端。

一眼睇晒資產對負債、為帳戶更新歷史價值，並用簡單收入／支出記帳連結帳戶——消費與還款會同步反映在淨值。

為什麼用 WorthBook
• 離線優先——資料只存在這部裝置
• 本版本無需登入、無廣告、無分析追蹤
• 多幣別帳戶，匯率可自行調整
• 每個帳戶的價值歷史與趨勢
• 記帳分類（收入含租金 Rental、津貼 Allowance）
• 可選 Face ID／觸控 ID 鎖定
• JSON 備份匯出／匯入
• 私隱模式遮蓋金額

為財富總覽而設，不是流水帳工具
WorthBook 專注總淨值、配置與連結記帳——不做銀行同步或社群分享。

你的錢。你的手機。你話事。
```

---

## 4. Keywords

Apple limit: **100 characters**, comma-separated, **no spaces** after commas (spaces waste quota).  
Do **not** repeat the app name “WorthBook”.

### English keywords

```text
networth,wealth,assets,liabilities,portfolio,ledger,finance,budget,offline,privacy,tracker,money,invest
```

(Count ≈ 99 chars)

### 繁中關鍵字

```text
淨值,資產,負債,財富,投資組合,記帳,理財,離線,私隱,追蹤,多幣別,備份,FaceID
```

---

## 5. URLs & email

| Field | Value | Notes |
|--------|--------|--------|
| **Privacy Policy URL** | `https://wyc3809.github.io/App/worthtracker/privacy/` | Must open in Safari before submit |
| **Support URL** | `https://wyc3809.github.io/App/worthtracker/privacy/` | Same page has Contact until you add `/support` |
| **Marketing URL** *(optional)* | `https://wyc3809.github.io/App/worthtracker/` | Web PWA |
| **Support email** | `support@worthbook.app` | Shown on Privacy page — **confirm this inbox exists** or change both Connect + privacy page before review |

If `support@worthbook.app` is not a real mailbox yet, use an address you monitor (e.g. your Gmail) and update `src/app/privacy/page.tsx` before the next deploy.

---

## 6. Age rating

In Connect → **Age Rating** questionnaire, answer typically:

| Question theme | Answer for WorthBook v1 |
|----------------|-------------------------|
| Unrestricted web access | No |
| Gambling | No |
| Contests | No |
| Mature/suggestive | None |
| Violence | None |
| Profanity | None |
| Medical/treatment info | No |
| Alcohol/tobacco/drugs | No |
| Horror/fear | No |
| Mature themes | No |

**Expected result: 4+**

---

## 7. App Privacy (nutrition labels)

Choose: **Data Not Collected**

Because this version:
- Stores data only on-device (`localStorage` / app sandbox)
- No account / sign-in
- No analytics SDK
- No ad SDK
- No WorthBook backend
- Face ID: processed by iOS; app only gets unlock yes/no (not biometric data)

If you later add ads, Sign in with Apple, or cloud sync — **revisit App Privacy** before that version ships.

---

## 8. App icon 1024×1024

**Upload this file (no alpha — Connect-ready):**

```text
app-store/icon-1024-connect.png
```

Source with transparency (do **not** upload to Connect): `app-store/icon-1024-maneki-neko.png`

Requirements:
- Exactly **1024 × 1024** PNG
- **No alpha** (Apple rejects transparent 1024 icons) — `icon-1024-connect.png` is flattened on `#0d1110`
- No rounded corners (Apple applies mask)

Also available for reference: `public/icon-512.png`, `public/icon-192.png`.

---

## 9. Screenshots (required)

### Sizes Apple wants (portrait)

| Display | Size (px) | Devices |
|---------|-----------|---------|
| **6.7"** | **1290 × 2796** | iPhone 15 Pro Max / 16 Plus class |
| **6.1"** | **1179 × 2556** | iPhone 14 Pro / 15 / 16 class |

Upload **at least 1** per size (up to 10). Aim for **3–5** strong shots.

### Suggested shot list (same set for 6.7" + 6.1")

1. **Home** — net worth hero + trend  
2. **Accounts** — assets / liabilities groups  
3. **Account detail** — chart + value history  
4. **Ledger** — quick entry + recent transactions  
5. **Insights** *(optional)* — categories / growth  

### How to capture (Simulator — Mac)

```bash
# After opening Simulator at the right device:
# iPhone 16 Plus → 6.7" class
# iPhone 16 → 6.1" class
# Device → Screenshot  (or Cmd+S)
```

Or run the web app in Safari responsive mode and export at the pixel sizes above (less ideal than Simulator).

### Copy for screenshot captions *(optional text overlays)*

1. Your net worth. On your phone only.  
2. Assets & liabilities in one place.  
3. History that stays in sync with your ledger.  
4. Book income & expenses in seconds.  

繁中：
1. 淨值總覽，只在你手機裡。  
2. 資產與負債一目了然。  
3. 記帳與帳戶價值同步。  
4. 幾秒記一筆收入或支出。  

---

## 10. Review notes (for Apple reviewer)

Paste into **App Review Information → Notes**:

```text
WorthBook is a local-only finance app. No login is required.

To explore:
1. On first launch, tap “Load demo portfolio” (or Skip and add accounts manually).
2. Home shows net worth. Accounts lists assets/liabilities. Ledger is for income/expense.
3. Optional: Settings → enable biometric lock (works with Simulator Face ID if enrolled).

No account credentials. No server. All sample/demo data stays on device.
```

**Contact for review:** your real phone + email Apple can reach.  
**Demo account:** leave blank (no login).

---

## 11. Version & what’s new

**Version:** `1.2.0` (match `package.json`)  
**What’s New (first release):**

```text
Initial App Store release of WorthBook — private net worth tracking, multi-currency accounts, linked ledger, value history, and on-device backups.
```

繁中：

```text
WorthBook 首次上架：私密淨值追蹤、多幣別帳戶、連結記帳、價值歷史與本機備份。
```

---

## 12. Pre-submit checklist

- [ ] Privacy URL opens: https://wyc3809.github.io/App/worthtracker/privacy/
- [ ] Support email inbox works (or replaced)
- [ ] Icon `app-store/icon-1024-maneki-neko.png` uploaded (no transparency)
- [ ] Screenshots 6.7" + 6.1" uploaded
- [ ] Age rating completed → 4+
- [ ] App Privacy → Data Not Collected
- [ ] Build selected from TestFlight
- [ ] Review notes pasted
- [ ] Export a personal JSON backup before wipe-testing on review devices

---

*Generated for WorthBook Connect listing. Update Privacy/Support if you change domains or add cloud features.*
