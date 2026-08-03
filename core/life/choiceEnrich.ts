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

function fairCost(stance: ChoiceStance, choiceText: string): GameEffect[] {
  const act = choiceText.replace(/[。．！？!?、，,\s]/g, '') || '此舉';
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -3 },
        {
          type: 'narrate',
          text: `「${act}」大致得手：對方退了半步，你也擦破了皮肉。傷口不深，卻提醒你——贏，也要留力氣走夜路。`,
        },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -3 },
        {
          type: 'narrate',
          text: `你堅持「${act}」，事辦成了。櫃上少了幾兩銀作押／藥錢，換來的是對方親口吐出的關鍵一句。`,
        },
      ];
    case 'cunning':
      return [
        { type: 'reputation', amount: -1 },
        {
          type: 'narrate',
          text: `靠「${act}」你摸到了實利。巷口卻有人咬耳朵——便宜進袋，閒話也跟了一程。`,
        },
      ];
    case 'cautious':
      return [
        { type: 'martial', amount: 1 },
        {
          type: 'narrate',
          text: `你以「${act}」觀變，沒深陷局中。記下暗號與來去方向後抽身，拳腳雖未大進，眼力卻長了一寸。`,
        },
      ];
    default:
      return [
        {
          type: 'narrate',
          text: `「${act}」之後局面鬆動：你袖裡多了一紙可核對的抄件，過程雖有小波折，終究沒空手。`,
        },
      ];
  }
}

function mixedExtras(stance: ChoiceStance, choiceText: string): GameEffect[] {
  const act = choiceText.replace(/[。．！？!?、，,\s]/g, '') || '此舉';
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -8 },
        { type: 'martial', amount: 1 },
        {
          type: 'narrate',
          text: `硬來「${act}」：你逼出半句真話，肩頭也挨了實打。血滲衣襟，情報卻夠你跟到下一條巷。`,
        },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -8 },
        { type: 'reputation', amount: 1 },
        { type: 'health', amount: -3 },
        {
          type: 'narrate',
          text: `你為「${act}」貼了銀兩與力氣，人是護住了，自己卻空了一截。街坊開始記得你的面孔。`,
        },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: 6 },
        { type: 'reputation', amount: -2 },
        { type: 'nature', delta: { xie: 1 } },
        {
          type: 'narrate',
          text: `「${act}」讓銀子進袋，也讓一名跑堂盯上了你。天亮前你換了客棧，枕下仍壓着那半頁密帳。`,
        },
      ];
    case 'cautious':
      return [
        { type: 'attr', delta: { wuXing: 1 } },
        { type: 'money', amount: -2 },
        {
          type: 'narrate',
          text: `你以「${act}」避開鋒芒，也眼睜睜看機緣被捷足者取走。人安穩了，袖裡只多了兩句旁聽來的風聲。`,
        },
      ];
    default:
      return [
        { type: 'health', amount: -4 },
        { type: 'money', amount: 3 },
        {
          type: 'narrate',
          text: `「${act}」有得有失寫得很具體：你撿回三兩銀角，膝蓋卻青了一塊；名冊抄全了，最末一行卻被人撕走。`,
        },
      ];
  }
}

function illExtras(stance: ChoiceStance, choiceText: string): GameEffect[] {
  const act = choiceText.replace(/[。．！？!?、，,\s]/g, '') || '此舉';
  switch (stance) {
    case 'aggressive':
      return [
        { type: 'health', amount: -12 },
        { type: 'money', amount: -6 },
        { type: 'martial', amount: 1 },
        {
          type: 'narrate',
          text: `「${act}」踢到鐵板：後援從門後湧出，短棍砸肩，線索被抽走。你捂傷退入雨幕，只記住對方腕上的疤。`,
        },
      ];
    case 'virtuous':
      return [
        { type: 'money', amount: -10 },
        { type: 'health', amount: -5 },
        { type: 'reputation', amount: 1 },
        {
          type: 'narrate',
          text: `你執意「${act}」，人卻被劫走，差役還收了你一筆「滋事」銀。仍有街坊記得你伸過手——這點薄回甘，換不回失蹤的人。`,
        },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: -8 },
        { type: 'reputation', amount: -3 },
        { type: 'nature', delta: { e: 1 } },
        { type: 'attr', delta: { danShi: 1 } },
        {
          type: 'narrate',
          text: `「${act}」的局被看穿。密信落入敵手，你還被記上一筆欠債。唯一收穫：下次再不會信那名兩邊收錢的跑堂。`,
        },
      ];
    case 'cautious':
      return [
        { type: 'reputation', amount: -1 },
        { type: 'attr', delta: { fuYuan: 1 } },
        {
          type: 'narrate',
          text: `你把「${act}」做得太乾淨，關鍵時刻無人作證。事主被拖走時丟下一句：「早知不該信你。」你保住了命，也少了一截線。`,
        },
      ];
    default:
      return [
        { type: 'health', amount: -9 },
        { type: 'money', amount: -5 },
        { type: 'martial', amount: 1 },
        {
          type: 'narrate',
          text: `「${act}」功敗垂成：談判破裂，茶杯砸碎，名單缺了最關鍵一頁。你貼了醫藥錢出門，立誓下回先看清門後有沒有第二個人。`,
        },
      ];
  }
}

function buildFairEffects(base: GameEffect[], stance: ChoiceStance, choiceText: string): GameEffect[] {
  const core = scaleEffects(cloneEffects(base), 1);
  const costs = fairCost(stance, choiceText);
  // 避免雙 narrate 疊太亂：若已有敘事，成本敘事仍保留（一主一輔）
  return [...core, ...costs.filter((e) => e.type !== 'narrate' || !narrateOnly(core))];
}

function buildMixedEffects(base: GameEffect[], stance: ChoiceStance, choiceText: string): GameEffect[] {
  const safe = stripIrreversible(base);
  const gains = scaleEffects(
    safe.filter((e) => e.type === 'narrate' || isNumericGain(e) || e.type === 'nature' || e.type === 'attr' || e.type === 'world'),
    0.55,
  );
  const losses = scaleEffects(safe.filter(isNumericLoss), 1.1);
  return [...gains.filter((e) => e.type !== 'narrate'), ...losses, ...mixedExtras(stance, choiceText)];
}

function buildIllEffects(base: GameEffect[], stance: ChoiceStance, choiceText: string): GameEffect[] {
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
  return [...inverted, ...illExtras(stance, choiceText)];
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
      effects: buildFairEffects(base, stance, choice.text),
    },
    {
      id: `${choice.id}_mixed`,
      label: '波折',
      weight: weights.mixed,
      effects: buildMixedEffects(base, stance, choice.text),
    },
    {
      id: `${choice.id}_ill`,
      label: '事與願違',
      weight: weights.ill,
      effects: buildIllEffects(base, stance, choice.text),
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
