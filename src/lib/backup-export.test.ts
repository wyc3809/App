/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { exportTextFile } from "./backup-export";
import { isNativePlatform, shouldSkipServiceWorker } from "./platform";

describe("platform", () => {
  it("reports web when Capacitor is not native", () => {
    expect(isNativePlatform()).toBe(false);
    expect(shouldSkipServiceWorker()).toBe(false);
  });
});

describe("exportTextFile", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads a JSON file on web", async () => {
    const click = vi.fn();
    const createElement = vi.spyOn(document, "createElement").mockImplementation(((
      tag: string,
    ) => {
      if (tag === "a") {
        return {
          href: "",
          download: "",
          click,
        } as unknown as HTMLAnchorElement;
      }
      return document.createElement(tag);
    }) as typeof document.createElement);

    const result = await exportTextFile({
      filename: "worthbook-backup.json",
      content: '{"ok":true}',
    });

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.method).toBe("download");
    expect(click).toHaveBeenCalled();
    createElement.mockRestore();
  });
});
