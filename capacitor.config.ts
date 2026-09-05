import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell for App Store / Play Store.
 * Web assets come from `npm run build` → `out/` (no GitHub Pages basePath).
 */
const config: CapacitorConfig = {
  appId: "app.worthbook.tracker",
  appName: "WorthBook",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: false,
    },
  },
  ios: {
    // Avoid WebView content insets fighting our CSS safe-area + shell scroll.
    contentInset: "never",
    preferredContentMode: "mobile",
    // Match light --bg so any residual bounce does not flash native black.
    backgroundColor: "#f5f7f6",
  },
};

export default config;
