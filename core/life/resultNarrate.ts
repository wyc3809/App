import type { EventChoice, GameEvent } from '@interfaces/lifeEngine';
import { isTemplateNarrate, lookupNarrateOverride } from '@data/events/narrateOverrides';

/** 與手機編修器「結果敘事」同一條：優先順遂結果 narrate；若仍係模板則用 NARRATE_OVERRIDES */
export function getChoiceResultNarrate(event: GameEvent, choiceId: string): string | undefined {
  const choice = event.choices.find((c) => c.id === choiceId);
  if (!choice) return undefined;
  return getChoiceResultNarrateFromChoice(event.id, choice);
}

export function getChoiceResultNarrateFromChoice(
  eventId: string,
  choice: EventChoice,
): string | undefined {
  const fair =
    choice.outcomes.find((o) => !String(o.id || '').endsWith('_ill') && o.label !== '事與願違') ||
    choice.outcomes.find((o) => o.label === '順遂') ||
    choice.outcomes[0];
  const narr = fair?.effects.find((e) => e.type === 'narrate') as { text?: string } | undefined;
  const fromEvent = narr?.text?.trim() || undefined;
  const ov = lookupNarrateOverride(eventId, choice.id)?.trim();
  if (fromEvent && !isTemplateNarrate(fromEvent)) return fromEvent;
  if (ov) return ov;
  return fromEvent;
}
