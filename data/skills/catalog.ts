import type { WeaponKind } from '@data/equipment/catalog';
import { MARTIAL_CATALOG_RAW } from '@data/content/packs';
import { rankName } from '@core/life/martialRanks';

export type SkillKind = 'external' | 'internal' | 'qinggong';

export type CombatMoveId = string;

/** 外功招式：欄位皆可在 content/martial/catalog.json 以文字修改 */
export interface CombatMoveDef {
  id: CombatMoveId;
  name: string;
  qiCost: number;
  power: number;
  /** 包剪揼屬性：虛／實／架；缺省由 resolveMoveStance 推斷 */
  stance?: 'xu' | 'shi' | 'jia';
  hitBonus?: number;
  healSelf?: number;
  applyBlind?: number;
  /** 無視防禦比例 0–1 */
  pierce?: number;
  /** 連擊次數（含第一擊） */
  multiHit?: number;
  /** 耗敵內息 */
  qiDrain?: number;
  bleedChance?: number;
  bleedDamage?: number;
  bleedTurns?: number;
  /** 暈眩機率：敵跳過下一行動 */
  stunChance?: number;
  /** 暫時削敵防 */
  defenseBreak?: number;
  /** 傷害吸血 0–1 */
  lifesteal?: number;
  description: string;
}

export interface InternalPassive {
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxQi?: number;
  hitBonus?: number;
  qiRegen?: number;
  /** 反彈所受傷害比例 0–1 */
  reflect?: number;
  /** 閃避：降低被命中機率 0–1 */
  evasionBonus?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  kind: SkillKind;
  flavor?: string;
  sectId?: string;
  unlockStanding?: number;
  encounterOnly?: boolean;
  /** 持對應兵器時招式加威／加準 */
  weaponKind?: WeaponKind;
  move?: CombatMoveDef;
  passive?: InternalPassive;
}

interface RawSkill {
  id: string;
  name: string;
  kind: SkillKind;
  flavor?: string;
  sectId?: string;
  unlockStanding?: number;
  encounterOnly?: boolean;
  legacyAliasOf?: string;
  weaponKind?: WeaponKind;
  move?: CombatMoveDef;
  passive?: InternalPassive;
}

const LEGACY_SKILL_ALIASES: Record<string, { target: string; name?: string }> = {};

function buildCatalog(): Record<string, SkillDef> {
  const out: Record<string, SkillDef> = {};
  for (const raw of MARTIAL_CATALOG_RAW.skills as RawSkill[]) {
    if (raw.legacyAliasOf) {
      LEGACY_SKILL_ALIASES[raw.id] = { target: raw.legacyAliasOf, name: raw.name };
      continue;
    }
    const def: SkillDef = {
      id: raw.id,
      name: raw.name,
      kind: raw.kind,
      flavor: raw.flavor,
      sectId: raw.sectId,
      unlockStanding: raw.unlockStanding,
      encounterOnly: raw.encounterOnly,
      weaponKind: raw.weaponKind,
      move: raw.move,
      passive: raw.passive,
    };
    out[raw.id] = def;
  }
  return out;
}

export const BASIC_STRIKE: CombatMoveDef = {
  id: 'basic_strike',
  name: '普通攻擊',
  qiCost: 0,
  power: 1,
  stance: 'shi',
  description: '一記尋常拳腳／兵刃（實）。',
};

export const GUARD_STANCE: CombatMoveDef = {
  id: 'sys_guard',
  name: '守勢',
  qiCost: 0,
  power: 0,
  stance: 'jia',
  description: '收招守中（架），暫增防禦；戰鬥中可藉此緩回些許內力。',
};

export const CHARGE_STANCE: CombatMoveDef = {
  id: 'sys_charge',
  name: '蓄勢',
  qiCost: 12,
  power: 0,
  stance: 'xu',
  description: '凝勁一輪（虛），下一擊威能大增。',
};

export const FLEE_MOVE: CombatMoveDef = {
  id: 'sys_flee',
  name: '抽身',
  qiCost: 0,
  power: 0,
  stance: 'xu',
  description: '伺機脫戰（虛）；成敗看身法與氣運。',
};

export const SYSTEM_MOVES: CombatMoveDef[] = [GUARD_STANCE, CHARGE_STANCE, FLEE_MOVE];

export function isCombatActionMove(moveId: string): boolean {
  return SYSTEM_MOVES.some((m) => m.id === moveId);
}

export const SKILL_DEFS: Record<string, SkillDef> = buildCatalog();

export const SKILL_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(SKILL_DEFS).map((s) => [s.id, s.name]),
);

export function skillLabel(id: string): string {
  const def = getSkillDef(id);
  if (def?.name && /[\u4e00-\u9fff]/.test(def.name)) return def.name;
  const named = SKILL_NAMES[id];
  if (named) return named;
  if (/[\u4e00-\u9fff]/.test(id)) return id;
  return '無名功法';
}

export function getSkillDef(id: string): SkillDef | undefined {
  const alias = LEGACY_SKILL_ALIASES[id];
  const resolved = alias?.target ?? id;
  const def = SKILL_DEFS[resolved];
  if (!def) return undefined;
  if (alias?.name) return { ...def, id, name: alias.name };
  if (resolved !== id) return { ...def, id };
  return def;
}

export function skillKindLabel(kind: SkillKind): string {
  if (kind === 'external') return '外功';
  if (kind === 'qinggong') return '輕功';
  return '內功';
}

export function formatSkillLine(id: string, rank: number): string {
  const def = getSkillDef(id);
  const name = skillLabel(id);
  const kind = def ? skillKindLabel(def.kind) : '武學';
  return `${name}（${kind}）· ${rankName(rank)}`;
}

export function formatSkillEffects(id: string): string {
  const def = getSkillDef(id);
  if (!def) return '';
  const bits: string[] = [];
  if (def.flavor) bits.push(def.flavor);
  if (def.move) {
    const fx = formatCombatMoveEffectBits(def.move);
    if (fx.length) bits.push(`特效：${fx.join('、')}`);
    else if (def.move.description) bits.push(def.move.description);
  } else if (def.passive) {
    const p = def.passive;
    const fx: string[] = [];
    if (p.attack) fx.push(`攻+${p.attack}`);
    if (p.defense) fx.push(`防+${p.defense}`);
    if (p.maxHp) fx.push(`氣血上限+${p.maxHp}`);
    if (p.maxQi) fx.push(`內力上限+${p.maxQi}`);
    if (p.qiRegen) fx.push(`回息+${p.qiRegen}`);
    if (p.reflect) fx.push(`反震${Math.round(p.reflect * 100)}%`);
    if (p.evasionBonus) fx.push(`閃避+${Math.round(p.evasionBonus * 100)}%`);
    if (fx.length) bits.push(`被動：${fx.join('、')}`);
  }
  if (def.weaponKind) {
    bits.push(`需兵器：${def.weaponKind === 'sword' ? '劍' : def.weaponKind === 'blade' ? '刀' : def.weaponKind === 'spear' ? '槍' : def.weaponKind === 'staff' ? '杖' : def.weaponKind === 'whip' ? '鞭' : def.weaponKind === 'bow' ? '弓' : '暗器'}（持之加威）`);
  }
  return bits.join(' — ');
}

/** 戰鬥招式特效短語（不含 flavor） */
export function formatCombatMoveEffectBits(m: CombatMoveDef): string[] {
  const fx: string[] = [];
  if (m.pierce) fx.push(`破防${Math.round(m.pierce * 100)}%`);
  if (m.multiHit && m.multiHit > 1) fx.push(`連擊×${m.multiHit}`);
  if (m.qiDrain) fx.push(`耗敵息${m.qiDrain}`);
  if (m.bleedChance) fx.push('流血');
  if (m.stunChance) fx.push('定身');
  if (m.lifesteal) fx.push(`吸血${Math.round(m.lifesteal * 100)}%`);
  if (m.healSelf) fx.push(`回血${m.healSelf}`);
  if (m.applyBlind) fx.push('迷目');
  if (m.defenseBreak) fx.push(`破防−${m.defenseBreak}`);
  if (m.hitBonus) fx.push(`命中+${Math.round(m.hitBonus * 100)}%`);
  return fx;
}

/** 招式戰場角色：用於篩選與短標，非裝備欄上限 */
export type CombatMoveRole = '普' | '破' | '連' | '控' | '耗' | '殺' | '巧' | '守' | '蓄' | '遁';

export const COMBAT_TECHNIQUE_ROLES: CombatMoveRole[] = ['破', '連', '控', '耗', '殺', '巧', '普'];

export function combatMoveRole(m: CombatMoveDef): CombatMoveRole {
  if (m.id === BASIC_STRIKE.id) return '普';
  if (m.id === GUARD_STANCE.id) return '守';
  if (m.id === CHARGE_STANCE.id) return '蓄';
  if (m.id === FLEE_MOVE.id) return '遁';
  if ((m.stunChance ?? 0) > 0 || (m.applyBlind ?? 0) > 0) return '控';
  if ((m.bleedChance ?? 0) > 0 && (m.power ?? 0) < 1.45) return '控';
  if ((m.pierce ?? 0) > 0 || (m.defenseBreak ?? 0) > 0) return '破';
  if ((m.multiHit ?? 1) > 1) return '連';
  if ((m.qiDrain ?? 0) > 0) return '耗';
  if ((m.lifesteal ?? 0) > 0 || (m.healSelf ?? 0) > 0 || (m.hitBonus ?? 0) >= 0.08) return '巧';
  if ((m.power ?? 0) >= 1.45) return '殺';
  return '殺';
}

export function formatCombatMoveSummary(m: CombatMoveDef, effPower?: number): string {
  const bits: string[] = [];
  bits.push(m.qiCost > 0 ? `耗內力 ${m.qiCost}` : '無耗');
  if (m.power > 0) bits.push(`威能 ${(effPower ?? m.power).toFixed(2)} 倍`);
  const fx = formatCombatMoveEffectBits(m);
  if (fx.length) bits.push(fx.join('、'));
  return bits.join(' · ');
}

/** 戰鬥清單用短標：內力 · 威能 · 主特效（屬性只顯示喺印章） */
export function formatCombatMoveCompact(m: CombatMoveDef, effPower?: number): string {
  const bits: string[] = [];
  bits.push(m.qiCost > 0 ? `${m.qiCost}` : '0');
  if (m.power > 0) bits.push(`×${(effPower ?? m.power).toFixed(1)}`);
  const fx = formatCombatMoveEffectBits(m);
  if (fx[0]) bits.push(fx[0]);
  return bits.join(' · ');
}

export function formatSkillDetail(id: string, rank: number): string {
  const effects = formatSkillEffects(id);
  const base = formatSkillLine(id, rank);
  return effects ? `${base} — ${effects}` : base;
}

export function listExternalMovesForSkills(skillIds: string[]): CombatMoveDef[] {
  const moves: CombatMoveDef[] = [BASIC_STRIKE, ...SYSTEM_MOVES];
  for (const id of skillIds) {
    const def = getSkillDef(id);
    if (def?.kind === 'external' && def.move) moves.push(def.move);
  }
  return moves;
}

export function sumInternalPassives(skillIds: string[], ranks: Record<string, number>): InternalPassive {
  const out: InternalPassive = {};
  for (const id of skillIds) {
    const def = getSkillDef(id);
    if (!def || def.kind !== 'internal' || !def.passive) continue;
    const rank = ranks[id] ?? 0;
    const scale = 1 + rank * 0.25;
    const p = def.passive;
    out.attack = (out.attack ?? 0) + Math.round((p.attack ?? 0) * scale);
    out.defense = (out.defense ?? 0) + Math.round((p.defense ?? 0) * scale);
    out.maxHp = (out.maxHp ?? 0) + Math.round((p.maxHp ?? 0) * scale);
    out.maxQi = (out.maxQi ?? 0) + Math.round((p.maxQi ?? 0) * scale);
    out.hitBonus = (out.hitBonus ?? 0) + (p.hitBonus ?? 0) * scale;
    out.qiRegen = (out.qiRegen ?? 0) + Math.round((p.qiRegen ?? 0) * scale);
    out.reflect = (out.reflect ?? 0) + (p.reflect ?? 0) * scale;
  }
  return out;
}

/** 輕功被動：閃避等（與內功分開累加） */
export function sumQinggongPassives(skillIds: string[], ranks: Record<string, number>): InternalPassive {
  const out: InternalPassive = {};
  for (const id of skillIds) {
    const def = getSkillDef(id);
    if (!def || def.kind !== 'qinggong' || !def.passive) continue;
    const rank = ranks[id] ?? 0;
    const scale = 1 + rank * 0.25;
    const p = def.passive;
    out.evasionBonus = (out.evasionBonus ?? 0) + (p.evasionBonus ?? 0) * scale;
    out.qiRegen = (out.qiRegen ?? 0) + Math.round((p.qiRegen ?? 0) * scale);
    out.hitBonus = (out.hitBonus ?? 0) + (p.hitBonus ?? 0) * scale;
  }
  return out;
}

export function sumEvasionBonus(skillIds: string[], ranks: Record<string, number>): number {
  const q = sumQinggongPassives(skillIds, ranks);
  let ev = q.evasionBonus ?? 0;
  for (const id of skillIds) {
    const def = getSkillDef(id);
    if (!def || def.kind !== 'internal' || !def.passive?.evasionBonus) continue;
    const rank = ranks[id] ?? 0;
    const scale = 1 + rank * 0.25;
    ev += def.passive.evasionBonus * scale;
  }
  return Math.min(0.42, ev);
}
