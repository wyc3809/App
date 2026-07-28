import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { GEAR_CATALOG, getGearDef, type GearDef, type GearSlot } from '@data/equipment/catalog';

export function emptyEquipment(): Record<GearSlot, string | null> {
  return { weapon: 'old-sword', armor: 'plain-robe', accessory: null };
}

export function ensureGear(c: LifeCharacter): void {
  if (!c.gear) c.gear = ['old-sword', 'plain-robe'];
  if (!c.equipment) c.equipment = emptyEquipment();
}

export function grantGear(state: LifeGameState, gearId: string): string | null {
  const def = getGearDef(gearId);
  if (!def) return null;
  const c = state.character;
  ensureGear(c);
  if (!c.gear.includes(gearId)) c.gear.push(gearId);
  return def.name;
}

export function equipGear(state: LifeGameState, gearId: string): string {
  const def = getGearDef(gearId);
  if (!def) return '無此裝備。';
  const c = state.character;
  ensureGear(c);
  if (!c.gear.includes(gearId)) return '你尚未擁有此物。';
  c.equipment[def.slot] = gearId;
  recomputeCapBonuses(c);
  return `已裝備「${def.name}」。`;
}

export function equippedDefs(c: LifeCharacter): GearDef[] {
  ensureGear(c);
  return Object.values(c.equipment)
    .filter(Boolean)
    .map((id) => getGearDef(id!))
    .filter((d): d is GearDef => Boolean(d));
}

export function gearTotals(c: LifeCharacter): {
  attack: number;
  defense: number;
  maxHpBonus: number;
  maxQiBonus: number;
  martialBonus: number;
} {
  const defs = equippedDefs(c);
  return defs.reduce(
    (acc, d) => ({
      attack: acc.attack + (d.attack ?? 0),
      defense: acc.defense + (d.defense ?? 0),
      maxHpBonus: acc.maxHpBonus + (d.maxHpBonus ?? 0),
      maxQiBonus: acc.maxQiBonus + (d.maxQiBonus ?? 0),
      martialBonus: acc.martialBonus + (d.martialBonus ?? 0),
    }),
    { attack: 0, defense: 0, maxHpBonus: 0, maxQiBonus: 0, martialBonus: 0 },
  );
}

/** 將裝備上限加成回寫到角色（與基礎上限分開記在 flags） */
export function recomputeCapBonuses(c: LifeCharacter): void {
  ensureGear(c);
  const baseHp = Number(c.flags.baseMaxHp ?? c.maxHealth);
  const baseQi = Number(c.flags.baseMaxQi ?? c.maxQi);
  c.flags.baseMaxHp = baseHp;
  c.flags.baseMaxQi = baseQi;
  const t = gearTotals(c);
  c.maxHealth = baseHp + t.maxHpBonus;
  c.maxQi = baseQi + t.maxQiBonus;
  if (c.health > c.maxHealth) c.health = c.maxHealth;
  if (c.qi > c.maxQi) c.qi = c.maxQi;
}

export function raiseBaseMaxHp(c: LifeCharacter, amount: number): void {
  ensureGear(c);
  const base = Number(c.flags.baseMaxHp ?? c.maxHealth);
  c.flags.baseMaxHp = base + amount;
  recomputeCapBonuses(c);
  c.health = Math.min(c.maxHealth, c.health + amount);
}

export function raiseBaseMaxQi(c: LifeCharacter, amount: number): void {
  ensureGear(c);
  const base = Number(c.flags.baseMaxQi ?? c.maxQi);
  c.flags.baseMaxQi = base + amount;
  recomputeCapBonuses(c);
  c.qi = Math.min(c.maxQi, c.qi + amount);
}

export function listOwnedGear(): typeof GEAR_CATALOG {
  return GEAR_CATALOG;
}
