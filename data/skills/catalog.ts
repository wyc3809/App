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
  description: '一記尋常拳腳／兵刃。',
};

export const SKILL_DEFS: Record<string, SkillDef> = buildCatalog();

export const SKILL_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(SKILL_DEFS).map((s) => [s.id, s.name]),
);

export function skillLabel(id: string): string {
  return SKILL_NAMES[id] ?? id.replace(/^art_/, '').replace(/^sect_art_/, '').replace(/_/g, '·');
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
    const m = def.move;
    const fx: string[] = [];
    if (m.pierce) fx.push(`破防${Math.round(m.pierce * 100)}%`);
    if (m.multiHit && m.multiHit > 1) fx.push(`連擊×${m.multiHit}`);
    if (m.qiDrain) fx.push(`耗息${m.qiDrain}`);
    if (m.bleedChance) fx.push('流血');
    if (m.stunChance) fx.push('定身');
    if (m.lifesteal) fx.push('吸血');
    if (m.healSelf) fx.push(`回血${m.healSelf}`);
    if (m.applyBlind) fx.push('迷目');
    if (m.defenseBreak) fx.push(`破防−${m.defenseBreak}`);
    if (fx.length) bits.push(`特效：${fx.join('、')}`);
    else if (m.description) bits.push(m.description);
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
  return bits.join(' — ');
}

export function formatSkillDetail(id: string, rank: number): string {
  const effects = formatSkillEffects(id);
  const base = formatSkillLine(id, rank);
  return effects ? `${base} — ${effects}` : base;
}

export function listExternalMovesForSkills(skillIds: string[]): CombatMoveDef[] {
  const moves: CombatMoveDef[] = [BASIC_STRIKE];
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
