import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeLabels, wuxiaAttributeKeys } from '@interfaces/lifeEngine';

export function buildLifeSummary(state: LifeGameState): string {
  const c = state.character;
  const lines: string[] = [
    '—— 人生總結 ——',
    `${c.name}，享年 ${c.age} 歲（${state.year}年）`,
    '',
    '【屬性】',
    ...wuxiaAttributeKeys.map((k) => `${wuxiaAttributeLabels[k]} ${c.attributes[k]}`),
    '',
    `武學 ${c.martial} · 名望 ${c.reputation} · 財富峰值 ${c.stats.wealthPeak} 兩`,
    `閱歷事件 ${c.stats.eventsSeen} · 決鬥 ${c.stats.combats}（勝 ${c.stats.combatsWon}）`,
    `姻緣 ${c.stats.lovers}`,
  ];

  if (c.skills.length) {
    lines.push('', '【武功】', c.skills.join('、'));
  }
  if (c.sectId && state.sects[c.sectId]) {
    lines.push('', `【門派】${state.sects[c.sectId].name}`);
  }
  if (c.loverId && state.npcs[c.loverId]) {
    lines.push(`【眷屬】${state.npcs[c.loverId].name}`);
  }

  const epitaph =
    c.reputation >= 80
      ? '江湖佳話，人人稱頌。'
      : c.martial >= 80
        ? '一代宗師，武道通神。'
        : c.stats.wealthPeak >= 500
          ? '富甲一方，卻難逃生死。'
          : c.stats.lovers >= 1
            ? '兒女情長，亦是一段傳奇。'
            : '平凡一生，亦是江湖。';

  lines.push('', epitaph);
  return lines.join('\n');
}
