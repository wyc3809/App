/**
 * Best-effort IndexedDB mirror of the Zustand persist blob.
 * Helps recover when localStorage is cleared or quota-blocked.
 */

const DB_NAME = "worthbook-mirror-v1";
const STORE = "kv";
export const MIRROR_KEY = "worthtracker-v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("idb open failed"));
  });
}

export async function writePersistMirror(json: string): Promise<boolean> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put(json, MIRROR_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("idb write failed"));
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function readPersistMirror(): Promise<string | null> {
  try {
    const db = await openDb();
    const value = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(MIRROR_KEY);
      req.onsuccess = () => {
        const v = req.result;
        resolve(typeof v === "string" ? v : null);
      };
      req.onerror = () => reject(req.error ?? new Error("idb read failed"));
    });
    db.close();
    return value;
  } catch {
    return null;
  }
}

/** True when the browser reports storage pressure (>80% used when available). */
export async function isStorageNearFull(): Promise<boolean> {
  try {
    if (!navigator.storage?.estimate) return false;
    const { usage, quota } = await navigator.storage.estimate();
    if (!usage || !quota || quota <= 0) return false;
    return usage / quota >= 0.8;
  } catch {
    return false;
  }
}

/**
 * If localStorage is empty but IndexedDB has a mirror, restore it.
 * Returns true when a restore was applied.
 */
export async function restoreMirrorToLocalStorage(
  storageKey: string = MIRROR_KEY,
): Promise<boolean> {
  try {
    if (typeof localStorage === "undefined") return false;
    const existing = localStorage.getItem(storageKey);
    if (existing) return false;
    const mirror = await readPersistMirror();
    if (!mirror) return false;
    localStorage.setItem(storageKey, mirror);
    return true;
  } catch {
    return false;
  }
}
