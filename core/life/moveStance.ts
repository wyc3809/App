import type { CombatMoveDef } from '@data/skills/catalog';
import {
  BASIC_STRIKE,
  CHARGE_STANCE,
  FLEE_MOVE,
  GUARD_STANCE,
  combatMoveRole,
} from '@data/skills/catalog';

/** 包剪揼：實克虛、架克實、虛克架 */
export type MoveStance = 'xu' | 'shi' | 'jia';

export const MOVE_STANCE_LABEL: Record<MoveStance, string> = {
  xu: '虛',
  shi: '實',
  jia: '架',
};

export function stanceBeats(a: MoveStance, b: MoveStance): boolean {
  return (
    (a === 'shi' && b === 'xu') || (a === 'jia' && b === 'shi') || (a === 'xu' && b === 'jia')
  );
}

/** 克制 1.25；被克 0.75；同屬／無關 1 */
export function stanceDamageMult(attacker: MoveStance, defender: MoveStance): number {
  if (stanceBeats(attacker, defender)) return 1.25;
  if (stanceBeats(defender, attacker)) return 0.75;
  return 1;
}

export function stanceClashLine(attackerName: string, atk: MoveStance, def: MoveStance): string | null {
  const a = MOVE_STANCE_LABEL[atk];
  const d = MOVE_STANCE_LABEL[def];
  if (stanceBeats(atk, def)) return `${attackerName}以${a}克${d}，招勢得機（傷害×1.25）。`;
  if (stanceBeats(def, atk)) return `${attackerName}以${a}撞${d}，落於下風（傷害×0.75）。`;
  return null;
}

/** 明示 stance 優先；否則按系統招／戰場角色／id 穩定推斷 */
export function resolveMoveStance(move: CombatMoveDef): MoveStance {
  if (move.stance === 'xu' || move.stance === 'shi' || move.stance === 'jia') return move.stance;
  if (move.id === GUARD_STANCE.id) return 'jia';
  if (move.id === CHARGE_STANCE.id || move.id === FLEE_MOVE.id) return 'xu';
  if (move.id === BASIC_STRIKE.id) return 'shi';
  if (move.id.startsWith('enemy_')) {
    if (move.id.includes('feint') || move.id.includes('dodge')) return 'xu';
    if (move.id.includes('guard') || move.id.includes('parry')) return 'jia';
    if (move.id.includes('heavy') || move.id.includes('burst') || move.id.includes('precise')) return 'shi';
  }
  const role = combatMoveRole(move);
  if (role === '守') return 'jia';
  if (role === '蓄' || role === '遁' || role === '巧' || role === '控') return 'xu';
  if (role === '破' || role === '殺' || role === '連' || role === '耗') return 'shi';
  let n = 0;
  for (let i = 0; i < move.id.length; i++) n = (n + move.id.charCodeAt(i) * (i + 3)) % 99;
  return (['shi', 'xu', 'jia'] as const)[n % 3]!;
}
