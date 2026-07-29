import type { EventChoice, GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { gameEventSchema } from '@interfaces/lifeEngine';
import { applyEffects } from './effects';
import { meetsRequirements } from './requirements';
import { markEventComplete, snapshotRng, syncRngFromState } from './gameState';
import { buildLifeSummary } from './summary';
import { pushChronicle } from './chronicle';
import { simulateMonthBody, seasonLabel } from './monthly';
import { RANDOM_PACK_EVENTS } from './packAdapter';
import { ORDINARY_EVENTS } from '@data/events/ordinary';
import { EVENT_CATALOG } from '@data/events/catalog';
import { SECRET_ART_EVENTS } from '@data/events/secretArts';
import { getRng } from '@core/random';
import { rollAdventureGear } from '@data/equipment/catalog';
import { grantGear } from './equipment';
import { withRiskAndThree } from './choiceEnrich';
import { pickPackEvent, getPackChoice } from './jianghuEventRepository';
import { resolvePackOutcomes, applyPackRiskTail } from './outcomeResolver';
import { isFleeChoice, startCombat } from './combat';
import { applyChoiceNature } from './nature';

/** 把數值行與故事行分開，故事作主文 */
function isStatLine(line: string): boolean {
  return /^(銀兩|氣血|名望|武學|內息|內力|裝備|心性|天下|疲勞|閱事)/.test(line);
}

function buildStoryFeedback(logs: string[], fallback = '事已了結。'): string {
  const story = logs.filter((l) => l && !isStatLine(l));
  if (!story.length) return logs[0] || fallback;
  // 去重並以段落拼接
  const seen = new Set<string>();
  const parts: string[] = [];
  for (const s of story) {
    const t = s.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    parts.push(t);
  }
  return parts.join('\n\n') || fallback;
}

function enrichLegacyEvent(event: GameEvent): GameEvent {
  if (event.choices.length >= 3 && event.choices.every((c) => c.outcomes.length >= 2)) {
    return event;
  }
  return withRiskAndThree(
    event,
    () => [
      { type: 'narrate', text: '事與願違：你失了分寸，場面翻轉，銀錢與氣血都捱了一記。你把這場教訓嚥進肚裡，改日再走。' },
      { type: 'health', amount: -12 },
      { type: 'money', amount: -5 },
    ],
    0.16,
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
  return catalog.find((e) => e.id === id);
}

/** 合併：日常 + 秘傳奇遇 + 舊 50 + 百人包 */
export function fullCatalog(): GameEvent[] {
  return [...ORDINARY_EVENTS, ...SECRET_ART_EVENTS, ...ENRICHED_CATALOG, ...RANDOM_PACK_EVENTS];
}

export function listEligibleEvents(catalog: GameEvent[], state: LifeGameState): GameEvent[] {
  return catalog.filter((e) => meetsRequirements(state, e.requirements, e.id));
}

function weightedPick(_state: LifeGameState, events: GameEvent[]): GameEvent | null {
  if (!events.length) return null;
  const rng = getRng();
  const total = events.reduce((s, e) => s + (e.weight ?? 10), 0);
  let roll = rng.nextFloat() * total;
  for (const e of events) {
    roll -= e.weight ?? 10;
    if (roll <= 0) return e;
  }
  return events[events.length - 1];
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
    const foeName =
      /assassin|殺手/.test(event.id + event.title)
        ? '蒙面殺手'
        : /bandit|賊|山/.test(event.id + event.title)
          ? '山賊'
          : /rival|宿敵/.test(event.id + event.title)
            ? '宿敵'
            : event.title.slice(0, 6) || '來敵';
    const logs = startCombat(state, {
      source: 'event',
      title: (tags.includes('pack') ? '江湖偶遇·交手' : event.title),
      foeName,
      foePower: state.character.martial > 40 ? 'strong' : 'normal',
      rewardOnWin: { money: 8, reputation: 2, martial: 2 },
      rewardOnLose: { money: -5, reputation: -1 },
      eventId: event.id,
    });
    markEventComplete(state, event.id);
    const deltas: string[] = [];
    const natureLines = applyChoiceNature(state, choice.text);
    if (natureLines.length) {
      logs.push(`心性有變：${natureLines.join('、')}`);
      deltas.push(...natureLines.map((l) => `心性${l}`));
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
    if (resolved.success) {
      const riskLogs = applyPackRiskTail(state, 0.12);
      if (riskLogs.length) {
        logs.push(...riskLogs);
        deltas.push('餘波');
      }
      const rng = getRng();
      if (rng.chance(0.28)) {
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
    const applied = applyEffects(state, outcome.effects);
    logs = applied.logs;
    deltas = applied.deltas;
    died = applied.died;
    const isBad = outcome.id?.endsWith('_bad') || outcome.label === '事與願違';
    if (!isBad && (tags.includes('secret') || tags.includes('special'))) {
      const rng = getRng();
      if (rng.chance(0.28)) {
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
    feedback = buildStoryFeedback(logs, '事已了結。');
  }

  const natureLines = applyChoiceNature(state, choice.text);
  if (natureLines.length) {
    logs.push(`心性有變：${natureLines.join('、')}`);
    deltas.push(...natureLines.map((l) => `心性${l}`));
    // 心性句留在 deltas；故事主文不重複塞數值感句子
    if (!feedback.includes('心性')) {
      // keep story as-is
    }
  }

  // 若心性變化後仍要用完整故事，重新彙總一次（排除純數值）
  feedback = buildStoryFeedback(
    logs.filter((l) => !l.startsWith('心性有變')),
    feedback,
  );

  if (tags.includes('combat') || /duel|assassin|bandit|rival/.test(event.id)) {
    // 真交手已改走回合制；逃避選項維持敘事結算
  }

  markEventComplete(state, event.id);
  state.pending = null;
  const titleForLog = tags.includes('pack') ? '江湖偶遇' : event.title;
  pushChronicle(state, [`「${titleForLog}」——${choice.text}`, feedback, ...deltas]);

  if (died || !state.character.alive) {
    state.character.alive = false;
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
  }

  snapshotRng(state);
  return { state, logs, deltas, feedback, died };
}

function shouldTriggerSpecial(state: LifeGameState): boolean {
  if (!Number.isFinite(state.specialEventCountdown)) {
    state.specialEventCountdown = getRng().nextInt(5, 30);
  }
  state.specialEventCountdown -= 1;
  return state.specialEventCountdown <= 0;
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
    state.phase = 'summary';
    state.summaryText = buildLifeSummary(state);
    pushChronicle(state, ['氣血耗盡，墨盡人散。']);
    snapshotRng(state);
    return state;
  }

  let event: GameEvent | null = null;
  let kind: 'ordinary' | 'special' | 'story' = 'ordinary';

  if (shouldTriggerSpecial(state)) {
    // Pack v1 流程：conditions 過濾 → weight 加權；再混入秘傳奇遇
    const packPick = pickPackEvent(state);
    if (packPick) {
      event = RANDOM_PACK_EVENTS.find((e) => e.id === packPick.id) ?? null;
    }
    if (!event) {
      const secretPool = listEligibleEvents(SECRET_ART_EVENTS, state);
      event = weightedPick(state, secretPool);
    }
    kind = 'special';
    state.specialEventCountdown = rng.nextInt(5, 30);
  }

  if (!event) {
    // mix ordinary + non-birth catalog events (exclude pack)
    const pool = listEligibleEvents(
      [...ORDINARY_EVENTS, ...ENRICHED_CATALOG.filter((e) => e.id !== 'life_birth')],
      state,
    ).filter((e) => !(e.tags ?? []).includes('pack'));
    event = weightedPick(state, pool);
    kind = 'ordinary';
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
