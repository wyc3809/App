# iOS cloud build (no personal Mac)

WorthBook’s Capacitor `ios/` project can be built on a **hosted Mac**. You still need a paid [Apple Developer](https://developer.apple.com) account for TestFlight / App Store.

Two options are wired in this repo:

| Option | File | Best for |
|--------|------|----------|
| **Codemagic** (recommended) | `codemagic.yaml` | Easiest certificates + auto TestFlight |
| **GitHub Actions** | `.github/workflows/ios-build.yml` | Stay inside GitHub; free macOS minutes on public repos |

---

## Path A — Codemagic → TestFlight (recommended)

### 1. Apple Developer / App Store Connect (once)

1. Enroll in the Apple Developer Program.
2. [App Store Connect](https://appstoreconnect.apple.com) → **My Apps** → create **WorthBook** with Bundle ID `app.worthbook.tracker`.
3. **Users and Access** → **Integrations** → **App Store Connect API** → generate a key (Developer or Admin). Download the `.p8` once.
4. In **Certificates, Identifiers & Profiles**:
   - App ID for `app.worthbook.tracker` (with Face ID if prompted)
   - Distribution certificate + **App Store** provisioning profile  

   (Codemagic can create these for you in the UI — often easier.)

### 2. Connect Codemagic

1. Sign up at [codemagic.io](https://codemagic.io) with GitHub.
2. Add this repository.
3. Codemagic detects `codemagic.yaml`.
4. In team settings:
   - Add **code signing** for `app.worthbook.tracker` (App Store distribution)
   - Add **App Store Connect** API key named exactly `WorthBook` (must match `integrations.app_store_connect` in `codemagic.yaml`)
5. Optional: change the email under `publishing.email.recipients`.
6. **Start new build** → workflow **WorthBook iOS (TestFlight)**.

On success, the IPA is uploaded to **TestFlight**. Install the TestFlight app on your iPhone and accept the invite.

### 3. Day-to-day

Push to `main` (or press **Start build**). No Mac required.

---

## Path B — GitHub Actions

### 1. Compile-only (no secrets)

Actions → **iOS Cloud Build** → **Run workflow**.

Without signing secrets this only proves the iOS project **compiles** on `macos-15` / Xcode 16. You cannot install that artifact on a phone.

### 2. Signed IPA + optional TestFlight

Create a **Distribution** `.p12` and **App Store** `.mobileprovision`, then add repository secrets:

| Secret | Contents |
|--------|----------|
| `BUILD_CERTIFICATE_BASE64` | `base64 -i distribution.p12 \| pbcopy` (from any machine) |
| `P12_PASSWORD` | Password for the `.p12` |
| `BUILD_PROVISION_PROFILE_BASE64` | Base64 of the `.mobileprovision` |
| `KEYCHAIN_PASSWORD` | Any random password for the CI keychain |
| `APPLE_TEAM_ID` | 10-character Team ID |
| `APP_STORE_CONNECT_API_KEY_ID` | Key ID from ASC API |
| `APP_STORE_CONNECT_ISSUER_ID` | Issuer ID from ASC API |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64 of the `.p8` file |

Encode examples (Linux / Mac / Git Bash):

```bash
base64 -i AuthKey_XXXXXX.p8 | tr -d '\n' > key.b64
base64 -i dist.p12 | tr -d '\n' > cert.b64
base64 -i WorthBook_AppStore.mobileprovision | tr -d '\n' > pp.b64
```

Then:

1. Actions → **iOS Cloud Build** → **Run workflow**
2. Enable **upload_testflight** if ASC API secrets are set
3. Download the `worthbook-ios-ipa` artifact, or wait for TestFlight processing

---

## Important notes

- Always use `npm run build:native` / `cap sync` — **not** `build:pages` (Pages `basePath` breaks the native shell).
- The iOS project uses **Swift Package Manager** (`CapApp-SPM`), not CocoaPods — CI builds `-project App.xcodeproj`.
- Bundle ID must stay `app.worthbook.tracker` (or change it everywhere: Xcode, `capacitor.config.ts`, profiles, Codemagic).
- Face ID usage string is already in `ios/App/App/Info.plist`.
- Cloud builds spend CI minutes; Codemagic and GitHub both have free tiers with limits.
- You still complete **App Store Connect** listing (screenshots, privacy URL, age rating) in the browser — no Mac needed for that part.

## Local Mac reminder

If you later get a Mac:

```bash
npm install
npm run cap:ios
```

See also `docs/APP_STORE.md`.
