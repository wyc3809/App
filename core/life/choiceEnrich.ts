import type { EventChoice, EventOutcome, GameEffect, GameEvent } from '@interfaces/lifeEngine';

/** 選擇姿態：影響三分支權重（順遂／波折／事與願違） */
export type ChoiceStance = 'aggressive' | 'virtuous' | 'cunning' | 'cautious' | 'neutral';

const STANCE_WEIGHTS: Record<ChoiceStance, { fair: number; mixed: number; ill: number }> = {
  // 越衝動，好壞越難預料——背不出「標準答案」
  aggressive: { fair: 32, mixed: 33, ill: 35 },
  virtuous: { fair: 38, mixed: 37, ill: 25 },
  cunning: { fair: 36, mixed: 32, ill: 32 },
  cautious: { fair: 42, mixed: 38, ill: 20 },
  neutral: { fair: 38, mixed: 36, ill: 26 },
};

export function inferChoiceStance(text: string): ChoiceStance {
  const t = text;
  if (/戰|拼|衝|硬闖|拔刀|動手|對決|比武|殺|搶|上台|攀崖|夜探|突襲|破車|應戰|硬/.test(t)) {
    return 'aggressive';
  }
  if (/助|救|義|交還|調停|護送|施捨|代付|保護|勸|收留|溫柔|恭敬|組織|挺身|義務/.test(t)) {
    return 'virtuous';
  }
  if (/暗|偷|騙|賣|撈|佔|訛|私下|趁亂|易服|拆讀|假裝沒|封口|黑譜收下|邪/.test(t)) {
    return 'cunning';
  }
  if (/避|觀望|退去|不介入|離開|繞道|另尋|等待|默默|冷眼|婉拒|保持|抽身|只看|遠觀/.test(t)) {
    return 'cautious';
  }
  return 'neutral';
}

function cloneEffects(effects: GameEffect[]): GameEffect[] {
  return structuredClone(effects);
}

function isNumericGain(eff: GameEffect): boolean {
  if (eff.type === 'money' || eff.type === 'health' || eff.type === 'reputation' || eff.type === 'martial') {
    return eff.amount > 0;
  }
  if (eff.type === 'qi' || eff.type === 'maxQi' || eff.type === 'maxHealth') return eff.amount > 0;
  return false;
}

function isNumericLoss(eff: GameEffect): boolean {
  if (eff.type === 'money' || eff.type === 'health' || eff.type === 'reputation' || eff.type === 'martial') {
    return eff.amount < 0;
  }
  return false;
}

function scaleAmount(n: number, factor: number): number {
  if (!n) return 0;
  const scaled = Math.round(n * factor);
  if (scaled === 0) return n > 0 ? 1 : -1;
  return scaled;
}

function scaleEffects(effects: GameEffect[], factor: number): GameEffect[] {
  return effects.map((eff) => {
    if (
      eff.type === 'money' ||
      eff.type === 'health' ||
      eff.type === 'reputation' ||
      eff.type === 'martial' ||
      eff.type === 'qi' ||
      eff.type === 'maxQi' ||
      eff.type === 'maxHealth'
    ) {
      return { ...eff, amount: scaleAmount(eff.amount, factor) };
    }
    if (eff.type === 'nature' || eff.type === 'attr' || eff.type === 'world') {
      const delta: Record<string, number> = {};
      for (const [k, v] of Object.entries(eff.delta ?? {})) {
        if (typeof v === 'number') delta[k] = scaleAmount(v, factor);
      }
      return { ...eff, delta } as GameEffect;
    }
    return eff;
  });
}

function stripIrreversible(effects: GameEffect[]): GameEffect[] {
  return effects.filter(
    (e) =>
      e.type !== 'learnSkill' &&
      e.type !== 'joinSect' &&
      e.type !== 'leaveSect' &&
      e.type !== 'die' &&
      e.type !== 'lover' &&
      e.type !== 'grantGear' &&
      e.type !== 'practice',
  );
}

function narrateOnly(effects: GameEffect[]): GameEffect | undefined {
  return effects.find((e) => e.type === 'narrate');
}

function fairCost(stance: ChoiceStance): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -3 },
        { type: 'narrate', text: '雖大體順遂，皮肉仍擦破了一點——江湖事，很難全無代價。' },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -3 },
        { type: 'narrate', text: '事辦成了，口袋卻輕了些。好人常要先付一點銀兩與力氣。' },
      ];
    case 'cunning':
      return [
        { type: 'reputation', amount: -1 },
        { type: 'narrate', text: '便宜是佔到了，風評卻微微發澀。牆有耳，街有眼。' },
      ];
    case 'cautious':
      return [
        { type: 'martial', amount: 1 },
        { type: 'narrate', text: '你沒有深陷，只把利害看清。安全換來的，是慢半步的見識。' },
      ];
    default:
      return [{ type: 'narrate', text: '事情大致如你所願，只是過程並非全無波瀾。' }];
  }
}

function mixedExtras(stance: ChoiceStance): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -8 },
        { type: 'martial', amount: 1 },
        { type: 'narrate', text: '你佔了上風，也挨了實打。贏是贏了，氣息卻亂了半晌。' },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -8 },
        { type: 'reputation', amount: 1 },
        { type: 'health', amount: -3 },
        { type: 'narrate', text: '你幫到了人，自己卻貼了銀兩與力氣。善名在外，內裏有點發空。' },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: 6 },
        { type: 'reputation', amount: -2 },
        { type: 'nature', delta: { xie: 1 } },
        { type: 'narrate', text: '銀子進袋，閒話也跟進了巷口。得與失，往往同一夜抵達。' },
      ];
    case 'cautious':
      return [
        { type: 'attr', delta: { wuXing: 1 } },
        { type: 'money', amount: -2 },
        { type: 'narrate', text: '你避開鋒芒，也錯過一截機緣。人是安穩了，故事卻薄了。' },
      ];
    default:
      return [
        { type: 'health', amount: -4 },
        { type: 'money', amount: 3 },
        { type: 'narrate', text: '有得有失：銀錢或名望動了一寸，氣血也換了一寸。' },
      ];
  }
}

function illExtras(stance: ChoiceStance): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -12 },
        { type: 'money', amount: -6 },
        { type: 'martial', amount: 1 },
        { type: 'narrate', text: '這回踢到鐵板。銀錢與氣血都捱了打，卻也記牢對方路數——疼，也算學費。' },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -10 },
        { type: 'health', amount: -5 },
        { type: 'reputation', amount: 1 },
        { type: 'narrate', text: '好心沒換來圓滿，還貼了本。仍有人記得你伸過手——這點，算薄薄的回甘。' },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: -8 },
        { type: 'reputation', amount: -3 },
        { type: 'nature', delta: { e: 1 } },
        { type: 'attr', delta: { danShi: 1 } },
        { type: 'narrate', text: '算計落空，顏面與銀兩兩傷。唯一收穫，是往後出手更謹慎半分。' },
      ];
    case 'cautious':
      return [
        { type: 'reputation', amount: -1 },
        { type: 'attr', delta: { fuYuan: 1 } },
        { type: 'narrate', text: '你縮得太後，機緣從眼前走掉，有人笑你膽怯。你只當把命留下了。' },
      ];
    default:
      return [
        { type: 'health', amount: -9 },
        { type: 'money', amount: -5 },
        { type: 'martial', amount: 1 },
        { type: 'narrate', text: '事與願違：計畫散了，皮肉與錢袋都輕了。你嚥下教訓，再上路。' },
      ];
  }
}

function buildFairEffects(base: GameEffect[], stance: ChoiceStance): GameEffect[] {
  const core = scaleEffects(cloneEffects(base), 1);
  const costs = fairCost(stance);
  // 避免雙 narrate 疊太亂：若已有敘事，成本敘事仍保留（一主一輔）
  return [...core, ...costs.filter((e) => e.type !== 'narrate' || !narrateOnly(core))];
}

function buildMixedEffects(base: GameEffect[], stance: ChoiceStance): GameEffect[] {
  const safe = stripIrreversible(base);
  const gains = scaleEffects(
    safe.filter((e) => e.type === 'narrate' || isNumericGain(e) || e.type === 'nature' || e.type === 'attr' || e.type === 'world'),
    0.55,
  );
  const losses = scaleEffects(safe.filter(isNumericLoss), 1.1);
  return [...gains.filter((e) => e.type !== 'narrate'), ...losses, ...mixedExtras(stance)];
}

function buildIllEffects(base: GameEffect[], stance: ChoiceStance): GameEffect[] {
  const safe = stripIrreversible(base);
  // 把原本收益壓成代價感，並帶一點安慰獎
  const inverted = safe
    .filter((e) => e.type !== 'narrate')
    .map((eff) => {
      if (
        eff.type === 'money' ||
        eff.type === 'health' ||
        eff.type === 'reputation' ||
        eff.type === 'martial' ||
        eff.type === 'qi'
      ) {
        if (eff.amount > 0) return { ...eff, amount: -Math.max(2, Math.round(eff.amount * 0.6)) };
        if (eff.amount < 0) return { ...eff, amount: Math.round(eff.amount * 1.25) };
      }
      return eff;
    });
  return [...inverted, ...illExtras(stance)];
}

/**
 * 為單一選擇生成「順遂／波折／事與願違」三分支。
 * 每分支都按常理含正負取捨；權重依姿態浮動，難以背出唯一正解。
 */
export function enrichChoiceWithRisk(
  choice: EventChoice,
  _negative?: EventChoice['outcomes'][number]['effects'],
  _badChance = 0.18,
): EventChoice {
  const stance = inferChoiceStance(choice.text);
  const weights = STANCE_WEIGHTS[stance];
  const base = choice.outcomes[0]?.effects ?? [{ type: 'narrate' as const, text: '事畢。' }];

  const outcomes: EventOutcome[] = [
    {
      id: `${choice.id}_fair`,
      label: '順遂',
      weight: weights.fair,
      effects: buildFairEffects(base, stance),
    },
    {
      id: `${choice.id}_mixed`,
      label: '波折',
      weight: weights.mixed,
      effects: buildMixedEffects(base, stance),
    },
    {
      id: `${choice.id}_ill`,
      label: '事與願違',
      weight: weights.ill,
      effects: buildIllEffects(base, stance),
    },
  ];

  return { ...choice, outcomes };
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
  negativeFactory?: (
    choiceId: string,
    choiceText?: string,
  ) => EventChoice['outcomes'][number]['effects'],
  badChance = 0.18,
): GameEvent {
  const base = ensureThreeChoices(event);
  return {
    ...base,
    choices: base.choices.map((ch) => {
      // 若呼叫端仍傳 negativeFactory，將其併入 ill 兜底敘事（相容舊 API）
      const enriched = enrichChoiceWithRisk(ch, undefined, badChance);
      if (!negativeFactory) return enriched;
      const extra = negativeFactory(ch.id, ch.text);
      const ill = enriched.outcomes.find((o) => o.id?.endsWith('_ill'));
      if (ill && extra?.length) {
        const narr = extra.find((e) => e.type === 'narrate');
        if (narr) ill.effects = [...ill.effects.filter((e) => e.type !== 'narrate'), narr, ...extra.filter((e) => e.type !== 'narrate')];
      }
      return enriched;
    }),
  };
}

/** 結算時微抖數值，進一步避免「同一選擇永遠同一數字」 */
export function jitterEffectsForRoll(effects: GameEffect[], roll01: number): GameEffect[] {
  const factor = 0.82 + roll01 * 0.36; // ~0.82–1.18
  return scaleEffects(effects, factor).map((eff) => {
    if (eff.type === 'learnSkill' || eff.type === 'joinSect' || eff.type === 'die' || eff.type === 'flag') {
      return eff;
    }
    return eff;
  });
}
