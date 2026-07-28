import type { GameEvent, EventChoice } from '@interfaces/lifeEngine';
import packJson from '@data/events/jianghu_random_events_100.json';
import choiceBanks from '@data/events/packChoiceBanks.json';

type PackOutcome = {
  op?: string;
  path?: string;
  value?: unknown;
  chance?: number;
  note?: string;
};

type PackChoice = {
  id: string;
  text: string;
  outcomes?: PackOutcome[];
  result_text?: string | { success?: string; failure?: string };
};

type PackEvent = {
  id: string;
  title: string;
  category?: string;
  rarity?: string;
  weight?: number;
  summary?: string;
  description?: string;
  tags?: string[];
  conditions?: {
    min_age?: number | null;
    max_age?: number | null;
    forbidden_flags?: string[];
    required_flags?: string[];
  };
  choices?: PackChoice[];
};

type BankLane = { label: string; hint?: string; feedback?: string };

const banks = choiceBanks as Record<string, BankLane[][]>;

function rewriteChoiceText(event: PackEvent, index: number): { label: string; feedback?: string } {
  const eventNumber = Number((event.id ?? '0').replace(/\D/g, '')) || 0;
  const bank = banks[event.category ?? ''] ?? banks.default;
  const lane = bank?.[index] ?? bank?.[0] ?? [];
  const picked = lane[eventNumber % Math.max(1, lane.length)];
  if (!picked) return { label: event.choices?.[index]?.text ?? '觀望一時' };
  return { label: picked.label, feedback: picked.feedback };
}

function mapOutcomesToEffects(outcomes: PackOutcome[], feedback?: string) {
  const effects: GameEvent['choices'][number]['outcomes'][number]['effects'] = [];
  if (feedback) effects.push({ type: 'narrate', text: feedback });

  let money = 0;
  let health = 0;
  let reputation = 0;
  let martial = 0;

  for (const outcome of outcomes) {
    const op = outcome.op;
    const path = String(outcome.path ?? '');
    const value = Number(outcome.value ?? 0);
    if (op === 'create_memory') {
      effects.push({
        type: 'narrate',
        text: String(outcome.value || outcome.note || '你記下了一段江湖見聞。'),
      });
      continue;
    }
    if (op === 'add_item') {
      effects.push({ type: 'narrate', text: `獲得：${String(outcome.value || '江湖雜物')}` });
      continue;
    }
    if (op === 'set_flag') {
      const key = path || String(outcome.value || 'flag');
      effects.push({ type: 'flag', key, value: true });
      continue;
    }
    if (op !== 'add') continue;
    if (path.includes('wealth.coins')) money += value;
    else if (path.includes('reputation')) reputation += Math.sign(value) * Math.ceil(Math.abs(value) / 2);
    else if (path.includes('health.hp')) health += value;
    else if (path.includes('internal') || path.includes('qi')) martial += Math.ceil(Math.abs(value) / 4) * Math.sign(value || 1);
    else if (path.includes('attributes')) martial += Math.ceil(Math.abs(value) / 3) * Math.sign(value || 1);
    else if (path.includes('relationships')) reputation += Math.sign(value) * 1;
  }

  if (money) effects.push({ type: 'money', amount: money });
  if (health) effects.push({ type: 'health', amount: health });
  if (reputation) effects.push({ type: 'reputation', amount: reputation });
  if (martial) effects.push({ type: 'martial', amount: martial });
  if (effects.length === 0) effects.push({ type: 'narrate', text: '此事淡淡落幕。' });
  return effects;
}

export function convertPackEvent(source: PackEvent): GameEvent {
  const choices: EventChoice[] = (source.choices ?? []).slice(0, 4).map((item, index) => {
    const rewritten = rewriteChoiceText(source, index);
    const feedback =
      rewritten.feedback ||
      (typeof item.result_text === 'string'
        ? item.result_text
        : item.result_text?.success) ||
      undefined;
    return {
      id: item.id || `c${index + 1}`,
      text: rewritten.label,
      outcomes: [
        {
          effects: mapOutcomesToEffects(item.outcomes ?? [], feedback),
        },
      ],
    };
  });

  if (!choices.length) {
    choices.push({
      id: 'observe',
      text: '靜觀其變',
      outcomes: [{ effects: [{ type: 'narrate', text: '你沒有插手，只把經過記在心裡。' }] }],
    });
  }

  const cond = source.conditions ?? {};
  return {
    id: source.id,
    title: source.title,
    body: source.description || source.summary || source.title,
    tags: [...(source.tags ?? []), 'pack', 'special', source.category ?? 'world'].filter(Boolean),
    weight: Math.max(1, Number(source.weight ?? 10)),
    requirements: {
      minAge: cond.min_age ?? undefined,
      maxAge: cond.max_age ?? undefined,
      once: true,
      notFlags: (cond.forbidden_flags ?? []).map((f) => f.replace(/^completed_/, 'done_')),
    },
    choices,
  };
}

export function loadRandomEventPack(): GameEvent[] {
  const data = packJson as unknown as { events: PackEvent[] };
  return (data.events ?? []).map(convertPackEvent);
}

export const RANDOM_PACK_EVENTS: GameEvent[] = loadRandomEventPack();
