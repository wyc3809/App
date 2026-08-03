import type { GameEvent, EventChoice } from '@interfaces/lifeEngine';
import {
  getPackLibrary,
  type PackEventRaw,
  type PackChoiceRaw,
  packCompletionFlag,
} from './jianghuEventRepository';
import { withRiskAndThree } from './choiceEnrich';

/**
 * 將 Jianghu Random Events Pack v1 轉為引擎 GameEvent。
 * 保留原事件三選原文；實際數值結果由 OutcomeResolver 在抉擇時執行。
 */
export function convertPackEvent(source: PackEventRaw): GameEvent {
  const choices: EventChoice[] = (source.choices ?? []).slice(0, 3).map((item, index) =>
    convertPackChoice(item, index),
  );

  while (choices.length < 3) {
    choices.push({
      id: `extra_${choices.length}`,
      text: choices.length === 1 ? '另尋出路' : '抽身離開',
      outcomes: [{ effects: [{ type: 'narrate', text: '你沒有深陷其中。' }] }],
    });
  }

  const cond = source.conditions ?? {};
  const forbidden = [...(cond.forbidden_flags ?? [])];
  if (!forbidden.includes(packCompletionFlag(source.id))) {
    forbidden.push(packCompletionFlag(source.id));
  }
  const required = cond.required_flags ?? [];

  const base: GameEvent = {
    id: source.id,
    title: source.title,
    body: source.description || source.summary || source.title,
    tags: [...(source.tags ?? []), 'pack', 'special', source.category ?? 'world'].filter(Boolean),
    weight: Math.max(1, Number(source.weight ?? 10)),
    requirements: {
      minAge: cond.min_age ?? undefined,
      maxAge: cond.max_age ?? undefined,
      once: true,
      ...(required.length ? { flags: Object.fromEntries(required.map((f) => [f, true])) } : {}),
      notFlags: forbidden,
    },
    choices: choices.slice(0, 3),
  };

  // 保留三選；風險餘波改由 OutcomeResolver 尾段處理，避免覆蓋 pack outcomes
  return ensureThreeOnly(base);
}

function convertPackChoice(item: PackChoiceRaw, index: number): EventChoice {
  const feedback =
    (typeof item.result_text === 'string'
      ? item.result_text
      : item.result_text?.success) ||
    `你選擇「${item.text}」之後，現場留下了可追的痕跡——一枚腰牌、半句地名，或一縷未散的藥香。`;
  return {
    id: item.id || `choice_${index + 1}`,
    text: item.text,
    outcomes: [
      {
        // UI／驗證用占位；真正套用見 applyPackChoice → OutcomeResolver
        effects: [{ type: 'narrate', text: feedback }],
      },
    ],
  };
}

function ensureThreeOnly(event: GameEvent): GameEvent {
  if (event.choices.length >= 3) return { ...event, choices: event.choices.slice(0, 3) };
  return withRiskAndThree(
    event,
    (choiceId, choiceText) => [
      {
        type: 'narrate',
        text: `「${choiceText ?? choiceId}」這條路走不通：門後湧出後援，你帶傷退出，袖裡的線索也被抽走。`,
      },
      { type: 'health', amount: -6 },
    ],
    0.1,
  );
}

export function loadRandomEventPack(): GameEvent[] {
  const data = getPackLibrary();
  return (data.events ?? []).map(convertPackEvent);
}

export const RANDOM_PACK_EVENTS: GameEvent[] = loadRandomEventPack();

export { getPackLibrary, getPackChoice, getPackEventById } from './jianghuEventRepository';
