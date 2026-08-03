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

const LATIN_WORD_ZH: Record<string, string> = {
  courage: '膽識',
  perception: '悟性',
  intelligence: '悟性',
  charisma: '魅力',
  strength: '根骨',
  agility: '身法',
  luck: '福緣',
  fame: '名望',
  honor: '名望',
  reputation: '名望',
  health: '氣血',
  fatigue: '疲勞',
  stress: '心神',
  calm: '內息',
  curiosity: '內息',
  wealth: '銀兩',
  coins: '銀兩',
  none: '……',
  undefined: '',
  null: '',
  true: '',
  false: '',
  invalid: '',
  object: '',
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
  return sanitizePlayerLine(raw) || CHOICE_FALLBACK[choiceId ?? ''] || '抉擇';
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
  let s = String(line ?? '').trim();
  if (!s) return '';
  if (/^none$/i.test(s)) return '……';
  // JS 物件誤印
  s = s.replace(/\[object Object\]/gi, '');
  s = s.replace(/\bundefined\b|\bnull\b|\bNaN\b|\btrue\b|\bfalse\b|\bNone\b/gi, '');
  // 技術 id
  s = s.replace(/\b(skill|gear|event|boss|flag|art|qg|qy|mv|item|memory|followup|acted|chose)_[a-z0-9_]+\b/gi, '');
  s = s.replace(/\b[a-z]+(?:_[a-z0-9]+)+\b/gi, (m) => CHOICE_FALLBACK[m] ?? '');
  // 括號內純英文（如 courage）
  s = s.replace(/[（(]\s*([a-z][a-z0-9_]*)\s*[）)]/gi, (_m, word: string) => {
    const zh = LATIN_WORD_ZH[word.toLowerCase()];
    return zh ? `（${zh}）` : '';
  });
  // 殘留拉丁詞替換或剔除
  s = s.replace(/\b([a-z]{2,})\b/gi, (m) => {
    const zh = LATIN_WORD_ZH[m.toLowerCase()];
    if (zh !== undefined) return zh;
    if (CHOICE_FALLBACK[m]) return CHOICE_FALLBACK[m];
    return '';
  });
  s = s.replace(/\s{2,}/g, ' ');
  s = s.replace(/[（(]\s*[）)]/g, '');
  s = s.replace(/[·…\s，、：:]+$/g, '').replace(/^[·…\s，、：:]+/g, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  // 整行若幾乎無中文且無數字符號，視為無效技術行
  if (s && !/[\u4e00-\u9fff0-9＋＋+\-－]/.test(s)) return '';
  return s;
}

const NATURE_MARK = /^([俠邪狂惡])([+＋\-－]+)$/;
const NUMERIC_DELTA = /^(.+?)([＋+]|[－-])(\d+)$/;

function formatMergedNumeric(label: string, total: number): string {
  if (!total) return '';
  if (total > 0) return `${label}＋${total}`;
  return `${label}${total}`; // 自帶負號，如 氣血-27
}

function formatMergedNature(attr: string, total: number): string {
  if (!total) return '';
  const mark = (total > 0 ? '+' : '-').repeat(Math.abs(total));
  return `${attr}${mark}`;
}

/**
 * 合併結果匣消長：同標籤數值加總、心性符號合併，完全相同字串去重。
 * 例：氣血-11、氣血-5、氣血-11 → 氣血-27；俠+++、俠++ → 俠+++++
 */
export function mergeDeltaLines(lines: string[]): string[] {
  const numeric = new Map<string, number>();
  const nature = new Map<string, number>();
  const other: string[] = [];
  const seenOther = new Set<string>();
  const labelOrder: string[] = [];
  const natureOrder: string[] = [];

  for (const raw of lines) {
    const line = String(raw ?? '').trim();
    if (!line) continue;

    const nat = NATURE_MARK.exec(line);
    if (nat) {
      const attr = nat[1]!;
      const marks = nat[2]!;
      let delta = 0;
      for (const ch of marks) {
        if (ch === '+' || ch === '＋') delta += 1;
        else delta -= 1;
      }
      if (!nature.has(attr)) natureOrder.push(attr);
      nature.set(attr, (nature.get(attr) ?? 0) + delta);
      continue;
    }

    const num = NUMERIC_DELTA.exec(line);
    if (num) {
      const label = num[1]!;
      const sign = num[2]!;
      const amount = Number(num[3]);
      const signed = sign === '＋' || sign === '+' ? amount : -amount;
      if (!numeric.has(label)) labelOrder.push(label);
      numeric.set(label, (numeric.get(label) ?? 0) + signed);
      continue;
    }

    if (!seenOther.has(line)) {
      seenOther.add(line);
      other.push(line);
    }
  }

  const out: string[] = [];
  for (const label of labelOrder) {
    const formatted = formatMergedNumeric(label, numeric.get(label) ?? 0);
    if (formatted) out.push(formatted);
  }
  for (const attr of natureOrder) {
    const formatted = formatMergedNature(attr, nature.get(attr) ?? 0);
    if (formatted) out.push(formatted);
  }
  out.push(...other);
  return out;
}

export function sanitizePlayerLines(lines: string[]): string[] {
  return mergeDeltaLines(lines.map(sanitizePlayerLine).filter((l) => l && l !== '……'));
}
