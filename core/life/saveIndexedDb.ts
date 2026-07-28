import { lifeGameStateSchema, type LifeGameState } from '@interfaces/lifeEngine';

const DB_NAME = 'jianghu_life_v1';
const STORE = 'saves';
const KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
}

export interface LifePersistedSave {
  version: 1;
  savedAt: number;
  state: LifeGameState;
}

export async function saveLifeToIndexedDb(state: LifeGameState): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const parsed = lifeGameStateSchema.parse(state);
  const payload: LifePersistedSave = {
    version: 1,
    savedAt: Date.now(),
    state: parsed,
  };
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(payload, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadLifeFromIndexedDb(): Promise<LifePersistedSave | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => {
      const raw = req.result as LifePersistedSave | undefined;
      if (!raw?.state) {
        resolve(null);
        return;
      }
      try {
        lifeGameStateSchema.parse(raw.state);
        resolve(raw);
      } catch {
        resolve(null);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function clearLifeIndexedDb(): Promise<void> {
  if (typeof indexedDB === 'undefined') return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** localStorage fallback for environments without IndexedDB */
const LS_KEY = 'jianghu_life_v1_ls';

export function saveLifeToLocalStorage(state: LifeGameState): void {
  if (typeof localStorage === 'undefined') return;
  const payload: LifePersistedSave = {
    version: 1,
    savedAt: Date.now(),
    state: lifeGameStateSchema.parse(state),
  };
  localStorage.setItem(LS_KEY, JSON.stringify(payload));
}

export function loadLifeFromLocalStorage(): LifePersistedSave | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LifePersistedSave;
    lifeGameStateSchema.parse(parsed.state);
    return parsed;
  } catch {
    return null;
  }
}

export async function persistLife(state: LifeGameState): Promise<void> {
  saveLifeToLocalStorage(state);
  try {
    await saveLifeToIndexedDb(state);
  } catch {
    /* IndexedDB optional */
  }
}

export async function loadLifeSave(): Promise<LifePersistedSave | null> {
  try {
    const idb = await loadLifeFromIndexedDb();
    if (idb) return idb;
  } catch {
    /* fall through */
  }
  return loadLifeFromLocalStorage();
}

export async function clearLifeSave(): Promise<void> {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(LS_KEY);
  try {
    await clearLifeIndexedDb();
  } catch {
    /* ignore */
  }
}
