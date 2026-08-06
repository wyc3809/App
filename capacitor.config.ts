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
    contentInset: "automatic",
    preferredContentMode: "mobile",
    backgroundColor: "#0d1110",
  },
};

export default config;
