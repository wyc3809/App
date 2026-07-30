import type { LifeGameState } from '@interfaces/lifeEngine';
import { persistLife } from '@core/life/saveIndexedDb';

let persistTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: LifeGameState | null = null;
let flushHook: ((savedAt: number) => void) | null = null;

/** 供 store 更新「已落筆」時間戳 */
export function setPersistFlushHook(hook: ((savedAt: number) => void) | null): void {
  flushHook = hook;
}

async function writeNow(state: LifeGameState): Promise<void> {
  pendingState = null;
  await persistLife(state);
  flushHook?.(Date.now());
}

/** 延遲寫盤（戰鬥回合等熱路徑）；immediate 用於月結／抉擇／戰畢 */
export function schedulePersist(
  state: LifeGameState,
  opts?: { immediate?: boolean; delayMs?: number },
): void {
  pendingState = state;
  if (opts?.immediate) {
    if (persistTimer != null) {
      clearTimeout(persistTimer);
      persistTimer = null;
    }
    void writeNow(state);
    return;
  }
  if (persistTimer != null) clearTimeout(persistTimer);
  persistTimer = setTimeout(() => {
    persistTimer = null;
    if (pendingState) void writeNow(pendingState);
  }, opts?.delayMs ?? 450);
}

/** 頁面隱藏／卸載前沖刷 */
export function flushPersist(): void {
  if (persistTimer != null) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (pendingState) void writeNow(pendingState);
}

export function installPersistLifecycle(): () => void {
  if (typeof window === 'undefined') return () => {};
  const onHide = () => flushPersist();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
  return () => {
    window.removeEventListener('pagehide', onHide);
  };
}
