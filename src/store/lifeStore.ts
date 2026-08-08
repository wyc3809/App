import { create } from 'zustand';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { createNewLife, migrateLifeState, syncRngFromState, type CreateLifeOptions } from '@core/life/gameState';
import {
  applyChoice,
  clearDanglingPending,
  fullCatalog,
  lookupEvent,
  resolvePendingEvent,
  startMonth,
} from '@core/life/eventEngine';
import { subscribeEventOverrides } from '@core/life/eventOverrides';
import { clearLifeSave, loadLifeSave } from '@core/life/saveIndexedDb';
import {
  flushPersist,
  installPersistLifecycle,
  schedulePersist,
  setPersistFlushHook,
} from './persistSchedule';
import { performPracticeAction, PRACTICE_ACTIONS, type PracticeActionId } from '@core/life/actions';
import { equipGear } from '@core/life/equipment';
import { buildLifeSummary } from '@core/life/summary';
import { playerCombatTurn, getPlayerMoves, resolveCombatDisposition, type CombatFoeDisposition } from '@core/life/combat';
import { displayChoiceText, sanitizePlayerLine, sanitizePlayerLines, partitionStoryAndDeltas } from '@core/life/playerText';
import { BASIC_STRIKE } from '@data/skills/catalog';
import {
  startHuashanBracket,
  dismissHuashanReport,
  clearCompletedHuashan,
  runPlayerHuashanDuel,
} from '@core/life/huashan';
import { extractLegacy } from '@core/life/legacy';
import { pushChronicle } from '@core/life/chronicle';
import { resolveArcVisitLater } from '@core/life/arcs';
import { track } from '../telemetry/events';

/** 隨手機覆寫熱更新；勿在模組頂層固定死引用 */
let CATALOG = fullCatalog();
subscribeEventOverrides(() => {
  CATALOG = fullCatalog();
});

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
  /** 帶前世墨跡轉世 */
  reincarnate: () => void;
  continueLife: () => Promise<boolean>;
  advanceMonth: () => void;
  advanceYear: () => void;
  choose: (choiceId: string) => void;
  /** 無可選抉擇時暫避 */
  dismissEvent: () => void;
  dismissCoach: () => void;
  practice: (actionId: PracticeActionId, opts?: { sectId?: string }) => void;
  combatMove: (moveId: string) => void;
  combatResolveFoe: (disposition: CombatFoeDisposition) => void;
  clearResult: () => void;
  setTab: (tab: NonNullable<LifeGameState['tab']>) => void;
  setDebugOpen: (open: boolean) => void;
  importState: (state: LifeGameState) => void;
  clearSeal: () => void;
  huashanStart: () => void;
  huashanFight: () => void;
  huashanDismissReport: () => void;
  huashanClose: () => void;
  /** 免費換裝（不耗修煉次數） */
  equipOwned: (gearId: string) => void;
}

async function save(state: LifeGameState, immediate = true) {
  schedulePersist(state, { immediate });
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
    setPersistFlushHook((savedAt) => {
      set({ saveLabel: new Date(savedAt).toLocaleString('zh-TW') });
    });
    installPersistLifecycle();
    set({ bootstrapped: true });
  },

  beginCreate: () => set({ creating: true }),
  cancelCreate: () => set({ creating: false }),

  newLife: (opts?: CreateLifeOptions | number) => {
    const state = createNewLife(opts);
    void save(state);
    track('life_create', {
      seed: state.seed,
      hasLegacy: Boolean(typeof opts === 'object' && opts && 'legacy' in opts && opts.legacy),
    });
    set({
      state,
      creating: false,
      saveLabel: new Date().toLocaleString('zh-TW'),
      sealText: '生',
      flashLines: [],
      lastResult: null,
    });
  },

  reincarnate: () => {
    const prev = get().state;
    if (!prev || prev.phase !== 'summary') {
      get().newLife();
      return;
    }
    const legacy = extractLegacy(prev);
    track('life_reincarnate', {
      generation: legacy.generation,
      family: legacy.familyLegacy,
      teacher: legacy.teacherLegacy,
    });
    get().newLife({ legacy });
  },

  continueLife: async () => {
    const loaded = await loadLifeSave();
    if (!loaded) return false;
    const state = migrateLifeState(loaded.state);
    syncRngFromState(state);
    track('life_resume', { age: state.character.age });
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
    if (!state || state.pendingCombat || state.phase !== 'playing' || !state.character.alive) return;
    // 失效 pending（如舊版動態短弧）先清掉，否則按鈕可見卻永遠翻唔到
    if (state.pending && !resolvePendingEvent(state)) {
      const fixed = structuredClone(state);
      clearDanglingPending(fixed);
      void save(fixed);
      set({ state: fixed });
    }
    const current = get().state;
    if (!current || current.pending || current.pendingCombat) return;
    if (get().lastResult) set({ lastResult: null });
    const next = structuredClone(current);
    if (!next.character.flags.coach_flipped) next.character.flags.coach_flipped = true;
    startMonth(next);
    if (next.phase === 'summary') {
      track('life_death', { cause: String(next.character.flags.death_cause ?? '') });
    } else {
      track('month_advance', { month: next.month, age: next.character.age });
    }
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
    const event = resolvePendingEvent(state) ?? lookupEvent(state.pending.eventId);
    if (!event) {
      // 死 pending：清掉讓玩家可繼續
      const next = structuredClone(state);
      clearDanglingPending(next);
      void save(next);
      set({ state: next });
      return;
    }
    const choice = event.choices.find((c) => c.id === choiceId);
    const next = structuredClone(state);
    if (!next.character.flags.coach_chose) next.character.flags.coach_chose = true;
    const result = applyChoice(next, event, choiceId);
    const startedCombat = Boolean(result.state.pendingCombat);
    track('choice_made', { eventId: event.id, choiceId });
    if (result.died || result.state.phase === 'summary') {
      track('life_death', { cause: String(result.state.character.flags.death_cause ?? '') });
    }
    if (startedCombat) track('combat_start', { title: result.state.pendingCombat?.title ?? '' });
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

  dismissEvent: () => {
    const { state } = get();
    if (!state?.pending || state.pendingCombat) return;
    const next = structuredClone(state);
    const eventId = next.pending!.eventId;
    const title = resolvePendingEvent(next)?.title ?? lookupEvent(eventId)?.title ?? '機緣';
    // 故人訪卡：暫避等同「改日再說」，延遲 monthsLeft，否則下月又掛同一張
    const arcDelay =
      eventId.startsWith('arc_visit_') && next.lifeArc
        ? resolveArcVisitLater(next)
        : [];
    next.pending = null;
    const feedback =
      arcDelay[0] ?? '你選擇暫避鋒芒，此事輕輕揭過。';
    pushChronicle(next, [`「${title}」`, feedback]);
    void save(next);
    set({
      state: next,
      sealText: '定',
      lastResult: {
        title,
        choiceText: '暫避鋒芒',
        feedback,
        deltas: [],
      },
    });
  },

  dismissCoach: () => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    next.character.flags.coach_done = true;
    track('coach_dismiss');
    void save(next);
    set({ state: next });
  },

  practice: (actionId: PracticeActionId, opts?: { sectId?: string }) => {
    const { state } = get();
    if (!state || state.phase !== 'playing' || !state.character.alive) return;
    const next = structuredClone(state);
    if (!next.character.flags.coach_practiced) next.character.flags.coach_practiced = true;
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
    const parted = partitionStoryAndDeltas(logs);
    set({
      state: next,
      sealText: next.phase === 'summary' ? '終' : startedCombat ? '戰' : '煉',
      flashLines: [],
      lastResult: startedCombat
        ? null
        : {
            title: '修煉',
            choiceText: label,
            feedback: parted.story || sanitizePlayerLine(logs[0] ?? '事畢。'),
            deltas: parted.deltas,
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
    // 交手中段 debounce 寫盤；戰畢／決勝立即落筆
    schedulePersist(next, { immediate: ended || resolving || fled });
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

  huashanStart: () => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    const logs = startHuashanBracket(next);
    void save(next);
    set({
      state: next,
      sealText: '劍',
      flashLines: [],
      lastResult: {
        title: '華山論劍',
        choiceText: '持帖報名',
        feedback: sanitizePlayerLine(logs.join('\n')),
        deltas: [],
      },
    });
  },

  huashanFight: () => {
    const { state } = get();
    if (!state?.huashan) return;
    const next = structuredClone(state);
    const logs = runPlayerHuashanDuel(next);
    const won = /晉級|冠軍|告捷/.test(logs.join(''));
    const lost = /止步|敗北/.test(logs.join(''));
    void save(next);
    set({
      state: next,
      sealText: next.huashan?.status === 'completed' ? (won && !lost ? '勝' : '敗') : won ? '勝' : lost ? '敗' : '劍',
      flashLines: [],
      lastResult: {
        title: '華山論劍',
        choiceText: '赴戰',
        feedback: sanitizePlayerLine(logs.slice(-6).join('\n')),
        deltas: sanitizePlayerLines(
          logs.filter((l) => /^名望|^銀兩|^武學|冠軍|四強/.test(l)),
        ),
      },
    });
  },

  huashanDismissReport: () => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    dismissHuashanReport(next);
    void save(next);
    set({ state: next });
  },

  huashanClose: () => {
    const { state } = get();
    if (!state) return;
    const next = structuredClone(state);
    clearCompletedHuashan(next);
    void save(next);
    set({ state: next });
  },

  equipOwned: (gearId: string) => {
    const { state } = get();
    if (!state || state.phase !== 'playing' || !state.character.alive) return;
    if (state.pendingCombat) return;
    const next = structuredClone(state);
    const msg = equipGear(next, gearId);
    void save(next);
    set({
      state: next,
      sealText: '裝',
      flashLines: [],
      lastResult: {
        title: '整裝',
        choiceText: '換裝',
        feedback: sanitizePlayerLine(msg),
        deltas: [],
      },
    });
  },
}));

export async function resetLifeSave() {
  flushPersist();
  await clearLifeSave();
}

export { CATALOG as LIFE_CATALOG };
