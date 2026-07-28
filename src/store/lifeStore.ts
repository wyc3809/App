import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import { applyChoice, fullCatalog, getEventById, startMonth } from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave, persistLife } from '@core/life/saveIndexedDb';
import { performPracticeAction, PRACTICE_ACTIONS, type PracticeActionId } from '@core/life/actions';
import { buildLifeSummary } from '@core/life/summary';

const CATALOG = fullCatalog();

export interface LastResult {
  title: string;
  feedback: string;
  deltas: string[];
  choiceText: string;
}

export interface LifeStore {
  state: LifeGameState | null;
  saveLabel: string | null;
  debugOpen: boolean;
  bootstrapped: boolean;
  sealText: string | null;
  flashLines: string[];
  lastResult: LastResult | null;
  creating: boolean;
  bootstrap: () => Promise<void>;
  beginCreate: () => void;
  cancelCreate: () => void;
  newLife: (opts?: CreateLifeOptions | number) => void;
  continueLife: () => Promise<boolean>;
  advanceMonth: () => void;
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  practice: (actionId: PracticeActionId, opts?: { sectId?: string }) => void;
  clearResult: () => void;
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
  lastResult: null,
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
      lastResult: null,
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
      lastResult: null,
    });
    return true;
  },

  advanceMonth: () => {
    const { state } = get();
    if (!state || state.pending || state.phase !== 'playing' || !state.character.alive) return;
    if (get().lastResult) set({ lastResult: null });
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
    const choice = event.choices.find((c) => c.id === choiceId);
    const next = structuredClone(state);
    const result = applyChoice(next, event, choiceId);
    void save(result.state);
    set({
      state: result.state,
      sealText: result.died || result.state.phase === 'summary' ? '終' : '定',
      flashLines: result.logs.slice(0, 4),
      lastResult: {
        title: (event.tags ?? []).includes('pack') ? '江湖偶遇' : event.title,
        choiceText: choice?.text ?? choiceId,
        feedback: result.feedback,
        deltas: result.deltas,
      },
    });
  },

  practice: (actionId: PracticeActionId, opts?: { sectId?: string }) => {
    const { state } = get();
    if (!state || state.phase !== 'playing' || !state.character.alive) return;
    const next = structuredClone(state);
    const logs = performPracticeAction(next, actionId, opts);
    if (!next.character.alive) {
      next.phase = 'summary';
      next.summaryText = buildLifeSummary(next);
    }
    void save(next);
    const label =
      PRACTICE_ACTIONS.find((a) => a.id === actionId)?.label ??
      ({
        join_sect: '拜入門派',
        sect_duty: '門派差事',
        sect_ask_elder: '請教長老',
        sect_spar: '師門比武',
        sect_guard: '守護山門',
        sect_meditate: '靜室修煉',
        sect_leave: '離開門派',
      } as Record<string, string>)[actionId] ??
      actionId;
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : '煉',
      flashLines: logs.slice(0, 4),
      lastResult: {
        title: '修煉',
        choiceText: label,
        feedback: logs[0] ?? '事畢。',
        deltas: logs.slice(1),
      },
    });
  },

  clearResult: () => set({ lastResult: null }),

  setTab: (tab) => {
    const { state } = get();
    if (!state) return;
    set({ state: { ...state, tab } });
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
