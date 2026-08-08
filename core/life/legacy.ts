import type { LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';

/** 前世可帶入來世的墨跡（非付費、非碾壓） */
export interface LegacyCarry {
  generation: number;
  ancestorName: string;
  ancestorAge: number;
  ancestorMartial: number;
  ancestorReputation: number;
  ancestorWealthPeak: number;
  familyLegacy: boolean;
  teacherLegacy: boolean;
  birthplace?: string;
  friendNpcId?: string;
  rivalHint?: string;
  gearHint?: string;
  titleHints?: string[];
}

export function extractLegacy(state: LifeGameState): LegacyCarry {
  const c = state.character;
  const gen = Math.max(1, Number(c.flags.legacy_generation ?? 1));
  const friendNpcId =
    typeof c.flags.legacy_friend === 'string'
      ? c.flags.legacy_friend
      : Object.values(state.npcs ?? {})
          .filter((n) => n.alive && (n.affinity ?? 0) >= 45)
          .sort((a, b) => (b.affinity ?? 0) - (a.affinity ?? 0))[0]?.id;
  const rival =
    Object.values(state.npcs ?? {})
      .filter((n) => (n.affinity ?? 0) <= -25)
      .sort((a, b) => (a.affinity ?? 0) - (b.affinity ?? 0))[0]?.name ??
    (c.flags.aftermath_blood_foe ? String(c.flags.aftermath_blood_foe) : undefined);
  const equipped =
    c.equipment?.weapon || c.equipment?.armor || c.equipment?.accessory || undefined;
  const titleIds =
    typeof c.flags.titles === 'string'
      ? c.flags.titles.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
  return {
    generation: gen,
    ancestorName: c.name,
    ancestorAge: c.age,
    ancestorMartial: c.martial,
    ancestorReputation: c.reputation,
    ancestorWealthPeak: c.stats.wealthPeak,
    familyLegacy: Boolean(c.flags.family_legacy),
    teacherLegacy: Boolean(c.flags.legacy_teacher),
    birthplace: c.birthplace,
    friendNpcId,
    rivalHint: rival,
    gearHint: equipped || undefined,
    titleHints: titleIds.slice(0, 3),
  };
}

export function applyLegacyToCharacter(
  state: LifeGameState,
  legacy: LegacyCarry,
): string[] {
  const c = state.character;
  const lines: string[] = [];
  const gen = legacy.generation + 1;
  c.flags.legacy_generation = gen;
  c.flags.legacy_ancestor = legacy.ancestorName;
  lines.push(
    `前世「${legacy.ancestorName}」享年 ${legacy.ancestorAge}，此為第 ${gen} 世入江湖。`,
  );

  // 軟繼承：取前世武學／名望的一小截，避免碾壓
  const martialBonus = Math.min(12, Math.floor(legacy.ancestorMartial * 0.08));
  if (martialBonus > 0) {
    c.martial += martialBonus;
    lines.push(`祖輩拳腳殘影：武學＋${martialBonus}`);
  }

  if (legacy.familyLegacy) {
    const coin = Math.min(80, 25 + Math.floor(legacy.ancestorWealthPeak * 0.05));
    c.money += coin;
    c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
    c.flags.born_with_family_legacy = true;
    const key: WuxiaAttribute = 'fuYuan';
    c.attributes[key] = Math.min(100, c.attributes[key] + 4);
    lines.push(`族規尚在，開局銀兩＋${coin}，福緣略厚。`);
  }

  if (legacy.teacherLegacy) {
    c.flags.born_with_teacher_legacy = true;
    for (const k of wuxiaAttributeKeys) {
      if (k === 'wuXing' || k === 'genGu') {
        c.attributes[k] = Math.min(100, c.attributes[k] + 3);
      }
    }
    for (const id of c.skills) {
      c.skillProgress[id] = (c.skillProgress[id] ?? 0) + 3;
    }
    lines.push('前世傳功餘韻：根骨悟性略增，武學進度有苗頭。');
  }

  if (legacy.birthplace) {
    c.flags.legacy_birthplace = legacy.birthplace;
    c.birthplace = c.birthplace || legacy.birthplace;
    lines.push(`族譜上仍寫着故鄉「${legacy.birthplace}」。`);
  }

  if (legacy.friendNpcId) {
    c.flags.born_with_friend_hint = legacy.friendNpcId;
    lines.push('夢裡有人拱手：「來世若還撞見，記得喊一聲。」');
  }

  if (legacy.rivalHint) {
    c.flags.born_with_rival_hint = legacy.rivalHint;
    lines.push(`枕邊似有舊怨低語——「${legacy.rivalHint}」三字未散。`);
  }

  if (legacy.gearHint) {
    c.flags.born_with_gear_dream = legacy.gearHint;
    lines.push('你夢見一把舊兵刃靠牆，醒來掌心還有涼意。');
  }

  if (legacy.titleHints?.length) {
    c.flags.legacy_title_echo = legacy.titleHints[0];
    lines.push('鎮上老人念叨着前世某個綽號，笑你聽不懂。');
  }

  if (
    !legacy.familyLegacy &&
    !legacy.teacherLegacy &&
    martialBonus <= 0 &&
    !legacy.friendNpcId &&
    !legacy.rivalHint
  ) {
    lines.push('前世平凡，來世仍是白紙——但年譜裡留著那個名字。');
  }

  return lines;
}
