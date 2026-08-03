import type { EventChoice, EventOutcome, GameEffect, GameEvent } from '@interfaces/lifeEngine';

/** 選擇姿態：影響三分支權重（順遂／波折／事與願違） */
export type ChoiceStance = 'aggressive' | 'virtuous' | 'cunning' | 'cautious' | 'neutral';

/** 場景調性：決定風險分支敘事與傷害量級，避免打坐寫成抄件談判 */
export type SceneTone = 'practice' | 'combat' | 'social';

const STANCE_WEIGHTS: Record<ChoiceStance, { fair: number; mixed: number; ill: number }> = {
  // 越衝動，好壞越難預料——背不出「標準答案」
  aggressive: { fair: 34, mixed: 36, ill: 30 },
  virtuous: { fair: 40, mixed: 38, ill: 22 },
  cunning: { fair: 38, mixed: 34, ill: 28 },
  cautious: { fair: 44, mixed: 38, ill: 18 },
  neutral: { fair: 40, mixed: 38, ill: 22 },
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
  if (/避|觀望|退去|不介入|離開|繞道|另尋|等待|默默|冷眼|婉拒|保持|抽身|只看|遠觀|改日|歇手|休息/.test(t)) {
    return 'cautious';
  }
  return 'neutral';
}

export function inferSceneTone(base: GameEffect[], choiceText: string, eventTags: string[] = []): SceneTone {
  if (
    eventTags.includes('practice_wander') ||
    base.some((e) => e.type === 'practice') ||
    /運功|打坐|苦練|淬體|鍛造|尋訪|修煉|調息|樁功|藥浴|開爐|靜室/.test(choiceText)
  ) {
    return 'practice';
  }
  if (
    eventTags.includes('combat') ||
    eventTags.includes('boss') ||
    eventTags.includes('road') ||
    /戰|刀|殺|對決|比武|拔刀|動手|應戰|突襲/.test(choiceText)
  ) {
    return 'combat';
  }
  return 'social';
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

function hasPractice(effects: GameEffect[]): boolean {
  return effects.some((e) => e.type === 'practice');
}

function narrateOnly(effects: GameEffect[]): GameEffect | undefined {
  return effects.find((e) => e.type === 'narrate');
}

function actLabel(choiceText: string): string {
  return choiceText.replace(/[。．！？!?、，,\s]/g, '') || '此舉';
}

/** 修煉／鍛造／尋訪：敘事貼合本業，氣血代價遠低於江湖衝突 */
function practiceFair(act: string): GameEffect[] {
  return [
    {
      type: 'narrate',
      text: `「${act}」時氣息漸穩：窗外風聲遠了，你把心神收回丹田，這一輪總算沒白費。`,
    },
  ];
}

function practiceMixed(act: string): GameEffect[] {
  return [
    { type: 'qi', amount: -4 },
    {
      type: 'narrate',
      text: `「${act}」做到半途，雜念一閃，內息略滯。你及時收功，進境打了折扣，卻未傷到根本。`,
    },
  ];
}

function practiceIll(act: string): GameEffect[] {
  return [
    { type: 'health', amount: -3 },
    { type: 'qi', amount: -8 },
    {
      type: 'narrate',
      text: `「${act}」岔了半步：氣機逆湧，胸口發悶。你連忙散功躺平，今日修為未進，倒先討了場虛驚。`,
    },
  ];
}

function combatFair(act: string): GameEffect[] {
  return [
    { type: 'health', amount: -2 },
    {
      type: 'narrate',
      text: `「${act}」大致得手：對方退了半步，你也擦破了皮肉。傷口不深，卻提醒你——贏，也要留力氣走夜路。`,
    },
  ];
}

function combatMixed(act: string): GameEffect[] {
  return [
    { type: 'health', amount: -5 },
    { type: 'martial', amount: 1 },
    {
      type: 'narrate',
      text: `硬來「${act}」：你逼出半句真話，肩頭也挨了實打。血滲衣襟，情報卻夠你跟到下一條巷。`,
    },
  ];
}

function combatIll(act: string): GameEffect[] {
  return [
    { type: 'health', amount: -8 },
    { type: 'money', amount: -4 },
    {
      type: 'narrate',
      text: `「${act}」踢到鐵板：後援從門後湧出，短棍砸肩，線索被抽走。你捂傷退入雨幕，只記住對方腕上的疤。`,
    },
  ];
}

function socialFair(stance: ChoiceStance, act: string): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return combatFair(act);
    case 'virtuous':
      return [
        { type: 'money', amount: -2 },
        {
          type: 'narrate',
          text: `你堅持「${act}」，事辦成了。櫃上少了兩許銀作押，換來對方親口吐出的關鍵一句。`,
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
        {
          type: 'narrate',
          text: `你以「${act}」觀變，沒深陷局中。記下來去方向後抽身，眼力長了一寸。`,
        },
      ];
    default:
      return [
        {
          type: 'narrate',
          text: `「${act}」之後局面鬆動：你把該問的問清、該記的記下，過程雖有小波折，終究沒空手。`,
        },
      ];
  }
}

function socialMixed(stance: ChoiceStance, act: string): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return combatMixed(act);
    case 'virtuous':
      return [
        { type: 'money', amount: -5 },
        { type: 'reputation', amount: 1 },
        {
          type: 'narrate',
          text: `你為「${act}」貼了銀兩與力氣，人是護住了，自己卻空了一截。街坊開始記得你的面孔。`,
        },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: 4 },
        { type: 'reputation', amount: -1 },
        {
          type: 'narrate',
          text: `「${act}」讓銀子進袋，也讓一名跑堂盯上了你。天亮前你換了客棧，枕下仍壓着那半頁密帳。`,
        },
      ];
    case 'cautious':
      return [
        { type: 'attr', delta: { wuXing: 1 } },
        {
          type: 'narrate',
          text: `你以「${act}」避開鋒芒，也眼睜睜看機緣被捷足者取走。人安穩了，袖裡只多了兩句旁聽來的風聲。`,
        },
      ];
    default:
      return [
        { type: 'money', amount: 2 },
        {
          type: 'narrate',
          text: `「${act}」有得有失：你問到半截真話，關鍵一句卻被人岔開；銀錢未怎麼動，心神倒費了不少。`,
        },
      ];
  }
}

function socialIll(stance: ChoiceStance, act: string): GameEffect[] {
  switch (stance) {
    case 'aggressive':
      return combatIll(act);
    case 'virtuous':
      return [
        { type: 'money', amount: -6 },
        { type: 'reputation', amount: 1 },
        {
          type: 'narrate',
          text: `你執意「${act}」，人卻被劫走，差役還收了你一筆「滋事」銀。仍有街坊記得你伸過手——這點薄回甘，換不回失蹤的人。`,
        },
      ];
    case 'cunning':
      return [
        { type: 'money', amount: -5 },
        { type: 'reputation', amount: -2 },
        { type: 'attr', delta: { danShi: 1 } },
        {
          type: 'narrate',
          text: `「${act}」的局被看穿。密信落入敵手，你還被記上一筆欠債。唯一收穫：下次再不會信那名兩邊收錢的跑堂。`,
        },
      ];
    case 'cautious':
      return [
        { type: 'reputation', amount: -1 },
        {
          type: 'narrate',
          text: `你把「${act}」做得太乾淨，關鍵時刻無人作證。事主被拖走時丟下一句：「早知不該信你。」你保住了命，也少了一截線。`,
        },
      ];
    default:
      return [
        { type: 'health', amount: -4 },
        { type: 'money', amount: -3 },
        {
          type: 'narrate',
          text: `「${act}」功敗垂成：話不投機，場面冷了，你想要的消息也沒問着。貼了點醫藥與腳力錢出門，立誓下回先看清門後有沒有第二個人。`,
        },
      ];
  }
}

function fairCost(stance: ChoiceStance, choiceText: string, tone: SceneTone): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceFair(act);
  if (tone === 'combat') return combatFair(act);
  return socialFair(stance, act);
}

function mixedExtras(stance: ChoiceStance, choiceText: string, tone: SceneTone): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceMixed(act);
  if (tone === 'combat') return combatMixed(act);
  return socialMixed(stance, act);
}

function illExtras(stance: ChoiceStance, choiceText: string, tone: SceneTone): GameEffect[] {
  const act = actLabel(choiceText);
  if (tone === 'practice') return practiceIll(act);
  if (tone === 'combat') return combatIll(act);
  return socialIll(stance, act);
}

function buildFairEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
): GameEffect[] {
  const core = scaleEffects(cloneEffects(base), 1);
  const costs = fairCost(stance, choiceText, tone);
  // 已有敘事／修煉效果時，只疊數值代價，唔再硬塞第二段跑題正文
  const skipNarrate = Boolean(narrateOnly(core) || hasPractice(core));
  return [...core, ...costs.filter((e) => e.type !== 'narrate' || !skipNarrate)];
}

function buildMixedEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
): GameEffect[] {
  // 修煉機緣：保留半成修煉效果，另加貼題小波折，唔改寫成市井衝突
  if (tone === 'practice' && hasPractice(base)) {
    const practice = base.filter((e) => e.type === 'practice');
    const extras = mixedExtras(stance, choiceText, tone);
    return [...practice, ...extras];
  }
  const safe = stripIrreversible(base);
  const gains = scaleEffects(
    safe.filter((e) => e.type === 'narrate' || isNumericGain(e) || e.type === 'nature' || e.type === 'attr' || e.type === 'world'),
    0.55,
  );
  const losses = scaleEffects(safe.filter(isNumericLoss), 1.05);
  return [...gains.filter((e) => e.type !== 'narrate'), ...losses, ...mixedExtras(stance, choiceText, tone)];
}

function buildIllEffects(
  base: GameEffect[],
  stance: ChoiceStance,
  choiceText: string,
  tone: SceneTone,
): GameEffect[] {
  // 修煉事與願違：唔執行本次修煉，只留岔氣代價（貼題）
  if (tone === 'practice' && hasPractice(base)) {
    return illExtras(stance, choiceText, tone);
  }
  const safe = stripIrreversible(base);
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
        if (eff.amount > 0) return { ...eff, amount: -Math.max(1, Math.round(eff.amount * 0.45)) };
        if (eff.amount < 0) return { ...eff, amount: Math.round(eff.amount * 1.1) };
      }
      return eff;
    });
  return [...inverted, ...illExtras(stance, choiceText, tone)];
}

/**
 * 為單一選擇生成「順遂／波折／事與願違」三分支。
 * 每分支都按常理含正負取捨；權重依姿態浮動，難以背出唯一正解。
 */
export function enrichChoiceWithRisk(
  choice: EventChoice,
  _negative?: EventChoice['outcomes'][number]['effects'],
  _badChance = 0.18,
  eventTags: string[] = [],
): EventChoice {
  const stance = inferChoiceStance(choice.text);
  const weights = STANCE_WEIGHTS[stance];
  const base = choice.outcomes[0]?.effects ?? [{ type: 'narrate' as const, text: '事畢。' }];
  const tone = inferSceneTone(base, choice.text, eventTags);

  const outcomes: EventOutcome[] = [
    {
      id: `${choice.id}_fair`,
      label: '順遂',
      weight: weights.fair,
      effects: buildFairEffects(base, stance, choice.text, tone),
    },
    {
      id: `${choice.id}_mixed`,
      label: '波折',
      weight: weights.mixed,
      effects: buildMixedEffects(base, stance, choice.text, tone),
    },
    {
      id: `${choice.id}_ill`,
      label: '事與願違',
      weight: weights.ill,
      effects: buildIllEffects(base, stance, choice.text, tone),
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
  const tags = event.tags ?? [];
  return {
    ...base,
    choices: base.choices.map((ch) => {
      const enriched = enrichChoiceWithRisk(ch, undefined, badChance, tags);
      if (!negativeFactory) return enriched;
      const extra = negativeFactory(ch.id, ch.text);
      const ill = enriched.outcomes.find((o) => o.id?.endsWith('_ill'));
      if (ill && extra?.length) {
        const tone = inferSceneTone(ch.outcomes[0]?.effects ?? [], ch.text, tags);
        // 修煉事件：negativeFactory 常帶市井打架敘事，改用貼題 ill，只吸收其非敘事數值並壓低
        if (tone === 'practice') {
          const softNums = extra
            .filter((e) => e.type !== 'narrate')
            .map((e) => {
              if (e.type === 'health' && e.amount < 0) {
                return { ...e, amount: Math.max(e.amount, -4) };
              }
              if (e.type === 'money' && e.amount < 0) {
                return { ...e, amount: Math.max(e.amount, -3) };
              }
              return e;
            });
          ill.effects = [...illExtras(inferChoiceStance(ch.text), ch.text, tone), ...softNums];
          return enriched;
        }
        const narr = extra.find((e) => e.type === 'narrate');
        if (narr) {
          ill.effects = [
            ...ill.effects.filter((e) => e.type !== 'narrate'),
            narr,
            ...extra.filter((e) => e.type !== 'narrate'),
          ];
        }
      }
      return enriched;
    }),
  };
}

/** 結算時微抖數值，進一步避免「同一選擇永遠同一數字」 */
export function jitterEffectsForRoll(effects: GameEffect[], roll01: number): GameEffect[] {
  const factor = 0.88 + roll01 * 0.24; // ~0.88–1.12（比舊 0.82–1.18 溫和）
  return scaleEffects(effects, factor).map((eff) => {
    if (eff.type === 'learnSkill' || eff.type === 'joinSect' || eff.type === 'die' || eff.type === 'flag') {
      return eff;
    }
    // 氣血傷害額外封頂，避免微抖把小傷打成致命
    if (eff.type === 'health' && eff.amount < 0) {
      return { ...eff, amount: Math.max(eff.amount, -12) };
    }
    return eff;
  });
}
