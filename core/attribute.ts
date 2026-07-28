import type {
  AttributeComponent,
  AttributeModifier,
  DerivedStats,
} from '@interfaces/game';

export const TRAIT_KEYS = [
  'honesty',
  'kindness',
  'justice',
  'discipline',
  'ambition',
  'greed',
  'courage',
  'curiosity',
  'patience',
  'compassion',
  'aggression',
  'confidence',
  'pride',
  'humility',
  'loyalty',
  'independence',
  'mercy',
  'cruelty',
  'faith',
  'honor',
  'responsibility',
  'creativity',
  'emotionalStability',
  'optimism',
] as const;

export type TraitKey = (typeof TRAIT_KEYS)[number];

const EMPTY: AttributeComponent = {
  strength: 0,
  agility: 0,
  constitution: 0,
  intelligence: 0,
  spirit: 0,
  perception: 0,
  willpower: 0,
  luck: 0,
};

function sumComponents(...parts: Partial<AttributeComponent>[]): AttributeComponent {
  const out = { ...EMPTY };
  for (const p of parts) {
    for (const k of Object.keys(out) as (keyof AttributeComponent)[]) {
      out[k] += p[k] ?? 0;
    }
  }
  return out;
}

export function getBaseAttributes(
  base: AttributeComponent,
  modifiers: AttributeModifier[],
  currentTick: number,
): AttributeComponent {
  const active = modifiers.filter(
    (m) => m.expiresAtTick === undefined || m.expiresAtTick > currentTick,
  );
  const growth = sumComponents(
    ...active.filter((m) => m.layer === 'growth').map((m) => m.deltas),
  );
  const permanent = sumComponents(
    ...active.filter((m) => m.layer === 'permanent').map((m) => m.deltas),
  );
  return sumComponents(base, growth, permanent);
}

export function getFinalAttributes(
  base: AttributeComponent,
  modifiers: AttributeModifier[],
  currentTick: number,
  age: number,
): AttributeComponent {
  const active = modifiers.filter(
    (m) => m.expiresAtTick === undefined || m.expiresAtTick > currentTick,
  );
  const layers = active.map((m) => m.deltas);
  let final = sumComponents(base, ...layers);

  if (age > 40) {
    final.strength -= Math.min(30, (age - 40) * 0.3);
  }
  if (age > 60) {
    final.constitution -= Math.min(25, (age - 60) * 0.4);
    final.intelligence += Math.min(15, (age - 60) * 0.15);
    final.spirit += Math.min(15, (age - 60) * 0.12);
  }

  for (const k of Object.keys(final) as (keyof AttributeComponent)[]) {
    final[k] = Math.max(1, Math.round(final[k]));
  }
  return final;
}

export function computeDerived(
  attrs: AttributeComponent,
  level: number,
  martialSkill: number,
  internalSkill: number,
  weaponBonus: number,
  armorBonus: number,
): DerivedStats {
  const maxHp = Math.round(100 + attrs.constitution * 12 + level * 8 + armorBonus * 2);
  const maxMp = Math.round(50 + attrs.spirit * 15 + internalSkill * 3);
  const stamina = Math.round(80 + attrs.constitution * 10 + attrs.willpower * 3);
  const attack = Math.round(weaponBonus + attrs.strength * 2.5 + martialSkill * 0.5);
  const qiAttack = Math.round(attrs.spirit * 3 + internalSkill + martialSkill * 0.3);
  const defense = Math.round(armorBonus + attrs.constitution * 1.5 + martialSkill * 0.2);
  const dodge = Math.round(attrs.agility * 2 + martialSkill * 0.15);
  const accuracy = Math.round(attrs.perception * 1.5 + martialSkill * 0.25);
  const critChance = Math.min(95, 2 + attrs.agility * 0.12);
  const moveSpeed = Math.round(100 + attrs.agility * 0.15);
  const carryKg = Math.round(attrs.strength * 4);
  const learning = Math.round(attrs.intelligence + attrs.spirit);
  const recovery = Math.round(attrs.constitution);

  return {
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    stamina,
    attack,
    qiAttack,
    defense,
    dodge,
    accuracy,
    critChance,
    moveSpeed,
    carryKg,
    learning,
    recovery,
  };
}

export function applyModifier(
  modifiers: AttributeModifier[],
  mod: AttributeModifier,
): AttributeModifier[] {
  return [...modifiers.filter((m) => m.id !== mod.id), mod];
}

export function removeModifier(modifiers: AttributeModifier[], id: string): AttributeModifier[] {
  return modifiers.filter((m) => m.id !== id);
}
