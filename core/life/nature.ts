import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import {
  natureKeys,
  natureLabels,
  type NatureAttr,
  type NatureGate,
  type NatureState,
} from '@interfaces/lifeEngine';

export function defaultNature(): NatureState {
  return { xia: 12, xie: 8, kuang: 10, e: 6 };
}

export function ensureNature(c: LifeCharacter): NatureState {
  if (!c.nature) c.nature = defaultNature();
  for (const k of natureKeys) {
    if (typeof c.nature[k] !== 'number') c.nature[k] = defaultNature()[k];
  }
  return c.nature;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/** 心性增量顯示：狂++、俠--（次數＝變化量） */
export function formatNatureDeltaMark(attr: NatureAttr, delta: number): string {
  if (!delta) return '';
  const mark = (delta > 0 ? '+' : '-').repeat(Math.abs(delta));
  return `${natureLabels[attr]}${mark}`;
}

export function applyNatureDelta(
  c: LifeCharacter,
  delta: Partial<Record<NatureAttr, number>>,
): string[] {
  const n = ensureNature(c);
  const lines: string[] = [];
  for (const k of natureKeys) {
    const d = delta[k];
    if (!d) continue;
    n[k] = clamp(n[k] + d, 0, 100);
    lines.push(formatNatureDeltaMark(k, d));
  }
  return lines;
}

/** 依選項文案推斷心性變化（事件選擇會影響俠／邪／狂／惡） */
export function inferNatureFromChoice(text: string): Partial<Record<NatureAttr, number>> {
  const t = text;
  const out: Partial<Record<NatureAttr, number>> = {};
  const bump = (k: NatureAttr, v: number) => {
    out[k] = (out[k] ?? 0) + v;
  };

  if (/助|救|義|讓|保護|護送|調停|交還|施捨|寄.*盤纏|拜謝|收留|勸|慈悲|行善/.test(t)) bump('xia', 2);
  if (/暗中|偷|騙|毒|陰謀|搶先|佔便宜|訛|欺瞞|栽贓|落井/.test(t)) bump('xie', 2);
  if (/戰|拼|衝|對決|比武|陪練|豪賭|放肆|硬闖|拔刀|動手|喝/.test(t)) bump('kuang', 2);
  if (/殺|搶|虐|威脅|勒索|滅口|欺壓|強奪|斬|害|落井下石/.test(t)) bump('e', 2);

  if (/避開|抽身|觀望|退去|不戰|改日|只看|默默|收起|暫時/.test(t)) {
    // 冷眼旁觀略抑俠、略抑狂
    if (!out.xia) bump('xia', -1);
  }
  if (/交還|助人|護送|調停/.test(t)) bump('e', -1);
  if (/搶|殺|威脅/.test(t)) bump('xia', -1);

  return out;
}

export function dominantNature(c: LifeCharacter): NatureAttr {
  const n = ensureNature(c);
  let best: NatureAttr = 'xia';
  let score = -1;
  for (const k of natureKeys) {
    if (n[k] > score) {
      score = n[k];
      best = k;
    }
  }
  return best;
}

export function natureSummary(c: LifeCharacter): string {
  const n = ensureNature(c);
  const dom = dominantNature(c);
  return `${natureLabels.xia}${n.xia} · ${natureLabels.xie}${n.xie} · ${natureLabels.kuang}${n.kuang} · ${natureLabels.e}${n.e}（偏「${natureLabels[dom]}」）`;
}

export function natureColorClass(k: NatureAttr): string {
  return `ink-nature ink-nature--${k}`;
}

export function meetsNatureGate(c: LifeCharacter, gate: NatureGate | undefined): boolean {
  if (!gate) return true;
  const n = ensureNature(c);
  if (gate.min) {
    for (const [k, v] of Object.entries(gate.min)) {
      if ((n[k as NatureAttr] ?? 0) < (v ?? 0)) return false;
    }
  }
  if (gate.max) {
    for (const [k, v] of Object.entries(gate.max)) {
      if ((n[k as NatureAttr] ?? 0) > (v ?? 0)) return false;
    }
  }
  return true;
}

export function natureGateHint(gate: NatureGate | undefined): string | null {
  if (!gate) return null;
  const bits: string[] = [];
  if (gate.min) {
    for (const [k, v] of Object.entries(gate.min)) {
      bits.push(`${natureLabels[k as NatureAttr]}≥${v}`);
    }
  }
  if (gate.max) {
    for (const [k, v] of Object.entries(gate.max)) {
      bits.push(`${natureLabels[k as NatureAttr]}≤${v}`);
    }
  }
  return bits.length ? `心性需：${bits.join('、')}` : null;
}

export function applyChoiceNature(state: LifeGameState, choiceText: string): string[] {
  const delta = inferNatureFromChoice(choiceText);
  if (!Object.keys(delta).length) return [];
  return applyNatureDelta(state.character, delta);
}
