import type { EventChoice, GameEvent } from '@interfaces/lifeEngine';

/** 保證三選、並為每選附上低機率負面結果 */
export function enrichChoiceWithRisk(
  choice: EventChoice,
  negative: EventChoice['outcomes'][number]['effects'],
  badChance = 0.18,
): EventChoice {
  const good = choice.outcomes[0] ?? { effects: [{ type: 'narrate' as const, text: '事畢。' }] };
  return {
    ...choice,
    outcomes: [
      { ...good, weight: Math.round((1 - badChance) * 100), chance: undefined },
      {
        id: `${choice.id}_bad`,
        label: '事與願違',
        weight: Math.round(badChance * 100),
        effects: negative,
      },
    ],
  };
}

export function ensureThreeChoices(event: GameEvent): GameEvent {
  const choices = [...event.choices];
  while (choices.length < 3) {
    choices.push({
      id: `fallback_${choices.length}`,
      text: choices.length === 1 ? '另謀他法' : '抽身離開',
      outcomes: [
        {
          effects: [{ type: 'narrate', text: '你沒有深陷其中，只把經過記在心裡。' }],
        },
      ],
    });
  }
  return { ...event, choices: choices.slice(0, 3) };
}

export function withRiskAndThree(
  event: GameEvent,
  negativeFactory: (choiceId: string) => EventChoice['outcomes'][number]['effects'],
  badChance = 0.18,
): GameEvent {
  const base = ensureThreeChoices(event);
  return {
    ...base,
    choices: base.choices.map((ch) => enrichChoiceWithRisk(ch, negativeFactory(ch.id), badChance)),
  };
}
