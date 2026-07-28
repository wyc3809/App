import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import { applyChoice, fullCatalog, getEventById, startMonth } from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave, persistLife } from '@core/life/saveIndexedDb';

const CATALOG = fullCatalog();

export interface LifeStore {
  state: LifeGameState | null;
  saveLabel: string | null;
  debugOpen: boolean;
  bootstrapped: boolean;
  sealText: string | null;
  flashLines: string[];
  creating: boolean;
  bootstrap: () => Promise<void>;
  beginCreate: () => void;
  cancelCreate: () => void;
  newLife: (opts?: CreateLifeOptions | number) => void;
  continueLife: () => Promise<boolean>;
  advanceMonth: () => void;
  /** @deprecated */
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  setTab: (tab: NonNullable<LifeGameState['tab']>) => void;
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
  creating: false,

  bootstrap: async () => {
    if (get().bootstrapped) return;
    set({ bootstrapped: true });
  },

  beginCreate: () => set({ creating: true }),
  cancelCreate: () => set({ creating: false }),

  newLife: (opts?: CreateLifeOptions | number) => {
    const state = createNewLife(opts);
    void save(state);
    set({
      state,
      creating: false,
      saveLabel: new Date().toLocaleString('zh-TW'),
      sealText: '生',
      flashLines: [],
    });
  },

  continueLife: async () => {
    const loaded = await loadLifeSave();
    if (!loaded) return false;
    const state = migrateLifeState(loaded.state);
    syncRngFromState(state);
    set({
      state,
      creating: false,
      saveLabel: new Date(loaded.savedAt).toLocaleString('zh-TW'),
      sealText: null,
      flashLines: [],
    });
    return true;
  },

  advanceMonth: () => {
    const { state } = get();
    if (!state || state.pending || state.phase !== 'playing' || !state.character.alive) return;
    const next = structuredClone(state);
    startMonth(next);
    void save(next);
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : '月',
      flashLines: [],
    });
  },

  advanceYear: () => get().advanceMonth(),

  choose: (choiceId: string) => {
    const { state } = get();
    if (!state?.pending) return;
    const event = getEventById(CATALOG, state.pending.eventId);
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

  setTab: (tab) => {
    const { state } = get();
    if (!state) return;
    const next = { ...state, tab };
    set({ state: next });
  },

  setDebugOpen: (open: boolean) => set({ debugOpen: open }),

  importState: (state: LifeGameState) => {
    const migrated = migrateLifeState(state);
    void save(migrated);
    set({ state: migrated });
  },

  clearSeal: () => set({ sealText: null }),
}));

export async function resetLifeSave() {
  await clearLifeSave();
}

export { CATALOG as LIFE_CATALOG };
