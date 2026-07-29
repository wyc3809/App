import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import { applyChoice, fullCatalog, getEventById, startMonth } from '@core/life/eventEngine';
import { clearLifeSave, loadLifeSave, persistLife } from '@core/life/saveIndexedDb';
import { performPracticeAction, PRACTICE_ACTIONS, type PracticeActionId } from '@core/life/actions';
import { buildLifeSummary } from '@core/life/summary';
import { playerCombatTurn, getPlayerMoves, resolveCombatDisposition, type CombatFoeDisposition } from '@core/life/combat';
import { displayChoiceText, sanitizePlayerLine, sanitizePlayerLines } from '@core/life/playerText';
import { BASIC_STRIKE } from '@data/skills/catalog';

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
  combatMove: (moveId: string) => void;
  combatResolveFoe: (disposition: CombatFoeDisposition) => void;
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
    if (!state || state.pending || state.pendingCombat || state.phase !== 'playing' || !state.character.alive)
      return;
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
    if (!state?.pending || state.pendingCombat) return;
    const event = getEventById(CATALOG, state.pending.eventId);
    if (!event) return;
    const choice = event.choices.find((c) => c.id === choiceId);
    const next = structuredClone(state);
    const result = applyChoice(next, event, choiceId);
    const startedCombat = Boolean(result.state.pendingCombat);
    void save(result.state);
    set({
      state: result.state,
      sealText: result.died || result.state.phase === 'summary' ? '終' : startedCombat ? '戰' : '定',
      flashLines: [],
      lastResult: startedCombat
        ? null
        : {
            title: (event.tags ?? []).includes('pack') ? '江湖偶遇' : event.title,
            choiceText: displayChoiceText(choice?.text, choiceId),
            feedback: sanitizePlayerLine(result.feedback),
            deltas: sanitizePlayerLines(result.deltas),
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
        inquire_rumors: '打聽傳聞',
        join_sect: '拜入門派',
        sect_duty: '門派差事',
        sect_ask_elder: '請教長老',
        sect_spar: '師門比武',
        sect_guard: '守護山門',
        sect_meditate: '靜室修煉',
        sect_leave: '離開門派',
        train_martial: '苦練外功',
        train_internal: '打坐運功',
        temper_body: '淬體強身',
        forge: '鍛造兵器',
        seek_master: '尋訪高人',
      } as Record<string, string>)[actionId] ??
      actionId;
    const startedCombat = Boolean(next.pendingCombat);
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : startedCombat ? '戰' : '煉',
      flashLines: [],
      lastResult: startedCombat
        ? null
        : {
            title: '修煉',
            choiceText: label,
            feedback: sanitizePlayerLine(logs[0] ?? '事畢。'),
            deltas: sanitizePlayerLines(logs.slice(1)),
          },
    });
  },

  clearResult: () => set({ lastResult: null, flashLines: [] }),

  combatMove: (moveId: string) => {
    const { state } = get();
    if (!state?.pendingCombat || state.pendingCombat.phase !== 'player') return;
    const next = structuredClone(state);
    const logs = playerCombatTurn(next, moveId);
    const combat = next.pendingCombat;
    const resolving = combat?.phase === 'resolve';
    const fled = logs.some((l) => /逃離成功/.test(l));
    const ended = !combat;
    const moveName =
      getPlayerMoves(state).find((m) => m.id === moveId)?.name ??
      (moveId === BASIC_STRIKE.id ? BASIC_STRIKE.name : displayChoiceText(moveId));
    set({
      state: next,
      // 交手中段不蓋印，避免每回合動畫拖慢手感
      sealText: next.phase === 'summary' ? '終' : resolving ? '勝' : fled ? '遁' : ended ? (logs.some((l) => /敗於|力竭/.test(l)) ? '敗' : '勝') : null,
      flashLines: ended || resolving ? [] : logs.slice(0, 5),
      lastResult:
        ended && !resolving
          ? {
              title: state.pendingCombat!.title,
              choiceText: moveName,
              feedback: sanitizePlayerLine(
                logs.find((l) => /戰勝|敗於|力竭|逃離/.test(l)) ?? logs[logs.length - 1] ?? '交手結束。',
              ),
              deltas: sanitizePlayerLines(logs.filter((l) => /＋|－|\+|武學|銀兩|名望|進境|心性|^[俠邪狂惡][+\-]+$/.test(l))),
            }
          : get().lastResult,
    });
    // 存檔延後，先讓 UI 立刻回饋按鍵
    window.setTimeout(() => {
      void save(next);
    }, 0);
  },

  combatResolveFoe: (disposition: CombatFoeDisposition) => {
    const { state } = get();
    if (!state?.pendingCombat || state.pendingCombat.phase !== 'resolve') return;
    const next = structuredClone(state);
    const logs = resolveCombatDisposition(next, disposition);
    if (!next.character.alive && next.phase !== 'summary') {
      next.phase = 'summary';
      next.summaryText = buildLifeSummary(next);
    }
    void save(next);
    const labels: Record<CombatFoeDisposition, string> = {
      kill: '殺死',
      release: '放走',
      stun: '擊暈',
    };
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : '定',
      flashLines: [],
      lastResult: {
        title: state.pendingCombat.title,
        choiceText: labels[disposition],
        feedback: sanitizePlayerLine(
          logs
            .filter((l) => !/^銀兩|^名望＋|^名望－|^武學|^戰利品|^習得|^進境|^[俠邪狂惡][+\-]+$/.test(l))
            .join('\n\n'),
        ),
        deltas: sanitizePlayerLines(
          logs.filter((l) => /^銀兩|^名望|^武學|^心性|^戰利品|^習得|^進境|^[俠邪狂惡][+\-]+$/.test(l)),
        ),
      },
    });
  },

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
