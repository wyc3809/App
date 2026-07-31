import type { LifeCharacter, LifeGameState } from '@interfaces/lifeEngine';
import { GEAR_CATALOG, getGearDef, type GearCombatBonus, type GearDef, type GearSlot } from '@data/equipment/catalog';

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

export type AggregatedGearCombat = Required<{
  [K in keyof GearCombatBonus]: number;
}>;

function emptyCombatAgg(): AggregatedGearCombat {
  return {
    hitBonus: 0,
    evasion: 0,
    reflect: 0,
    pierce: 0,
    lifesteal: 0,
    bleedChance: 0,
  };
}

function addCombat(
  acc: AggregatedGearCombat,
  bonus: GearCombatBonus | undefined,
  weaponOnly: boolean,
  isWeapon: boolean,
): void {
  if (!bonus) return;
  if (bonus.hitBonus) acc.hitBonus += bonus.hitBonus;
  if (bonus.evasion) acc.evasion += bonus.evasion;
  if (bonus.reflect) acc.reflect += bonus.reflect;
  if (!weaponOnly || isWeapon) {
    if (bonus.pierce) acc.pierce += bonus.pierce;
    if (bonus.lifesteal) acc.lifesteal += bonus.lifesteal;
    if (bonus.bleedChance) acc.bleedChance += bonus.bleedChance;
  }
}

/** 已裝備之戰鬥特效合計（破防／吸血／流血僅計兵刃槽） */
export function sumGearCombatBonuses(c: LifeCharacter): AggregatedGearCombat {
  ensureGear(c);
  const out = emptyCombatAgg();
  for (const slot of ['weapon', 'armor', 'accessory'] as const) {
    const id = c.equipment[slot];
    if (!id) continue;
    const def = getGearDef(id);
    if (!def?.combat) continue;
    addCombat(out, def.combat, true, slot === 'weapon');
  }
  return out;
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

/** 簡易戰力分：用於換裝前後對照 */
export function combatPowerScore(c: LifeCharacter): number {
  ensureGear(c);
  const t = gearTotals(c);
  const fx = sumGearCombatBonuses(c);
  return (
    t.attack * 2 +
    t.defense +
    t.martialBonus +
    Math.round(t.maxHpBonus / 10) +
    Math.round(t.maxQiBonus / 10) +
    Math.round(fx.hitBonus * 80) +
    Math.round(fx.evasion * 80) +
    Math.round(fx.pierce * 60) +
    Math.round(fx.reflect * 40) +
    Math.round(fx.lifesteal * 50)
  );
}

export interface EquipPreviewDelta {
  gearId: string;
  name: string;
  slot: GearSlot;
  alreadyEquipped: boolean;
  powerBefore: number;
  powerAfter: number;
  powerDelta: number;
  attackDelta: number;
  defenseDelta: number;
  summary: string;
}

/** 預覽將某件已擁有裝備換上後的戰力差（不寫入狀態） */
export function previewEquipDelta(c: LifeCharacter, gearId: string): EquipPreviewDelta | null {
  const def = getGearDef(gearId);
  if (!def) return null;
  ensureGear(c);
  const alreadyEquipped = c.equipment[def.slot] === gearId;
  const powerBefore = combatPowerScore(c);
  const attackBefore = gearTotals(c).attack;
  const defenseBefore = gearTotals(c).defense;

  const shadow: LifeCharacter = {
    ...c,
    equipment: { ...c.equipment, [def.slot]: gearId },
    flags: { ...c.flags },
  };
  const powerAfter = combatPowerScore(shadow);
  const attackAfter = gearTotals(shadow).attack;
  const defenseAfter = gearTotals(shadow).defense;
  const powerDelta = powerAfter - powerBefore;
  const attackDelta = attackAfter - attackBefore;
  const defenseDelta = defenseAfter - defenseBefore;
  const bits: string[] = [];
  if (attackDelta) bits.push(`威${attackDelta > 0 ? '＋' : ''}${attackDelta}`);
  if (defenseDelta) bits.push(`禦${defenseDelta > 0 ? '＋' : ''}${defenseDelta}`);
  bits.push(`戰意${powerDelta > 0 ? '＋' : ''}${powerDelta}`);
  return {
    gearId,
    name: def.name,
    slot: def.slot,
    alreadyEquipped,
    powerBefore,
    powerAfter,
    powerDelta,
    attackDelta,
    defenseDelta,
    summary: bits.join(' · '),
  };
}
