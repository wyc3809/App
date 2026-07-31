export type GearSlot = 'weapon' | 'armor' | 'accessory';
export type GearRarity = 'common' | 'fine' | 'rare' | 'epic' | 'divine';
export type WeaponKind = 'sword' | 'blade' | 'spear' | 'staff' | 'whip' | 'bow' | 'hidden';

/** 裝備戰鬥特效（與 attack/defense 等基礎數值並存） */
export interface GearCombatBonus {
  hitBonus?: number;
  evasion?: number;
  reflect?: number;
  pierce?: number;
  lifesteal?: number;
  bleedChance?: number;
}

export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  /** 兵器種類（僅武器槽） */
  weaponKind?: WeaponKind;
  attack?: number;
  defense?: number;
  maxHpBonus?: number;
  maxQiBonus?: number;
  martialBonus?: number;
  combat?: GearCombatBonus;
  description: string;
}

export const WEAPON_KIND_LABEL: Record<WeaponKind, string> = {
  sword: '劍',
  blade: '刀',
  spear: '槍',
  staff: '杖',
  whip: '鞭',
  bow: '弓',
  hidden: '暗器',
};

export const GEAR_CATALOG: GearDef[] = [
  {
    id: 'old-sword',
    name: '舊鐵劍',
    slot: 'weapon',
    rarity: 'common',
    weaponKind: 'sword',
    attack: 4,
    combat: { hitBonus: 0.02 },
    description: '市井鐵匠的粗胚，勉強能防身。',
  },
  {
    id: 'plain-robe',
    name: '青布衣',
    slot: 'armor',
    rarity: 'common',
    defense: 2,
    combat: { evasion: 0.01 },
    description: '離家時母親縫好的衣裳。',
  },
  {
    id: 'iron-blade',
    name: '精鋼刀',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'blade',
    attack: 10,
    martialBonus: 2,
    combat: { pierce: 0.05 },
    description: '刃口寒光隱現，適合行路。',
  },
  {
    id: 'pine-armor',
    name: '松紋皮甲',
    slot: 'armor',
    rarity: 'fine',
    defense: 8,
    maxHpBonus: 20,
    combat: { reflect: 0.04 },
    description: '輕便防身，不礙運氣。',
  },
  {
    id: 'cloud-boots',
    name: '踏雲靴',
    slot: 'accessory',
    rarity: 'rare',
    defense: 4,
    maxQiBonus: 15,
    combat: { evasion: 0.05 },
    description: '步履輕捷，似可踏雲。',
  },
  {
    id: 'jade-token',
    name: '青玉令',
    slot: 'accessory',
    rarity: 'rare',
    martialBonus: 5,
    maxQiBonus: 25,
    combat: { hitBonus: 0.04 },
    description: '門中信物，內息更穩。',
  },
  {
    id: 'inkrain-sword',
    name: '墨雨劍',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'sword',
    attack: 22,
    martialBonus: 8,
    maxQiBonus: 20,
    combat: { pierce: 0.08, hitBonus: 0.03 },
    description: '劍身如墨，雨夜出鞘更冷。',
  },
  {
    id: 'hundredfold-blade',
    name: '百煉百折刀',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'blade',
    attack: 28,
    martialBonus: 10,
    maxHpBonus: 30,
    combat: { lifesteal: 0.06 },
    description: '百煉而成，刃口隱有折光。',
  },
  {
    id: 'divine-xuan-sword',
    name: '玄鐵重劍',
    slot: 'weapon',
    rarity: 'divine',
    weaponKind: 'sword',
    attack: 48,
    martialBonus: 18,
    maxHpBonus: 60,
    maxQiBonus: 40,
    combat: { pierce: 0.12, hitBonus: 0.06 },
    description: '神兵遺響，重若千鈞，唯有根骨深厚者可御。',
  },
  {
    id: 'bronze-spear',
    name: '青銅槍',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'spear',
    attack: 11,
    martialBonus: 1,
    combat: { pierce: 0.06 },
    description: '槍尖沉穩，進退有度，江湖行腳常見。',
  },
  {
    id: 'crescent-blade',
    name: '月牙彎刀',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'blade',
    attack: 16,
    martialBonus: 4,
    combat: { bleedChance: 0.12 },
    description: '刀弧如月，擅取側翼。',
  },
  {
    id: 'pine-staff',
    name: '鐵頭竹杖',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'staff',
    attack: 8,
    defense: 3,
    martialBonus: 2,
    combat: { reflect: 0.03 },
    description: '杖法入門，攻守兼備。',
  },
  {
    id: 'meteor-whip',
    name: '流星軟鞭',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'whip',
    attack: 14,
    martialBonus: 5,
    maxQiBonus: 10,
    combat: { hitBonus: 0.08 },
    description: '鞭影連綿，遠近皆宜。',
  },
  {
    id: 'hunter-bow',
    name: '獵弓',
    slot: 'weapon',
    rarity: 'fine',
    weaponKind: 'bow',
    attack: 9,
    martialBonus: 3,
    combat: { hitBonus: 0.1 },
    description: '弓弦緊繃，百步穿楊需日課。',
  },
  {
    id: 'sleeve-darts',
    name: '袖裡飛針',
    slot: 'weapon',
    rarity: 'rare',
    weaponKind: 'hidden',
    attack: 12,
    martialBonus: 6,
    combat: { bleedChance: 0.15 },
    description: '暗器無形，出手須留三分。',
  },
  {
    id: 'twin-hooks',
    name: '鴛鴦雙鉤',
    slot: 'weapon',
    rarity: 'epic',
    weaponKind: 'blade',
    attack: 24,
    martialBonus: 9,
    combat: { pierce: 0.1, hitBonus: 0.04 },
    description: '雙鉤相扣，專破兵刃格擋。',
  },
  {
    id: 'divine-silk-armor',
    name: '金絲軟甲',
    slot: 'armor',
    rarity: 'divine',
    defense: 36,
    maxHpBonus: 100,
    maxQiBonus: 30,
    combat: { reflect: 0.08, evasion: 0.03 },
    description: '柔若無物，刀槍難入，傳聞出自奇人秘造。',
  },
  {
    id: 'divine-moon-pendant',
    name: '寒月心佩',
    slot: 'accessory',
    rarity: 'divine',
    martialBonus: 15,
    maxQiBonus: 80,
    defense: 8,
    combat: { hitBonus: 0.08, evasion: 0.04 },
    description: '佩之則內息如潮，夜觀星斗似有所悟。',
  },
];

export const rarityLabel: Record<GearRarity, string> = {
  common: '凡品',
  fine: '良品',
  rare: '珍品',
  epic: '絕品',
  divine: '神兵',
};

export function getGearDef(id: string): GearDef | undefined {
  return GEAR_CATALOG.find((g) => g.id === id);
}

const pct = (n: number) => `${Math.round(n * 100)}%`;

/** 披掛基礎一行（威／禦／氣血／內息／武學） */
export function formatGearStatLine(def: GearDef): string {
  const parts: string[] = [];
  if (def.attack) parts.push(`威＋${def.attack}`);
  if (def.defense) parts.push(`禦＋${def.defense}`);
  if (def.maxHpBonus) parts.push(`氣血＋${def.maxHpBonus}`);
  if (def.maxQiBonus) parts.push(`內息＋${def.maxQiBonus}`);
  if (def.martialBonus) parts.push(`武學＋${def.martialBonus}`);
  return parts.join(' · ');
}

/** 披掛交手特效一行 */
export function formatGearCombatLine(def: GearDef): string {
  const c = def.combat;
  if (!c) return '';
  const parts: string[] = [];
  if (c.hitBonus) parts.push(`準＋${pct(c.hitBonus)}`);
  if (c.evasion) parts.push(`身法＋${pct(c.evasion)}`);
  if (c.reflect) parts.push(`反震${pct(c.reflect)}`);
  if (c.pierce) parts.push(`破甲${pct(c.pierce)}`);
  if (c.lifesteal) parts.push(`吸敵氣血${pct(c.lifesteal)}`);
  if (c.bleedChance) parts.push(`見血${pct(c.bleedChance)}`);
  return parts.length ? `特效：${parts.join('、')}` : '';
}

export function formatGearFullSummary(def: GearDef): string {
  const base = formatGearStatLine(def);
  const fx = formatGearCombatLine(def);
  if (base && fx) return `${base} — ${fx}`;
  return base || fx || def.description;
}

export function rollForgeResult(
  rng: { nextFloat: () => number; chance: (p: number) => boolean },
  opts?: { age?: number; martial?: number },
): string {
  const age = opts?.age ?? 20;
  const martial = opts?.martial ?? 10;
  // 年輕／武淺：神兵幾乎無；年長武深：絕品／神兵機率上升（整體已調低）
  const tier = Math.min(1, Math.max(0, (age - 18) / 40 + martial / 120));
  const roll = rng.nextFloat();
  const divineGate = 0.002 + tier * 0.018;
  const epicGate = divineGate + 0.03 + tier * 0.05;
  const rareGate = epicGate + 0.08 + tier * 0.05;
  if (roll < divineGate * 0.34) return 'divine-xuan-sword';
  if (roll < divineGate * 0.67) return 'divine-silk-armor';
  if (roll < divineGate) return 'divine-moon-pendant';
  if (roll < epicGate * 0.4) return 'hundredfold-blade';
  if (roll < epicGate * 0.7) return 'inkrain-sword';
  if (roll < epicGate) return 'twin-hooks';
  if (roll < rareGate * 0.35) return 'jade-token';
  if (roll < rareGate * 0.55) return 'meteor-whip';
  if (roll < rareGate * 0.75) return 'crescent-blade';
  if (roll < rareGate) return 'sleeve-darts';
  if (roll < rareGate + 0.1) return 'cloud-boots';
  if (roll < rareGate + 0.22) return 'iron-blade';
  if (roll < rareGate + 0.34) return 'bronze-spear';
  if (roll < rareGate + 0.44) return 'hunter-bow';
  if (roll < rareGate + 0.54) return 'pine-staff';
  if (roll < rareGate + 0.7) return 'pine-armor';
  return 'old-sword';
}

export function rollAdventureGear(rng: { nextFloat: () => number }): string | null {
  const roll = rng.nextFloat();
  if (roll < 0.02) return 'divine-xuan-sword';
  if (roll < 0.035) return 'divine-silk-armor';
  if (roll < 0.05) return 'divine-moon-pendant';
  if (roll < 0.1) return 'twin-hooks';
  if (roll < 0.14) return 'inkrain-sword';
  if (roll < 0.2) return 'hundredfold-blade';
  if (roll < 0.28) return 'sleeve-darts';
  if (roll < 0.35) return 'jade-token';
  if (roll < 0.42) return 'meteor-whip';
  if (roll < 0.5) return 'cloud-boots';
  if (roll < 0.62) return 'crescent-blade';
  if (roll < 0.72) return 'iron-blade';
  if (roll < 0.82) return 'bronze-spear';
  if (roll < 0.9) return 'hunter-bow';
  return null;
}
