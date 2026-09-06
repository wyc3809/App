import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";
/** Custom domain worthbook.online serves gh-pages at site root → app lives at /worthtracker. */
const pagesBasePath = process.env.PAGES_BASE_PATH || "/worthtracker";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  // Capacitor plugins ship modern ESM that Next should transpile for static export.
  transpilePackages: [
    "@capacitor/core",
    "@capacitor/app",
    "@capacitor/filesystem",
    "@capacitor/share",
    "@capacitor/haptics",
    "@capacitor/local-notifications",
    "@capacitor/status-bar",
    "@capgo/capacitor-native-biometric",
  ],
  ...(isGithubPages
    ? {
        basePath: pagesBasePath,
        assetPrefix: pagesBasePath,
      }
    : {}),
};

export default nextConfig;
