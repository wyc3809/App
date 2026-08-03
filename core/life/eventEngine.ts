import type { EventChoice, GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { gameEventSchema } from '@interfaces/lifeEngine';
import { applyEffects } from './effects';
import { meetsRequirements } from './requirements';
import {
  isEventOnRepeatCooldown,
  markEventComplete,
  snapshotRng,
  syncRngFromState,
} from './gameState';
import { buildLifeSummary } from './summary';
import { pushChronicle } from './chronicle';
import { simulateMonthBody, seasonLabel } from './monthly';
import { stageWeightBias } from './stages';
import { recordDeath } from './death';
import { RANDOM_PACK_EVENTS } from './packAdapter';
import { ORDINARY_EVENTS } from '@data/events/ordinary';
import { EVENT_CATALOG } from '@data/events/catalog';
import { SECRET_ART_EVENTS } from '@data/events/secretArts';
import { BOSS_ENCOUNTER_EVENTS, getBossFightConfig } from '@data/events/bossEncounters';
import { PRACTICE_WANDER_EVENTS } from '@data/events/practiceWander';
import { JIANGHU_EXTRA_EVENTS } from '@data/events/jianghuExtra100';
import { getRng } from '@core/random';
import { rollAdventureGear } from '@data/equipment/catalog';
import { grantGear } from './equipment';
import { withRiskAndThree, jitterEffectsForRoll } from './choiceEnrich';
import { pickPackEvent, getPackChoice } from './jianghuEventRepository';
import { resolvePackOutcomes, applyPackFortuneTwist } from './outcomeResolver';
import { isFleeChoice, startCombat, tryStartAftermathCombat } from './combat';
import { applyChoiceNature } from './nature';
import { ROAD_ENCOUNTER_EVENTS } from '@data/events/roadEncounters';
import { applyNarrateOverrideToEffects, lookupNarrateOverride } from '@data/events/narrateOverrides';
import { lookupArcEvent, isArcVisitReady, buildArcVisitEvent, resolveArcVisitGo, resolveArcVisitLater } from './arcs';
import { partitionStoryAndDeltas, sanitizePlayerLines } from './playerText';

function buildStoryFeedback(logs: string[], fallback = '事已了結。'): string {
  const { story } = partitionStoryAndDeltas(logs.filter((l) => l && !/\[object Object\]/i.test(l)));
  return story || fallback;
}

function mergeOutcomePresentation(
  logs: string[],
  deltas: string[],
  fallback = '事已了結。',
): { feedback: string; deltas: string[] } {
  const parted = partitionStoryAndDeltas(logs);
  // logs 裡已有的消長不要再從 deltas 加一次，否則會被 merge 成雙倍
  const extras = deltas.filter((d) => !logs.includes(d));
  return {
    feedback: parted.story || fallback,
    deltas: sanitizePlayerLines([...parted.deltas, ...extras]),
  };
}

function enrichLegacyEvent(event: GameEvent): GameEvent {
  if (event.choices.length >= 3 && event.choices.every((c) => c.outcomes.length >= 2)) {
    return event;
  }
  return withRiskAndThree(
    event,
    (_id, choiceText) => [
      {
        type: 'narrate',
        text: `「${choiceText ?? '此舉'}」功敗垂成：門後湧出後援，短棍砸肩，袖裡線索被抽走。你捂傷退入雨幕，只記住對方腕上的疤。`,
      },
      { type: 'health', amount: -6 },
      { type: 'money', amount: -3 },
    ],
    0.14,
  );
}

const ENRICHED_CATALOG = EVENT_CATALOG.map(enrichLegacyEvent);

export function validateEvent(raw: unknown): GameEvent {
  return gameEventSchema.parse(raw);
}

export function validateEvents(raw: unknown[]): GameEvent[] {
  return raw.map((e) => gameEventSchema.parse(e));
}

export function getEventById(catalog: GameEvent[], id: string): GameEvent | undefined {
  if (catalogById && (catalog === cachedCatalog || catalog.length === cachedCatalog?.length)) {
    const hit = catalogById.get(id);
    if (hit) return hit;
  }
  return catalog.find((e) => e.id === id);
}

let cachedCatalog: GameEvent[] | null = null;
let catalogById: Map<string, GameEvent> | null = null;

/** 合併：日常 + 江湖百事 + 路遇 + 修煉機緣 + 秘傳 + 舊目錄 + 百人包（單例快取） */
export function fullCatalog(): GameEvent[] {
  if (!cachedCatalog) {
    cachedCatalog = [
      ...ORDINARY_EVENTS,
      ...JIANGHU_EXTRA_EVENTS,
      ...ROAD_ENCOUNTER_EVENTS,
      ...PRACTICE_WANDER_EVENTS,
      ...SECRET_ART_EVENTS,
      ...BOSS_ENCOUNTER_EVENTS,
      ...ENRICHED_CATALOG,
      ...RANDOM_PACK_EVENTS,
    ];
    catalogById = new Map(cachedCatalog.map((e) => [e.id, e]));
  }
  return cachedCatalog;
}

/** O(1) 查主目錄；測試若傳入局部子集仍走線性掃描 */
export function lookupEvent(id: string): GameEvent | undefined {
  fullCatalog();
  return catalogById?.get(id);
}

/**
 * 解析當前 pending 事件（含動態短弧 arc_visit_*，不在靜態目錄內）
 * 若 pending 指向已失效 id，回傳 null（呼叫端可清掉卡死）
 */
export function resolvePendingEvent(state: LifeGameState): GameEvent | null {
  if (!state.pending) return null;
  const id = state.pending.eventId;
  const fromCat = lookupEvent(id) ?? getEventById(fullCatalog(), id);
  if (fromCat) return fromCat;
  return lookupArcEvent(state, id);
}

/** 清除無法解析的 pending，避免「有按鈕卻翻唔到頁」 */
export function clearDanglingPending(state: LifeGameState): boolean {
  if (!state.pending) return false;
  if (resolvePendingEvent(state)) return false;
  state.pending = null;
  return true;
}

export function listEligibleEvents(catalog: GameEvent[], state: LifeGameState): GameEvent[] {
  const eligible = catalog.filter((e) => meetsRequirements(state, e.requirements, e.id));
  const fresh = eligible.filter((e) => {
    // 路遇交手可重複，不受 50 月冷卻限制（另有 7–15 月倒數節奏）
    if ((e.tags ?? []).includes('road')) return true;
    return !isEventOnRepeatCooldown(state, e.id);
  });
  // 池子被冷卻抽乾時退回全部合格項，避免卡死無事件
  return fresh.length ? fresh : eligible;
}

function weightedPick(state: LifeGameState, events: GameEvent[]): GameEvent | null {
  if (!events.length) return null;
  const rng = getRng();
  const age = state.character.age;
  const weighted = events.map((e) => ({
    e,
    w: Math.max(0.05, (e.weight ?? 10) * stageWeightBias(age, e.tags)),
  }));
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let roll = rng.nextFloat() * total;
  for (const x of weighted) {
    roll -= x.w;
    if (roll <= 0) return x.e;
  }
  return weighted[weighted.length - 1]!.e;
}

export function pickOutcomeForChoice(
  state: LifeGameState,
  outcomes: EventChoice['outcomes'],
): EventChoice['outcomes'][number] {
  syncRngFromState(state);
  const rng = getRng();
  const hasChance = outcomes.some((o) => o.chance !== undefined);
  if (hasChance) {
    for (const o of outcomes) {
      if (rng.chance(o.chance ?? 1)) {
        snapshotRng(state);
        return o;
      }
    }
    snapshotRng(state);
    return outcomes[outcomes.length - 1];
  }
  const total = outcomes.reduce((s, o) => s + (o.weight ?? 1), 0);
  let roll = rng.nextFloat() * total;
  for (const o of outcomes) {
    roll -= o.weight ?? 1;
    if (roll <= 0) {
      snapshotRng(state);
      return o;
    }
  }
  snapshotRng(state);
  return outcomes[outcomes.length - 1];
}

export interface ResolveResult {
  state: LifeGameState;
  logs: string[];
  deltas: string[];
  feedback: string;
  died: boolean;
}

export function applyChoice(
  state: LifeGameState,
  event: GameEvent,
  choiceId: string,
): ResolveResult {
  syncRngFromState(state);
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) {
    return { state, logs: ['無此選擇。'], deltas: [], feedback: '無此選擇。', died: false };
  }
  if (!meetsRequirements(state, choice.requirements)) {
    return { state, logs: ['條件不足。'], deltas: [], feedback: '條件不足。', died: false };
  }

  const tags = event.tags ?? [];

  // 戰鬥事件：非逃避選項 → 進入回合制交手（外功可出招，內功僅被動）
  if (
    (tags.includes('combat') || /duel|assassin|bandit|rival/.test(event.id)) &&
    !isFleeChoice(choice.id, choice.text)
  ) {
    const bossCfg = tags.includes('boss') ? getBossFightConfig(event.id) : undefined;
    const foeName =
      bossCfg?.foeName ??
      (/assassin|殺手/.test(event.id + event.title)
        ? '蒙面殺手'
        : /bandit|賊|山/.test(event.id + event.title)
          ? '山賊'
          : /rival|宿敵/.test(event.id + event.title)
            ? '宿敵'
            : event.title.slice(0, 6) || '來敵');
    const logs = startCombat(state, {
      source: 'event',
      title: tags.includes('boss') ? `首領·${event.title}` : tags.includes('pack') ? '江湖偶遇·交手' : event.title,
      foeName,
      foePower: bossCfg?.foePower ?? (state.character.martial > 40 ? 'strong' : 'normal'),
      rewardOnWin:
        bossCfg?.rewardOnWin ??
        { money: 8, reputation: 2, martial: 2 },
      rewardOnLose: { money: -5, reputation: -1 },
      eventId: event.id,
    });
    markEventComplete(state, event.id);
    const deltas: string[] = [];
    const natureLines = applyChoiceNature(state, choice.text);
    if (natureLines.length) {
      deltas.push(...natureLines);
    }
    const prelude = `就「${tags.includes('pack') ? '江湖偶遇' : event.title}」一事，你選擇「${choice.text}」。刀光將起，對方已擋在眼前——這一局，要用真功夫說話。`;
    logs.unshift(prelude);
    const feedback = buildStoryFeedback(logs, prelude);
    pushChronicle(state, [`「${tags.includes('pack') ? '江湖偶遇' : event.title}」——${choice.text}`, feedback, ...deltas]);
    snapshotRng(state);
    return { state, logs, deltas, feedback, died: false };
  }

  let logs: string[] = [];
  let deltas: string[] = [];
  let feedback = '事已了結。';
  let died = false;

  // Pack v1：OutcomeResolver 依 op/path/value/chance 執行
  const packChoice = tags.includes('pack') ? getPackChoice(event.id, choiceId) : undefined;
  if (packChoice) {
    const resolved = resolvePackOutcomes(state, packChoice);
    logs = [...resolved.logs];
    deltas = [...resolved.deltas];
    feedback = buildStoryFeedback(logs, resolved.feedback);
    died = resolved.died;
    const twistLogs = applyPackFortuneTwist(state);
    if (twistLogs.length) {
      logs.push(...twistLogs);
      deltas.push('餘波');
    }
    if (resolved.success) {
      const rng = getRng();
      if (rng.chance(0.22)) {
        const gearId = rollAdventureGear(rng);
        if (gearId) {
          const name = grantGear(state, gearId);
          if (name) {
            logs.push(`行囊多了一件：「${name}」。`);
            deltas.push(`裝備＋${name}`);
          }
        }
      }
    }
  } else {
    const outcome = pickOutcomeForChoice(state, choice.outcomes);
    const rng = getRng();
    const overridden = applyNarrateOverrideToEffects(event.id, choiceId, outcome.effects);
    const jittered = jitterEffectsForRoll(overridden, rng.nextFloat());
    const applied = applyEffects(state, jittered);
    logs = applied.logs;
    deltas = applied.deltas;
    died = applied.died;
    // 若原效果無 narrate，仍注入覆蓋主文
    const ov = lookupNarrateOverride(event.id, choiceId);
    if (ov && !logs.some((l) => l === ov)) {
      logs = [ov, ...logs];
    }
    const isIll = outcome.id?.endsWith('_ill') || outcome.label === '事與願違';
    if (!isIll && (tags.includes('secret') || tags.includes('special'))) {
      if (rng.chance(0.22)) {
        const gearId = rollAdventureGear(rng);
        if (gearId) {
          const name = grantGear(state, gearId);
          if (name) {
            logs.push(`行囊多了一件：「${name}」。`);
            deltas.push(`裝備＋${name}`);
          }
        }
      }
    }
    feedback = buildStoryFeedback(logs, ov ?? '事已了結。');
  }

  const natureLines = applyChoiceNature(state, choice.text);
  if (natureLines.length) {
    deltas.push(...natureLines);
  }

  // 故人短弧：前去相見才落拍；改日只延遲，避免每月重出同一卡
  if (tags.includes('arc') || event.id.startsWith('arc_visit_')) {
    const arcLines =
      choiceId === 'later' || /改日|他日|稍後|離開|不往/.test(choice.text)
        ? resolveArcVisitLater(state)
        : resolveArcVisitGo(state);
    if (arcLines.length) {
      logs.push(...arcLines);
      for (const line of arcLines) {
        if (/武學|氣血|悟性|情誼/.test(line)) deltas.push(line);
      }
    }
  }

  // 故事主文不含數值消長；消長只留下面芯片
  const presented = mergeOutcomePresentation(
    logs.filter((l) => !l.startsWith('心性有變') && !/^[俠邪狂惡][+\-]+$/.test(l)),
    deltas,
    feedback,
  );
  feedback = presented.feedback;
  deltas = presented.deltas;

  if (tags.includes('combat') || /duel|assassin|bandit|rival/.test(event.id)) {
    // 真交手已改走回合制；逃避選項維持敘事結算
  }

  markEventComplete(state, event.id);
  state.pending = null;
  const titleForLog = tags.includes('pack') ? '江湖偶遇' : event.title;
  pushChronicle(state, [`「${titleForLog}」——${choice.text}`, feedback, ...deltas]);

  if (died || !state.character.alive) {
    if (!state.character.flags.death_cause) {
      recordDeath(state, '際遇難測，墨盡人散。');
    } else {
      state.character.alive = false;
    }
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }

  snapshotRng(state);
  return { state, logs, deltas, feedback, died };
}

function shouldTriggerSpecial(state: LifeGameState): boolean {
  if (!Number.isFinite(state.specialEventCountdown)) {
    state.specialEventCountdown = getRng().nextInt(3, 15);
  }
  state.specialEventCountdown -= 1;
  return state.specialEventCountdown <= 0;
}

/** 路遇交手：約每 7–15 個月觸發一次 */
function shouldTriggerRoadCombat(state: LifeGameState): boolean {
  const rng = getRng();
  if (!Number.isFinite(state.combatEncounterCountdown)) {
    state.combatEncounterCountdown = rng.nextInt(7, 15);
  }
  state.combatEncounterCountdown = (state.combatEncounterCountdown ?? 10) - 1;
  return (state.combatEncounterCountdown ?? 0) <= 0;
}

export function startMonth(state: LifeGameState): LifeGameState {
  if (!state.character.alive || state.phase !== 'playing') return state;
  if (state.pending) return state;
  if (state.pendingCombat) return state;

  syncRngFromState(state);
  const rng = getRng();

  // calendar
  state.month += 1;
  if (state.month > 12) {
    state.month = 1;
    state.year += 1;
    state.character.age += 1;
    state.character.stats.yearsLived += 1;
  }
  state.character.stats.monthsLived += 1;
  state.practiceActionsLeft = 3;

  simulateMonthBody(state);

  if (!state.character.alive) {
    if (!state.character.flags.death_cause) {
      recordDeath(state, '氣血耗盡，墨盡人散。');
    }
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
    pushChronicle(state, [String(state.character.flags.death_cause ?? '氣血耗盡，墨盡人散。')]);
    snapshotRng(state);
    return state;
  }

  // 戰後餘波交手優先於新事件
  const aftermathLogs = tryStartAftermathCombat(state);
  if (state.pendingCombat) {
    if (aftermathLogs.length) pushChronicle(state, aftermathLogs);
    snapshotRng(state);
    return state;
  }

  let event: GameEvent | null = null;
  let kind: 'ordinary' | 'special' | 'story' = 'ordinary';

  // 故人拍數到期：本月優先掛訪故人，唔同其他事件搶池、亦唔在冷卻期重抽
  if (isArcVisitReady(state)) {
    const arcEv = buildArcVisitEvent(state);
    if (arcEv) {
      event = arcEv;
      kind = 'story';
    }
  }

  // 路遇遇敵節奏：約 7–15 月一次（可重複池）
  if (!event && shouldTriggerRoadCombat(state)) {
    const roadPool = listEligibleEvents(ROAD_ENCOUNTER_EVENTS, state);
    event = weightedPick(state, roadPool.length ? roadPool : ROAD_ENCOUNTER_EVENTS);
    kind = 'ordinary';
    state.combatEncounterCountdown = rng.nextInt(7, 15);
  }

  const rumorBoost = Math.max(0, Math.min(3, Number(state.character.flags.rumor_boost ?? 0)));
  // 首領／傳聞略降，避免與路遇節奏疊加過密；打聽傳聞仍可抬高
  const bossChance = 0.04 + rumorBoost * 0.025;
  const secretExtraChance = rumorBoost > 0 ? 0.035 + rumorBoost * 0.022 : 0;

  if (!event) {
    const bossPool = listEligibleEvents(BOSS_ENCOUNTER_EVENTS, state);
    if (bossPool.length && rng.chance(bossChance)) {
      event = weightedPick(state, bossPool);
      kind = 'special';
    } else if (shouldTriggerSpecial(state) || (secretExtraChance > 0 && rng.chance(secretExtraChance))) {
      const packPick = pickPackEvent(state);
      if (packPick) {
        event = RANDOM_PACK_EVENTS.find((e) => e.id === packPick.id) ?? null;
      }
      if (!event) {
        const secretPool = listEligibleEvents(SECRET_ART_EVENTS, state);
        event = weightedPick(state, secretPool);
      }
      kind = 'special';
      state.specialEventCountdown = rng.nextInt(3, 15);
    }
  }

  if (!event) {
    // 修煉機緣略降：0.34 → 0.28，讓江湖百事更多露出
    const wanderPool = listEligibleEvents(PRACTICE_WANDER_EVENTS, state);
    if (wanderPool.length && rng.chance(0.28)) {
      event = weightedPick(state, wanderPool);
      kind = 'ordinary';
    }
  }

  if (!event) {
    const pool = listEligibleEvents(
      [
        ...ORDINARY_EVENTS,
        ...JIANGHU_EXTRA_EVENTS,
        ...ENRICHED_CATALOG.filter((e) => e.id !== 'life_birth'),
      ],
      state,
    ).filter((e) => !(e.tags ?? []).includes('pack') && !(e.tags ?? []).includes('arc'));
    event = weightedPick(state, pool);
    kind = 'ordinary';
  }

  if (rumorBoost > 0) {
    state.character.flags.rumor_boost = rumorBoost - 1;
  }

  if (event) {
    state.pending = {
      eventId: event.id,
      year: state.year,
      month: state.month,
      kind,
    };
  } else {
    pushChronicle(state, [
      `${state.year}年${state.month}月（${seasonLabel(state.month)}），風平浪靜。`,
    ]);
  }

  snapshotRng(state);
  return state;
}

/** @deprecated use startMonth */
export function startYear(state: LifeGameState, _catalog?: GameEvent[]): LifeGameState {
  return startMonth(state);
}

export function pickYearEvent(catalog: GameEvent[], state: LifeGameState): GameEvent | null {
  syncRngFromState(state);
  const event = weightedPick(state, listEligibleEvents(catalog, state));
  snapshotRng(state);
  return event;
}

export function resolvePendingAuto(state: LifeGameState, event: GameEvent): ResolveResult {
  const choice = event.choices[0];
  const outcome = choice.outcomes[0];
  const { logs, died, deltas } = applyEffects(state, outcome.effects);
  markEventComplete(state, event.id);
  state.pending = null;
  const feedback = logs[0] ?? '事畢。';
  pushChronicle(state, [`「${event.title}」`, feedback, ...deltas]);
  if (died) {
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }
  snapshotRng(state);
  return { state, logs, deltas, feedback, died };
}
