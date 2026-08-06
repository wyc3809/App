import { isNativePlatform } from "./platform";

/**
 * Export a text file: Share sheet on native, download / Web Share on web.
 */
export async function exportTextFile(input: {
  filename: string;
  content: string;
  mime?: string;
}): Promise<{ ok: true; method: "share" | "download" } | { ok: false; error: string }> {
  const mime = input.mime ?? "application/json";
  const blob = new Blob([input.content], { type: mime });

  if (isNativePlatform()) {
    try {
      const { Filesystem, Directory, Encoding } = await import(
        "@capacitor/filesystem"
      );
      const { Share } = await import("@capacitor/share");

      const written = await Filesystem.writeFile({
        path: input.filename,
        data: input.content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      await Share.share({
        title: input.filename,
        url: written.uri,
        dialogTitle: "Save WorthBook backup",
      });
      return { ok: true, method: "share" };
    } catch (e) {
      return {
        ok: false,
        error: e instanceof Error ? e.message : "Native share failed",
      };
    }
  }

  // Web: prefer Web Share with file when available (iOS Safari / Android Chrome)
  try {
    const file = new File([blob], input.filename, { type: mime });
    const nav = navigator as Navigator & {
      canShare?: (data: ShareData) => boolean;
      share?: (data: ShareData) => Promise<void>;
    };
    if (nav.share && nav.canShare?.({ files: [file] })) {
      await nav.share({ files: [file], title: input.filename });
      return { ok: true, method: "share" };
    }
  } catch {
    /* fall through to download */
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = input.filename;
    a.click();
    URL.revokeObjectURL(url);
    return { ok: true, method: "download" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Download failed",
    };
  }
}
