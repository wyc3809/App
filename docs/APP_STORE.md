# App Store / Play Store path (Capacitor)

WorthBook ships as a **static web app** (`next export` → `out/`) and optionally as a **native shell** via Capacitor for App Store distribution.


## No Mac? Use a cloud Mac

You do **not** need your own Mac to ship to TestFlight.

Follow **[docs/IOS-CLOUD-BUILD.md](IOS-CLOUD-BUILD.md)**:

1. **Codemagic** (`codemagic.yaml`) — easiest → auto TestFlight
2. **GitHub Actions** (`.github/workflows/ios-build.yml`) — hosted `macos-14` runner

You still need a paid Apple Developer account for signing and App Store Connect.

## Prerequisites (Mac for iOS)

- Xcode 16+
- Apple Developer account
- Node 22+ (Capacitor CLI requirement)

## One-time setup

```bash
npm install
npm run build:native    # next build without GitHub Pages basePath → out/
npx cap sync ios        # copies out/ into ios/App/App/public
npx cap open ios        # opens Xcode (Mac required)
```

The `ios/` Xcode project is committed. Re-run `npx cap add ios` only if you deleted it.

### Xcode checklist

1. Set **Bundle ID** to `app.worthbook.tracker` (or your own reverse-DNS id — keep `capacitor.config.ts` in sync).
2. Signing & Capabilities → your Team.
3. Add **Privacy - Face ID Usage Description** (`NSFaceIDUsageDescription`):  
   `WorthBook uses Face ID to unlock your local portfolio.`
4. Confirm app icons (Assets) — copy from `public/icon-1024` / App Icon set if needed.
5. Archive → Distribute to TestFlight / App Store Connect.

## Day-to-day

```bash
npm run build:native && npx cap sync ios
```

Do **not** use `npm run build:pages` for the native shell — that injects `/App/worthtracker` basePath for GitHub Pages only.

## Native features wired in JS

| Feature | Behavior |
|--------|----------|
| Biometric lock | `@capgo/capacitor-native-biometric` — Settings toggle verifies identity first; `AppLock` gates UI + re-locks on background |
| Backup export | Filesystem (cache) + Share sheet; web falls back to download / Web Share |
| Haptics | `@capacitor/haptics` on native; Vibration API on web |
| Service worker | **Skipped** inside Capacitor |

## App Store Connect extras (manual)

- [ ] Privacy Policy URL — e.g. `https://wyc3809.github.io/App/worthtracker/privacy/`
- [ ] Support URL / email (`support@worthbook.app` placeholder in Privacy page)
- [ ] Screenshots (6.7" + 6.1" iPhone)
- [ ] Age rating (likely 4+)
- [ ] App Privacy labels — **Data Not Collected** only if you add no analytics SDKs
- [ ] Remove placeholder support email before shipping if unused

## Android (optional)

```bash
npx cap add android
npx cap sync android
npx cap open android
```
