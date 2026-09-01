/** Resolve public asset prefix from document head (works on GitHub Pages + native). */
export function readPublicAssetBase(): string {
  if (typeof document === "undefined") return "";

  const icon = document.querySelector(
    'link[rel="icon"][type="image/svg+xml"]',
  ) as HTMLLinkElement | null;
  if (icon?.href) {
    try {
      return new URL(icon.href, window.location.href).pathname.replace(
        /\/icon\.svg$/,
        "",
      );
    } catch {
      /* ignore */
    }
  }

  const manifest = document.querySelector(
    'link[rel="manifest"]',
  ) as HTMLLinkElement | null;
  if (manifest?.href) {
    try {
      return new URL(manifest.href, window.location.href).pathname.replace(
        /\/manifest\.webmanifest$/,
        "",
      );
    } catch {
      /* ignore */
    }
  }

  return "";
}
