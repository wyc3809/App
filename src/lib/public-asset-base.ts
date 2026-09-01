/**
 * Prefix for static assets in `public/` (icons, manifest, sw.js).
 * Must match `PAGES_BASE_PATH` when building for GitHub Pages.
 */
export function getPublicAssetBase(): string {
  if (process.env.GITHUB_PAGES === "true") {
    return process.env.PAGES_BASE_PATH || "/App/worthtracker";
  }
  return "";
}
