export type GearSlot = 'weapon' | 'armor' | 'accessory';
export type GearRarity = 'common' | 'fine' | 'rare' | 'epic' | 'divine';

export interface GearDef {
  id: string;
  name: string;
  slot: GearSlot;
  rarity: GearRarity;
  attack?: number;
  defense?: number;
  maxHpBonus?: number;
  maxQiBonus?: number;
  martialBonus?: number;
  description: string;
}

export const GEAR_CATALOG: GearDef[] = [
  {
    id: 'old-sword',
    name: '舊鐵劍',
    slot: 'weapon',
    rarity: 'common',
    attack: 4,
    description: '市井鐵匠的粗胚，勉強能防身。',
  },
  {
    id: 'plain-robe',
    name: '青布衣',
    slot: 'armor',
    rarity: 'common',
    defense: 2,
    description: '離家時母親縫好的衣裳。',
  },
  {
    id: 'iron-blade',
    name: '精鋼刀',
    slot: 'weapon',
    rarity: 'fine',
    attack: 10,
    martialBonus: 2,
    description: '刃口寒光隱現，適合行路。',
  },
  {
    id: 'pine-armor',
    name: '松紋皮甲',
    slot: 'armor',
    rarity: 'fine',
    defense: 8,
    maxHpBonus: 20,
    description: '輕便防身，不礙運氣。',
  },
  {
    id: 'cloud-boots',
    name: '踏雲靴',
    slot: 'accessory',
    rarity: 'rare',
    defense: 4,
    maxQiBonus: 15,
    description: '步履輕捷，似可踏雲。',
  },
  {
    id: 'jade-token',
    name: '青玉令',
    slot: 'accessory',
    rarity: 'rare',
    martialBonus: 5,
    maxQiBonus: 25,
    description: '門中信物，內息更穩。',
  },
  {
    id: 'inkrain-sword',
    name: '墨雨劍',
    slot: 'weapon',
    rarity: 'epic',
    attack: 22,
    martialBonus: 8,
    maxQiBonus: 20,
    description: '劍身如墨，雨夜出鞘更冷。',
  },
  {
    id: 'hundredfold-blade',
    name: '百煉百折刀',
    slot: 'weapon',
    rarity: 'epic',
    attack: 28,
    martialBonus: 10,
    maxHpBonus: 30,
    description: '百煉而成，刃口隱有折光。',
  },
  {
    id: 'divine-xuan-sword',
    name: '玄鐵重劍',
    slot: 'weapon',
    rarity: 'divine',
    attack: 48,
    martialBonus: 18,
    maxHpBonus: 60,
    maxQiBonus: 40,
    description: '神兵遺響，重若千鈞，唯有根骨深厚者可御。',
  },
  {
    id: 'divine-silk-armor',
    name: '金絲軟甲',
    slot: 'armor',
    rarity: 'divine',
    defense: 36,
    maxHpBonus: 100,
    maxQiBonus: 30,
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

export function rollForgeResult(rng: { nextFloat: () => number; chance: (p: number) => boolean }): string {
  const roll = rng.nextFloat();
  if (roll < 0.03) return 'divine-xuan-sword';
  if (roll < 0.06) return 'divine-silk-armor';
  if (roll < 0.09) return 'divine-moon-pendant';
  if (roll < 0.22) return 'hundredfold-blade';
  if (roll < 0.35) return 'inkrain-sword';
  if (roll < 0.55) return 'jade-token';
  if (roll < 0.7) return 'cloud-boots';
  if (roll < 0.85) return 'iron-blade';
  return 'pine-armor';
}

export function rollAdventureGear(rng: { nextFloat: () => number }): string | null {
  const roll = rng.nextFloat();
  if (roll < 0.02) return 'divine-xuan-sword';
  if (roll < 0.035) return 'divine-silk-armor';
  if (roll < 0.05) return 'divine-moon-pendant';
  if (roll < 0.12) return 'inkrain-sword';
  if (roll < 0.2) return 'hundredfold-blade';
  if (roll < 0.35) return 'jade-token';
  if (roll < 0.5) return 'cloud-boots';
  if (roll < 0.7) return 'iron-blade';
  return null;
}
