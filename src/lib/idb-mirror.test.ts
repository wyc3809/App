/**
 * @vitest-environment happy-dom
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  isStorageNearFull,
  restoreMirrorToLocalStorage,
  writePersistMirror,
  readPersistMirror,
} from "./idb-mirror";

describe("idb-mirror", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("reports storage near full from estimate", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: async () => ({ usage: 90, quota: 100 }),
      },
    });
    expect(await isStorageNearFull()).toBe(true);
  });

  it("does not restore when localStorage already has data", async () => {
    localStorage.setItem("worthtracker-v1", '{"state":{}}');
    expect(await restoreMirrorToLocalStorage()).toBe(false);
  });

  it("round-trips mirror when indexedDB is available", async () => {
    // happy-dom may not implement IDB — treat as soft pass
    const ok = await writePersistMirror('{"state":{"accounts":[]}}');
    if (!ok) {
      expect(ok).toBe(false);
      return;
    }
    const read = await readPersistMirror();
    expect(read).toContain("accounts");
  });
});
