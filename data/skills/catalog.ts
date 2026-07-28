import { rankName } from '@core/life/martialRanks';

export type SkillKind = 'external' | 'internal';

export type CombatMoveId = string;

export interface CombatMoveDef {
  id: CombatMoveId;
  name: string;
  /** 內息消耗 */
  qiCost: number;
  /** 基礎傷害倍率（乘攻擊） */
  power: number;
  /** 命中修正 0–1 加成於基礎命中 */
  hitBonus?: number;
  /** 自身回復氣血 */
  healSelf?: number;
  /** 降低敵方下回合命中 */
  applyBlind?: number;
  description: string;
}

export interface InternalPassive {
  attack?: number;
  defense?: number;
  maxHp?: number;
  maxQi?: number;
  hitBonus?: number;
  /** 每回合開始回復內息 */
  qiRegen?: number;
}

export interface SkillDef {
  id: string;
  name: string;
  kind: SkillKind;
  /** 外功：戰鬥中可選招式 */
  move?: CombatMoveDef;
  /** 內功：只提供被動數值／效果 */
  passive?: InternalPassive;
}

/** 基本拳腳（人人皆有） */
export const BASIC_STRIKE: CombatMoveDef = {
  id: 'basic_strike',
  name: '普通攻擊',
  qiCost: 0,
  power: 1,
  description: '一記尋常拳腳／兵刃。',
};

export const SKILL_DEFS: Record<string, SkillDef> = {
  基礎吐納: {
    id: '基礎吐納',
    name: '基礎吐納',
    kind: 'internal',
    passive: { maxQi: 10, qiRegen: 4 },
  },
  art_stone_palm: {
    id: 'art_stone_palm',
    name: '裂石殘掌',
    kind: 'external',
    move: {
      id: 'mv_stone_palm',
      name: '裂石掌',
      qiCost: 18,
      power: 1.55,
      description: '掌力沉猛，專破硬架。',
    },
  },
  art_bridge_step: {
    id: 'art_bridge_step',
    name: '斷橋步',
    kind: 'external',
    move: {
      id: 'mv_bridge_step',
      name: '斷橋踏',
      qiCost: 12,
      power: 1.15,
      hitBonus: 0.12,
      description: '步法欺近，一踏即中。',
    },
  },
  art_tomb_sword: {
    id: 'art_tomb_sword',
    name: '無銘劍意',
    kind: 'external',
    move: {
      id: 'mv_tomb_sword',
      name: '無銘一刺',
      qiCost: 22,
      power: 1.7,
      hitBonus: 0.05,
      description: '劍意無形，專取破綻。',
    },
  },
  art_lake_breath: {
    id: 'art_lake_breath',
    name: '寒湖吐納',
    kind: 'internal',
    passive: { maxQi: 25, qiRegen: 8, defense: 4 },
  },
  art_rain_sword: {
    id: 'art_rain_sword',
    name: '聽雨劍意',
    kind: 'external',
    move: {
      id: 'mv_rain_sword',
      name: '聽雨連刺',
      qiCost: 16,
      power: 1.35,
      hitBonus: 0.08,
      description: '劍如細雨，連點不絕。',
    },
  },
  art_nine_shadow: {
    id: 'art_nine_shadow',
    name: '九影迷踪步',
    kind: 'external',
    move: {
      id: 'mv_nine_shadow',
      name: '九影閃擊',
      qiCost: 14,
      power: 1.2,
      hitBonus: 0.18,
      applyBlind: 0.15,
      description: '身形一晃，敵眸難追。',
    },
  },
  art_cold_palm: {
    id: 'art_cold_palm',
    name: '寒霜掌',
    kind: 'external',
    move: {
      id: 'mv_cold_palm',
      name: '寒霜掌',
      qiCost: 20,
      power: 1.45,
      description: '掌風帶寒，傷人內息。',
    },
  },
  art_iron_body: {
    id: 'art_iron_body',
    name: '鐵布衫',
    kind: 'internal',
    passive: { defense: 12, maxHp: 40 },
  },
  art_moon_sword: {
    id: 'art_moon_sword',
    name: '弄月劍法',
    kind: 'external',
    move: {
      id: 'mv_moon_sword',
      name: '弄月一劍',
      qiCost: 15,
      power: 1.4,
      hitBonus: 0.06,
      description: '劍光如月，弧線取敵。',
    },
  },
  art_void_breath: {
    id: 'art_void_breath',
    name: '空冥吐納',
    kind: 'internal',
    passive: { maxQi: 35, qiRegen: 10, attack: 3 },
  },
  art_river_fist: {
    id: 'art_river_fist',
    name: '長河拳',
    kind: 'external',
    move: {
      id: 'mv_river_fist',
      name: '長河崩拳',
      qiCost: 17,
      power: 1.5,
      description: '拳勢如河，一往無前。',
    },
  },
  art_silk_hand: {
    id: 'art_silk_hand',
    name: '柔絲手',
    kind: 'external',
    move: {
      id: 'mv_silk_hand',
      name: '柔絲鎖脈',
      qiCost: 13,
      power: 1.1,
      hitBonus: 0.1,
      healSelf: 8,
      description: '借力卸力，順勢回氣。',
    },
  },
  art_thunder_blade: {
    id: 'art_thunder_blade',
    name: '驚雷刀',
    kind: 'external',
    move: {
      id: 'mv_thunder_blade',
      name: '驚雷一刀',
      qiCost: 24,
      power: 1.85,
      description: '刀出如雷，勢不可擋。',
    },
  },
  sect_art_sect_qingyun: {
    id: 'sect_art_sect_qingyun',
    name: '青雲入門劍訣',
    kind: 'external',
    move: {
      id: 'mv_qingyun_sword',
      name: '青雲初劍',
      qiCost: 10,
      power: 1.25,
      hitBonus: 0.05,
      description: '門中入門劍式。',
    },
  },
  sect_art_sect_tiandao: {
    id: 'sect_art_sect_tiandao',
    name: '天刀門基礎刀式',
    kind: 'external',
    move: {
      id: 'mv_tiandao_blade',
      name: '天刀開山',
      qiCost: 12,
      power: 1.35,
      description: '門中開山刀式。',
    },
  },
  sect_art_sect_emei: {
    id: 'sect_art_sect_emei',
    name: '峨嵋柔勁入門',
    kind: 'internal',
    passive: { defense: 6, hitBonus: 0.04, qiRegen: 3 },
  },
  sect_art_sect_shaolin: {
    id: 'sect_art_sect_shaolin',
    name: '少林基本樁功',
    kind: 'internal',
    passive: { maxHp: 30, defense: 8 },
  },
  sect_art_sect_wudang: {
    id: 'sect_art_sect_wudang',
    name: '武當吐納入門',
    kind: 'internal',
    passive: { maxQi: 20, qiRegen: 6, attack: 2 },
  },
};

export const SKILL_NAMES: Record<string, string> = Object.fromEntries(
  Object.values(SKILL_DEFS).map((s) => [s.id, s.name]),
);

export function skillLabel(id: string): string {
  return SKILL_NAMES[id] ?? id.replace(/^art_/, '').replace(/^sect_art_/, '').replace(/_/g, '·');
}

export function getSkillDef(id: string): SkillDef | undefined {
  return SKILL_DEFS[id];
}

export function skillKindLabel(kind: SkillKind): string {
  return kind === 'external' ? '外功' : '內功';
}

export function formatSkillLine(id: string, rank: number): string {
  const def = getSkillDef(id);
  const name = skillLabel(id);
  const kind = def ? skillKindLabel(def.kind) : '武學';
  return `${name}（${kind}）· ${rankName(rank)}`;
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
  }
  return out;
}
