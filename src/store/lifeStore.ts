import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { EVENT_CATALOG } from '@data/events/catalog';
import { createNewLife, syncRngFromState } from '@core/life/gameState';
import { applyChoice, getEventById, resolvePendingAuto, startYear } from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave, persistLife } from '@core/life/saveIndexedDb';

export interface LifeStore {
  state: LifeGameState | null;
  saveLabel: string | null;
  debugOpen: boolean;
  bootstrapped: boolean;
  bootstrap: () => Promise<void>;
  newLife: (seed?: number) => void;
  continueLife: () => Promise<boolean>;
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  resolveBirthIfNeeded: () => void;
  setDebugOpen: (open: boolean) => void;
  importState: (state: LifeGameState) => void;
}

async function save(state: LifeGameState) {
  await persistLife(state);
}

export const useLifeStore = create<LifeStore>((set, get) => ({
  state: null,
  saveLabel: null,
  debugOpen: false,
  bootstrapped: false,

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
    });
  },

  continueLife: async () => {
    const loaded = await loadLifeSave();
    if (!loaded) return false;
    syncRngFromState(loaded.state);
    set({
      state: loaded.state,
      saveLabel: new Date(loaded.savedAt).toLocaleString('zh-TW'),
    });
    return true;
  },

  resolveBirthIfNeeded: () => {
    const { state } = get();
    if (!state?.pending || state.pending.eventId !== 'life_birth') return;
    const event = getEventById(EVENT_CATALOG, 'life_birth');
    if (!event) return;
    const result = resolvePendingAuto(structuredClone(state), event);
    void save(result.state);
    set({ state: result.state });
  },

  advanceYear: () => {
    const { state } = get();
    if (!state || state.pending || state.phase !== 'playing' || !state.character.alive) return;
    const next = structuredClone(state);
    startYear(next, EVENT_CATALOG);
    void save(next);
    set({ state: next });
  },

  choose: (choiceId: string) => {
    const { state } = get();
    if (!state?.pending) return;
    const event = getEventById(EVENT_CATALOG, state.pending.eventId);
    if (!event) return;
    const next = structuredClone(state);
    const result = applyChoice(next, event, choiceId);
    void save(result.state);
    set({ state: result.state });
  },

  setDebugOpen: (open: boolean) => set({ debugOpen: open }),

  importState: (state: LifeGameState) => {
    void save(state);
    set({ state });
  },
}));

export async function resetLifeSave() {
  await clearLifeSave();
}
