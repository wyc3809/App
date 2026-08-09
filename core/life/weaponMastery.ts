import type { LifeGameState } from '@interfaces/lifeEngine';
import type { WeaponKind } from '@data/equipment/catalog';
import { WEAPON_KIND_LABEL, getGearDef } from '@data/equipment/catalog';
import { getSkillDef } from '@data/skills/catalog';

const PREFIX = 'wm_';

export function masteryKey(kind: WeaponKind): string {
  return `${PREFIX}${kind}`;
}

export function getWeaponMastery(state: LifeGameState, kind: WeaponKind): number {
  return Math.max(0, Math.min(5, Number(state.character.flags[masteryKey(kind)] ?? 0) || 0));
}

export function listWeaponMasteries(state: LifeGameState): { kind: WeaponKind; level: number; label: string }[] {
  const kinds: WeaponKind[] = ['sword', 'blade', 'spear', 'staff', 'whip', 'bow', 'hidden'];
  return kinds
    .map((kind) => ({
      kind,
      level: getWeaponMastery(state, kind),
      label: WEAPON_KIND_LABEL[kind],
    }))
    .filter((x) => x.level > 0);
}

/** 戰鬥中使用契兵器招式時累積專精 */
export function gainWeaponMastery(
  state: LifeGameState,
  skillId: string | null,
  amount = 1,
): string | null {
  if (!skillId) return null;
  const def = getSkillDef(skillId);
  if (!def?.weaponKind) return null;
  const equipped = state.character.equipment?.weapon
    ? getGearDef(state.character.equipment.weapon)
    : undefined;
  if (!equipped?.weaponKind || equipped.weaponKind !== def.weaponKind) return null;

  const key = masteryKey(def.weaponKind);
  const prev = getWeaponMastery(state, def.weaponKind);
  const xpKey = `${key}_xp`;
  const xp = (Number(state.character.flags[xpKey] ?? 0) || 0) + amount;
  const need = 4 + prev * 3;
  if (xp < need) {
    state.character.flags[xpKey] = xp;
    return null;
  }
  if (prev >= 5) {
    state.character.flags[xpKey] = 0;
    return null;
  }
  state.character.flags[key] = prev + 1;
  state.character.flags[xpKey] = 0;
  return `${WEAPON_KIND_LABEL[def.weaponKind]}專精升至第${prev + 1}境`;
}

/** 契合倍率：基礎 1.15／+0.06，每境專精再＋0.03 威／＋0.01 準 */
export function weaponSynergyBoost(
  state: LifeGameState,
  skillId: string | null,
): { power: number; hit: number; label?: string } {
  if (!skillId) return { power: 1, hit: 0 };
  const def = getSkillDef(skillId);
  if (!def?.weaponKind) return { power: 1, hit: 0 };
  const equipped = state.character.equipment?.weapon
    ? getGearDef(state.character.equipment.weapon)
    : undefined;
  if (!equipped?.weaponKind) return { power: 1, hit: 0 };

  if (equipped.weaponKind !== def.weaponKind) {
    // 錯兵：輕微滯澀
    return { power: 0.92, hit: -0.03, label: '兵刃不合' };
  }

  const lv = getWeaponMastery(state, def.weaponKind);
  const power = 1.15 + lv * 0.03;
  const hit = 0.06 + lv * 0.01;
  const label =
    lv > 0
      ? `兵刃相契·${WEAPON_KIND_LABEL[def.weaponKind]}${lv}境（${equipped.name}）`
      : `兵刃相契（${equipped.name}）`;
  return { power, hit, label };
}

/** 華山幽靈快照用（無 LifeGameState 專精時仍給基礎契合） */
export function weaponSynergyForLoadout(
  weaponKind: WeaponKind | undefined,
  skillWeapon: WeaponKind | undefined,
  mastery = 0,
): { power: number; hit: number } {
  if (!skillWeapon) return { power: 1, hit: 0 };
  if (!weaponKind) return { power: 1, hit: 0 };
  if (weaponKind !== skillWeapon) return { power: 0.92, hit: -0.03 };
  return { power: 1.15 + mastery * 0.03, hit: 0.06 + mastery * 0.01 };
}
