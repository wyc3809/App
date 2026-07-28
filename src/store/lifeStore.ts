import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { EVENT_CATALOG } from '@data/events/catalog';
import { createNewLife, syncRngFromState } from '@core/life/gameState';
import { applyChoice, getEventById, startYear } from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave, persistLife } from '@core/life/saveIndexedDb';

export interface LifeStore {
  state: LifeGameState | null;
  saveLabel: string | null;
  debugOpen: boolean;
  bootstrapped: boolean;
  /** 短暫朱砂印文案 */
  sealText: string | null;
  flashLines: string[];
  bootstrap: () => Promise<void>;
  newLife: (seed?: number) => void;
  continueLife: () => Promise<boolean>;
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  setDebugOpen: (open: boolean) => void;
  importState: (state: LifeGameState) => void;
  clearSeal: () => void;
}

async function save(state: LifeGameState) {
  await persistLife(state);
}

export const useLifeStore = create<LifeStore>((set, get) => ({
  state: null,
  saveLabel: null,
  debugOpen: false,
  bootstrapped: false,
  sealText: null,
  flashLines: [],

  bootstrap: async () => {
    if (get().bootstrapped) return;
    set({ bootstrapped: true });
  },

  newLife: (seed?: number) => {
    const state = createNewLife(seed);
    void save(state);
    set({
      state,
      saveLabel: new Date().toLocaleString('zh-TW'),
      sealText: '生',
      flashLines: [],
    });
  },

  continueLife: async () => {
    const loaded = await loadLifeSave();
    if (!loaded) return false;
    syncRngFromState(loaded.state);
    set({
      state: loaded.state,
      saveLabel: new Date(loaded.savedAt).toLocaleString('zh-TW'),
      sealText: null,
      flashLines: [],
    });
    return true;
  },

  advanceYear: () => {
    const { state } = get();
    if (!state || state.pending || state.phase !== 'playing' || !state.character.alive) return;
    const next = structuredClone(state);
    startYear(next, EVENT_CATALOG);
    void save(next);
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : '年',
      flashLines: [],
    });
  },

  choose: (choiceId: string) => {
    const { state } = get();
    if (!state?.pending) return;
    const event = getEventById(EVENT_CATALOG, state.pending.eventId);
    if (!event) return;
    const next = structuredClone(state);
    const result = applyChoice(next, event, choiceId);
    void save(result.state);
    set({
      state: result.state,
      sealText: result.died || result.state.phase === 'summary' ? '終' : '定',
      flashLines: result.logs.slice(0, 4),
    });
  },

  setDebugOpen: (open: boolean) => set({ debugOpen: open }),

  importState: (state: LifeGameState) => {
    void save(state);
    set({ state });
  },

  clearSeal: () => set({ sealText: null }),
}));

export async function resetLifeSave() {
  await clearLifeSave();
}
