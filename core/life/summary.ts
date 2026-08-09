import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeLabels, wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { skillDisplay } from './flavor';
import { getLifeStageLabel } from './stages';
import { deathCauseOf } from './death';
import { titleLabels } from './titles';
import { previewInheritanceMoney } from './family';
import { formatGenealogyText } from './genealogy';

function pickEpitaph(state: LifeGameState): string {
  const c = state.character;
  const titles = titleLabels(state);
  const cause = deathCauseOf(state) ?? '';
  const friends = Object.values(state.npcs ?? {}).filter((n) => (n.affinity ?? 0) >= 40).length;
  const foes = Object.values(state.npcs ?? {}).filter((n) => (n.affinity ?? 0) <= -20).length;

  if (/力竭|敗於|戰/.test(cause) && c.stats.combatsWon >= 5) {
    return '　　刃上有血，碑上有名。';
  }
  if (/無疾|年邁|體衰/.test(cause)) {
    return '　　燈盡席散，卷猶未冷。';
  }
  if (titles.includes('論劍客')) {
    return '　　華山風急，名字卻停在石上。';
  }
  if (titles.includes('刀疤客') || c.stats.combatsWon >= 12) {
    return '　　疤比字多，路比命長。';
  }
  if (c.sectId && state.sects[c.sectId] && Number(c.flags.sect_standing ?? 0) >= 2) {
    return `　　門牆記你一筆——${state.sects[c.sectId]!.name}舊人。`;
  }
  if (c.reputation >= 80) {
    return '　　江湖佳話，墨香不絕。';
  }
  if (c.martial >= 80) {
    return '　　一代宗師，劍氣如虹。';
  }
  if (c.stats.wealthPeak >= 500) {
    return '　　銀匣已空，帳本還在。';
  }
  if ((c.stats.lovers ?? 0) >= 1 && (c.family?.childrenNames?.length ?? 0) > 0) {
    return '　　情字難書，兒孫續墨。';
  }
  if ((c.stats.lovers ?? 0) >= 1) {
    return '　　情字難書，亦是傳奇。';
  }
  if (friends >= 3) {
    return '　　茶棚故人多，碑前不必哭。';
  }
  if (foes >= 2) {
    return '　　仇家未盡，青石已涼。';
  }
  if (Number(c.flags.legacy_generation ?? 1) > 2) {
    return '　　第幾世已不記得，名字卻還認得紙。';
  }
  if (c.age < 30) {
    return '　　路未走完，卷先合上。';
  }
  return '　　平凡一生，亦成一軸。';
}

export function buildLifeSummary(state: LifeGameState): string {
  const c = state.character;
  const stage = getLifeStageLabel(state);
  const cause = deathCauseOf(state);
  const gen = Number(c.flags.legacy_generation ?? 1);
  const titles = titleLabels(state);
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
  if (titles.length) {
    lines.push(`　　綽號：${titles.join('、')}`);
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
    `　　子女 ${c.childrenCount ?? 0}`,
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
  const heir =
    typeof c.flags.heir_name === 'string' && c.flags.heir_name
      ? String(c.flags.heir_name)
      : c.family?.childrenNames?.[0];
  if (heir) {
    lines.push(`　　【繼承人】${heir}`);
  }

  const carryBits: string[] = [];
  if (c.flags.family_legacy || (c.childrenCount ?? 0) > 0) carryBits.push('族規／血脈');
  if (c.flags.legacy_teacher) carryBits.push('傳功');
  if (c.flags.legacy_friend) carryBits.push('故人');
  if (carryBits.length) {
    lines.push('', `　　【可傳後世】${carryBits.join('、')}`);
  }
  if ((c.childrenCount ?? 0) > 0 || c.flags.family_legacy) {
    const coin = previewInheritanceMoney(state);
    if (coin > 0) {
      lines.push(`　　【來世可繼族產】約 ${coin} 兩（轉世時入匣）`);
    }
  }

  lines.push('', ...formatGenealogyText(state).map((l) => (l.startsWith('【') ? `　　${l}` : `　${l}`)));

  lines.push('', pickEpitaph(state), '', '　　（印）終');
  return lines.join('\n');
}
