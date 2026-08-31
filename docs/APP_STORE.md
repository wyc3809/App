# App Store / Play Store path (Capacitor)

WorthBook is a **Next.js static export** (`out/`) wrapped in **Capacitor** for native iOS distribution. The same codebase also ships as a PWA on GitHub Pages — use different build scripts for each target.

| Target | Command | Output |
|--------|---------|--------|
| **iOS App Store** | `npm run build:ios` | `out/` → synced into `ios/App/App/public` |
| **GitHub Pages PWA** | `npm run build:pages` | `out/` with `/App/worthtracker` basePath |

## 手機 App Store 上架（繁中摘要）

1. **Apple Developer Program**（年費）+ [App Store Connect](https://appstoreconnect.apple.com) 建立 App，Bundle ID：`app.worthbook.tracker`
2. **無 Mac**：用 **Codemagic**（`codemagic.yaml`）或 **GitHub Actions**（`ios-build.yml`）雲端編譯 → TestFlight  
   詳見 [IOS-CLOUD-BUILD.md](IOS-CLOUD-BUILD.md)
3. **本地 Mac**：`npm run build:ios` → Xcode Archive → Upload
4. **App Store Connect 填寫**（瀏覽器即可，不需 Mac）：
   - 文案草稿：`app-store/metadata/`（英文 + 繁中 + 简中 description / subtitle）
   - 私隱政策 URL：`https://wyc3809.github.io/App/worthtracker/privacy/`
   - 截圖：6.7" 及 6.1" iPhone（直向）
   - App Privacy：**不收集資料**（無 analytics SDK）
   - 年齡分級：通常 4+
   - 出口合規：僅 HTTPS → Info.plist 已設 `ITSAppUsesNonExemptEncryption = false`

## No Mac? Use a cloud Mac

You do **not** need your own Mac to ship to TestFlight.

Follow **[docs/IOS-CLOUD-BUILD.md](IOS-CLOUD-BUILD.md)**:

1. **Codemagic** (`codemagic.yaml`) — easiest → auto TestFlight
2. **GitHub Actions** (`.github/workflows/ios-build.yml`) — hosted `macos-15` / Xcode 16

You still need a paid Apple Developer account for signing and App Store Connect.

## Prerequisites (Mac for iOS)

- Xcode 16+
- Apple Developer account
- Node 22+ (Capacitor CLI requirement)

## One-time setup

```bash
npm install
npm run build:ios       # build + cap sync ios
npx cap open ios        # opens Xcode (Mac required)
```

The `ios/` Xcode project is committed. Re-run `npx cap add ios` only if you deleted it.

### Xcode checklist

1. **Bundle ID** `app.worthbook.tracker` (keep `capacitor.config.ts` in sync if you change it).
2. Signing & Capabilities → your Team.
3. **Face ID** — `NSFaceIDUsageDescription` already in `Info.plist`.
4. **App icons** — `ios/App/App/Assets.xcassets/AppIcon` (1024×1024).
5. **Privacy manifest** — `ios/App/App/PrivacyInfo.xcprivacy` (UserDefaults / file timestamps for local storage).
6. Archive → Distribute to TestFlight / App Store Connect.

## Day-to-day

```bash
npm run build:ios
```

Do **not** use `npm run build:pages` for the native shell — that injects `/App/worthtracker` basePath for GitHub Pages only.

## Native features wired in JS

| Feature | Behavior |
|--------|----------|
| Launch splash | `@capacitor/splash-screen` — hidden when Zustand finishes hydrating |
| Status bar | `@capacitor/status-bar` — follows light/dark theme on native |
| Biometric lock | `@capgo/capacitor-native-biometric` — Settings toggle; `AppLock` re-locks on background |
| Backup export | Filesystem (cache) + Share sheet; web falls back to download / Web Share |
| Haptics | `@capacitor/haptics` on native; Vibration API on web |
| Orientation | iPhone portrait-only; iPad portrait (+ upside-down) |
| Service worker | **Skipped** inside Capacitor |

## App Store Connect listing

Copy from `app-store/metadata/` or write your own:

- [ ] **Privacy Policy URL** — e.g. `https://wyc3809.github.io/App/worthtracker/privacy/`
- [ ] **Support URL** / email (update Privacy page if you ship a real support address)
- [ ] **Screenshots** — 6.7" + 6.1" iPhone (portrait)
- [ ] **Age rating** — likely 4+
- [ ] **App Privacy** — Data Not Collected (no analytics / tracking SDKs)
- [ ] **Localization** — en, zh-Hant, zh-Hans metadata in `app-store/metadata/`

## Android (optional)

```bash
npx cap add android
npx cap sync android
npx cap open android
```
