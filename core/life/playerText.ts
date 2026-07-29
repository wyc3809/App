import { skillLabel, getSkillDef } from '@data/skills/catalog';

/** 玩家可見文案：過濾占位英文、技術 id */
const CHOICE_FALLBACK: Record<string, string> = {
  accept: '應允',
  study: '鑽研',
  copy: '抄錄',
  leave: '離去',
  refuse: '婉拒',
  fight: '應戰',
  fight_kill: '取命',
  flee: '避戰',
  draw: '拔劍',
  listen: '默記',
  ask: '追問',
  ignore: '不睬',
  mark: '記下',
  warn: '轉告',
  seek: '尋訪',
  pray: '合十',
  avoid: '避開',
  ready: '備戰',
  scout: '探聽',
  note: '記下',
  buy: '購置',
  coin: '問訊',
  learn: '習練',
  chase: '追問',
  talk: '試探',
  pay: '拋銀',
  wine: '陪飲',
  bluff: '虛張',
  trap: '伺機',
  yell: '呼叫',
  imitate: '摹習',
  greet: '請安',
  burn: '焚棄',
  watch: '觀望',
  delay: '暫退',
  run: '抽身',
};

export function displayChoiceText(text: string | undefined, choiceId?: string): string {
  const raw = (text ?? '').trim();
  if (!raw || /^none$/i.test(raw) || /^undefined$/i.test(raw) || /^null$/i.test(raw)) {
    return CHOICE_FALLBACK[choiceId ?? ''] ?? '抉擇';
  }
  // 純技術 id（含底線或純拉丁）
  if (/^[a-z][a-z0-9_-]*$/i.test(raw) && !/[\u4e00-\u9fff]/.test(raw)) {
    return CHOICE_FALLBACK[choiceId ?? ''] ?? CHOICE_FALLBACK[raw] ?? '抉擇';
  }
  return raw;
}

export function displaySkillName(skillId: string, displayName?: string): string {
  const name = (displayName ?? '').trim();
  if (name && /[\u4e00-\u9fff]/.test(name)) return name;
  if (name && !/^[a-z][a-z0-9_-]*$/i.test(name)) return name;
  const labeled = skillLabel(skillId);
  if (labeled && /[\u4e00-\u9fff]/.test(labeled)) return labeled;
  const def = getSkillDef(skillId);
  return def?.name ?? '無名功法';
}

/** 過濾結果匣／年譜中誤入的英文技術字串 */
export function sanitizePlayerLine(line: string): string {
  let s = line.trim();
  if (!s) return '';
  if (/^none$/i.test(s)) return '……';
  s = s.replace(/\b(undefined|null|NaN|true|false|None)\b/gi, '');
  s = s.replace(/\b(skill|gear|event|boss|flag|art|qg|qy|mv)_[a-z0-9_]+\b/gi, '……');
  s = s.replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/gi, (m) => (CHOICE_FALLBACK[m] ? CHOICE_FALLBACK[m] : '……'));
  s = s.replace(/\s{2,}/g, ' ').trim();
  s = s.replace(/^[·…\s]+|[·…\s]+$/g, '').trim();
  return s || '……';
}

export function sanitizePlayerLines(lines: string[]): string[] {
  return lines.map(sanitizePlayerLine).filter((l) => l && l !== '……');
}
