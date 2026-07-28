import type { LifeCharacter, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import {
  ADVANCE_CHANCE,
  ensureSkillRanks,
  grantSkillRank,
  rankName,
} from './martialRanks';
import { skillLabel } from '@data/skills/catalog';

/** 定性描述：氣血／內力／財帛／名望／疲勞／五維／天下 */
export function vitalHealthLabel(c: LifeCharacter): string {
  const r = c.health / Math.max(1, c.maxHealth);
  if (r > 0.85) return '氣血充盈';
  if (r > 0.6) return '氣色尚可';
  if (r > 0.35) return '氣血虧損';
  if (r > 0.15) return '氣息奄奄';
  return '命懸一線';
}

export function vitalQiLabel(c: LifeCharacter): string {
  const r = (c.qi ?? 0) / Math.max(1, c.maxQi ?? 1);
  if (r > 0.85) return '內息悠長';
  if (r > 0.55) return '內力平穩';
  if (r > 0.3) return '內息不足';
  return '真氣枯竭';
}

export function moneyLabel(n: number): string {
  if (n < 10) return '囊中羞澀';
  if (n < 40) return '僅夠盤纏';
  if (n < 120) return '尚可度日';
  if (n < 300) return '略有積蓄';
  if (n < 800) return '家資殷實';
  return '富甲一方';
}

export function reputationLabel(n: number): string {
  if (n < 5) return '籍籍無名';
  if (n < 20) return '略有微名';
  if (n < 50) return '聲名漸起';
  if (n < 100) return '名動一方';
  return '威震江湖';
}

export function fatigueLabel(n: number): string {
  if (n < 20) return '精神飽滿';
  if (n < 45) return '略感疲憊';
  if (n < 70) return '身心勞頓';
  return '力竭難支';
}

export function attrLabel(n: number): string {
  if (n < 25) return '薄弱';
  if (n < 45) return '平常';
  if (n < 65) return '不俗';
  if (n < 80) return '出眾';
  return '卓絕';
}

export function worldTone(n: number, kind: 'order' | 'danger' | 'economy' | 'rumors'): string {
  if (kind === 'order') {
    if (n >= 70) return '海晏河清';
    if (n >= 45) return '秩序尚存';
    if (n >= 25) return '綱紀鬆弛';
    return '亂象四起';
  }
  if (kind === 'danger') {
    if (n >= 70) return '刀光密布';
    if (n >= 45) return '風波隱現';
    if (n >= 25) return '大致平穩';
    return '太平無事';
  }
  if (kind === 'economy') {
    if (n >= 70) return '市面繁榮';
    if (n >= 45) return '買賣尚可';
    if (n >= 25) return '民生拮据';
    return '百業凋敝';
  }
  if (n >= 70) return '流言如潮';
  if (n >= 45) return '傳聞紛紜';
  if (n >= 25) return '偶有耳語';
  return '風平浪靜';
}

export function overallMartialLabel(c: LifeCharacter): string {
  const ranks = Object.values(ensureSkillRanks(c.skillRanks));
  if (!ranks.length) return '尚未入門';
  const best = Math.max(...ranks);
  return rankName(best);
}

export function skillDisplay(c: LifeCharacter, skillId: string): string {
  const ranks = ensureSkillRanks(c.skillRanks);
  const r = ranks[skillId] ?? 0;
  return `${skillLabel(skillId)} · ${rankName(r)}`;
}

/** 結果／日誌去數值化 */
export function mystifyLine(line: string): string {
  let s = line;
  s = s.replace(/[＋+\-]?\d+(\.\d+)?%?/g, '');
  s = s.replace(/（現\s*）/g, '');
  s = s.replace(/（上限\s*）/g, '');
  s = s.replace(/銀兩[＋+\-]*/g, '財帛有變·');
  s = s.replace(/氣血[＋+\-]*/g, '氣血有變·');
  s = s.replace(/名望[＋+\-]*/g, '名望有變·');
  s = s.replace(/武學[＋+\-]*/g, '武學有感·');
  s = s.replace(/內息[＋+\-]*/g, '內息有變·');
  s = s.replace(/內力上限[＋+\-]*/g, '內力境界有進·');
  s = s.replace(/氣血上限[＋+\-]*/g, '體魄有進·');
  s = s.replace(/疲勞[＋+\-]*/g, '疲態更甚·');
  s = s.replace(/·+/g, '·').replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/^[·\s]+|[·\s]+$/g, '');
  if (!s || /^[·\s]*$/.test(s)) return '事態悄然推移。';
  return s;
}

export function mystifyLines(lines: string[]): string[] {
  return lines.map(mystifyLine).filter(Boolean);
}

export function deltaMoney(amount: number): string {
  if (amount > 20) return '獲了一筆盤纏';
  if (amount > 0) return '略有進項';
  if (amount < -20) return '破費不小';
  if (amount < 0) return '破費了一些';
  return '';
}

export function deltaHealth(amount: number): string {
  if (amount > 15) return '氣色大好';
  if (amount > 0) return '略有恢復';
  if (amount < -20) return '受傷不輕';
  if (amount < 0) return '吃了些虧';
  return '';
}

export function deltaRep(amount: number): string {
  if (amount > 0) return '名聲稍振';
  if (amount < 0) return '名譽受損';
  return '';
}

/**
 * 修煉／實戰嘗試進階某一武學（後台百分比，成功才回報文言）
 */
export function tryAdvanceSkill(
  state: LifeGameState,
  skillId: string,
  source: 'practice' | 'combat',
): string | null {
  const c = state.character;
  c.skillRanks = ensureSkillRanks(c.skillRanks);
  grantSkillRank(c.skillRanks, skillId);
  const rank = c.skillRanks[skillId] ?? 0;
  if (rank >= 3) return null;
  const chance = ADVANCE_CHANCE[source][rank] ?? 0;
  const rng = getRng();
  if (!rng.chance(chance)) return null;
  c.skillRanks[skillId] = rank + 1;
  c.martial += 2 + rank;
  const name = skillLabel(skillId);
  const next = rankName(rank + 1);
  return `「${name}」進境至「${next}」。`;
}

/** 對已學武學隨機挑一門嘗試進階 */
export function tryAdvanceRandomSkill(
  state: LifeGameState,
  source: 'practice' | 'combat',
): string | null {
  const c = state.character;
  const list = c.skills.filter((id) => id && id !== '基礎吐納');
  const pool = list.length ? list : c.skills;
  if (!pool.length) return null;
  const rng = getRng();
  return tryAdvanceSkill(state, rng.pick(pool), source);
}

export function learnMartialArt(state: LifeGameState, skillId: string, displayName?: string): string {
  const c = state.character;
  c.skillRanks = ensureSkillRanks(c.skillRanks);
  if (!c.skills.includes(skillId)) c.skills.push(skillId);
  grantSkillRank(c.skillRanks, skillId, 0);
  const label = displayName ?? skillLabel(skillId);
  return `習得「${label}」，階位「${rankName(0)}」。`;
}

export const ATTR_FEEL: Record<WuxiaAttribute, string> = {
  genGu: '根骨',
  wuXing: '悟性',
  fuYuan: '福緣',
  meiLi: '魅力',
  danShi: '膽識',
};
