import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeLabels, wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { skillDisplay } from './flavor';
import { getLifeStageLabel } from './stages';
import { deathCauseOf } from './death';

export function buildLifeSummary(state: LifeGameState): string {
  const c = state.character;
  const stage = getLifeStageLabel(state);
  const cause = deathCauseOf(state);
  const gen = Number(c.flags.legacy_generation ?? 1);
  const lines: string[] = [
    '　　——　墓誌　——',
    '',
    `　　${c.name}`,
    `　　享年 ${c.age} 歲 · ${stage}`,
    `　　卒於 ${state.year} 年${state.month ? `${state.month} 月` : ''}`,
  ];

  if (cause) {
    lines.push(`　　死因：${cause}`);
  }
  if (gen > 1 || c.flags.legacy_ancestor) {
    lines.push(`　　第 ${gen} 世${c.flags.legacy_ancestor ? ` · 承自「${c.flags.legacy_ancestor}」` : ''}`);
  }

  lines.push(
    '',
    '　　【五維】',
    ...wuxiaAttributeKeys.map(
      (k) => `　　${wuxiaAttributeLabels[k]}　${c.attributes[k]}`,
    ),
    '',
    `　　武學 ${c.martial}　·　名望 ${c.reputation}`,
    `　　財富峰值 ${c.stats.wealthPeak} 兩`,
    `　　閱事 ${c.stats.eventsSeen}　·　決鬥 ${c.stats.combats}（勝 ${c.stats.combatsWon}）`,
    `　　姻緣 ${c.stats.lovers}`,
    `　　子女 ${c.childrenCount ?? 0}/${c.childrenMax ?? 0}`,
    `　　心性 俠${c.nature?.xia ?? 0} · 邪${c.nature?.xie ?? 0} · 狂${c.nature?.kuang ?? 0} · 惡${c.nature?.e ?? 0}`,
  );

  if (c.skills.length) {
    const skillLine = c.skills.map((id) => skillDisplay(c, id)).join('、');
    lines.push('', '　　【武功】', `　　${skillLine}`);
  }
  if (c.sectId && state.sects[c.sectId]) {
    lines.push('', `　　【門派】${state.sects[c.sectId].name}`);
  }
  if (c.loverId && state.npcs[c.loverId]) {
    lines.push(`　　【眷屬】${state.npcs[c.loverId].name}`);
  }
  if (c.family?.childrenNames?.length) {
    lines.push(`　　【子女】${c.family.childrenNames.join('、')}`);
  }

  const carryBits: string[] = [];
  if (c.flags.family_legacy) carryBits.push('族規');
  if (c.flags.legacy_teacher) carryBits.push('傳功');
  if (carryBits.length) {
    lines.push('', `　　【可傳後世】${carryBits.join('、')}`);
  }

  const epitaph =
    c.reputation >= 80
      ? '　　江湖佳話，墨香不絕。'
      : c.martial >= 80
        ? '　　一代宗師，劍氣如虹。'
        : c.stats.wealthPeak >= 500
          ? '　　富甲一方，終難逃生死。'
          : c.stats.lovers >= 1
            ? '　　情字難書，亦是傳奇。'
            : '　　平凡一生，亦成一軸。';

  lines.push('', epitaph, '', '　　（印）終');
  return lines.join('\n');
}
