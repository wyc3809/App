import type { GearDef, GearRarity } from './catalog';
import { WEAPON_KIND_LABEL, rarityLabel } from './catalog';

/** Diablo 式詞條行：底材／魔法詞／傳奇獨有 */
export type GearAffixTier = 'base' | 'magic' | 'legendary';

export type GearAffixLine = {
  tier: GearAffixTier;
  /** 詞綴名（可空，底材常無專名） */
  name?: string;
  text: string;
};

const pct = (n: number) => `${Math.round(n * 100)}%`;

export const RARITY_SHORT: Record<GearRarity, string> = {
  common: '凡',
  fine: '良',
  rare: '珍',
  epic: '絕',
  divine: '神',
};

export const SLOT_LABEL = {
  weapon: '兵刃',
  armor: '護體',
  accessory: '佩飾',
} as const;

/** 將裝備拆成底材屬性＋魔法詞條（展示用） */
export function listGearAffixes(def: GearDef): GearAffixLine[] {
  const lines: GearAffixLine[] = [];
  if (def.attack) lines.push({ tier: 'base', text: `威＋${def.attack}` });
  if (def.defense) lines.push({ tier: 'base', text: `禦＋${def.defense}` });
  if (def.maxHpBonus) lines.push({ tier: 'base', text: `氣血上限＋${def.maxHpBonus}` });
  if (def.maxQiBonus) lines.push({ tier: 'base', text: `內息上限＋${def.maxQiBonus}` });
  if (def.martialBonus) lines.push({ tier: 'base', text: `武學＋${def.martialBonus}` });

  const c = def.combat;
  if (c?.hitBonus) lines.push({ tier: 'magic', name: '準心', text: `命中＋${pct(c.hitBonus)}` });
  if (c?.evasion) lines.push({ tier: 'magic', name: '流雲', text: `身法＋${pct(c.evasion)}` });
  if (c?.reflect) lines.push({ tier: 'magic', name: '反震', text: `反彈${pct(c.reflect)}` });
  if (c?.pierce) lines.push({ tier: 'magic', name: '破甲', text: `破防${pct(c.pierce)}` });
  if (c?.lifesteal) lines.push({ tier: 'magic', name: '吞血', text: `吸血${pct(c.lifesteal)}` });
  if (c?.bleedChance) lines.push({ tier: 'magic', name: '見血', text: `出血${pct(c.bleedChance)}` });

  if (def.rarity === 'epic' || def.rarity === 'divine') {
    const magicCount = lines.filter((l) => l.tier === 'magic').length;
    if (magicCount >= 2) {
      lines.push({
        tier: 'legendary',
        name: def.rarity === 'divine' ? '神鑄' : '奇兵',
        text: def.rarity === 'divine' ? '氣機非凡，似有靈性' : '江湖罕見之造',
      });
    }
  }
  return lines;
}

/** Diablo 式前綴：取首條魔法詞名（凡品無前綴） */
export function gearMagicPrefix(def: GearDef): string | undefined {
  if (def.rarity === 'common') return undefined;
  return listGearAffixes(def).find((l) => l.tier === 'magic' && l.name)?.name;
}

/** 展示名：準心·舊鐵劍／墨雨劍 */
export function displayGearName(def: GearDef): string {
  const prefix = gearMagicPrefix(def);
  if (!prefix || def.rarity === 'epic' || def.rarity === 'divine') return def.name;
  return `${prefix}·${def.name}`;
}

export function gearTitleBits(def: GearDef): string {
  const bits = [rarityLabel[def.rarity]];
  if (def.weaponKind) bits.push(WEAPON_KIND_LABEL[def.weaponKind]);
  return bits.join(' · ');
}

export function formatAffixDisplay(line: GearAffixLine): string {
  return line.name ? `${line.name}：${line.text}` : line.text;
}

export function summarizeAffixTotals(lines: {
  attack: number;
  defense: number;
  maxHpBonus: number;
  maxQiBonus: number;
  martialBonus: number;
  hitBonus: number;
  evasion: number;
  reflect: number;
  pierce: number;
  lifesteal: number;
  bleedChance: number;
}): string[] {
  return [
    lines.attack ? `威＋${lines.attack}` : '',
    lines.defense ? `禦＋${lines.defense}` : '',
    lines.maxHpBonus ? `氣血＋${lines.maxHpBonus}` : '',
    lines.maxQiBonus ? `內息＋${lines.maxQiBonus}` : '',
    lines.martialBonus ? `武學＋${lines.martialBonus}` : '',
    lines.hitBonus ? `準＋${Math.round(lines.hitBonus * 100)}%` : '',
    lines.evasion ? `身法＋${Math.round(lines.evasion * 100)}%` : '',
    lines.reflect ? `反震${Math.round(lines.reflect * 100)}%` : '',
    lines.pierce ? `破甲${Math.round(lines.pierce * 100)}%` : '',
    lines.lifesteal ? `吞血${Math.round(lines.lifesteal * 100)}%` : '',
    lines.bleedChance ? `見血${Math.round(lines.bleedChance * 100)}%` : '',
  ].filter(Boolean);
}
