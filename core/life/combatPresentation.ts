import type { LifeGameState, PendingCombat } from '@interfaces/lifeEngine';
import { foeStyleLabel, inferFoeAiStyle, type FoeAiStyle } from './foeAi';
import { BLOOD_KEY, MERCY_FOE, MERCY_KEY, PENDING_BLOOD, PENDING_REVENGE } from './aftermath';

export function combatSceneLabel(combat: PendingCombat): string {
  if (combat.source === 'spar') return '師門比武場';
  if (combat.source === 'road' || combat.source === 'bandit') return '狹路相逢';
  if (combat.foePower === 'boss') return '強敵當道';
  if (/華山|論劍/.test(combat.title)) return '華山論劍臺';
  return '兵刃相向';
}

export function combatOpeningLines(combat: PendingCombat, style: FoeAiStyle): string[] {
  const scene = combatSceneLabel(combat);
  const styleZh = foeStyleLabel(style);
  return [
    `【${scene}】對上「${combat.foe.name}」——路數${styleZh}。`,
    '刀未出鞘，氣機已撞在一處。',
  ];
}

export function classifyBeat(line: string): 'hit' | 'miss' | 'crit' | 'heal' | 'other' {
  if (/偏|落空|閃|避|未中|差半分/.test(line)) return 'miss';
  if (/重創|要害|猛|爆|絕境/.test(line)) return 'crit';
  if (/療|回|氣血\+|內息\+/.test(line)) return 'heal';
  if (/「|擊|刺|砍|掌|拳|傷/.test(line)) return 'hit';
  return 'other';
}

export function dispositionBlurb(disposition: 'kill' | 'release' | 'stun', foeName: string): string {
  if (disposition === 'kill') return `你刃下不留——「${foeName}」這一頁，就此撕去。`;
  if (disposition === 'release') return `你收招退開半步：「走。」${foeName}看你一眼，沒有道謝，只把命帶走。`;
  return `你點暈${foeName}，把人撂在塵土裡。勝了，卻沒有把故事寫死。`;
}

export type AftermathStatus = {
  kind: 'mercy' | 'blood' | 'revenge' | 'hunt';
  text: string;
};

export function getAftermathStatus(state: LifeGameState): AftermathStatus | null {
  const c = state.character;
  if (c.flags[PENDING_REVENGE]) {
    return { kind: 'revenge', text: `舊怨將至：${c.flags[PENDING_REVENGE]}暗中約戰` };
  }
  if (c.flags[PENDING_BLOOD]) {
    return { kind: 'hunt', text: `血債未清：${c.flags[PENDING_BLOOD]}舊部窺伺` };
  }
  const mercy = Number(c.flags[MERCY_KEY] ?? 0);
  if (mercy > 0) {
    return { kind: 'mercy', text: `放走的${c.flags[MERCY_FOE] ?? '故人'}·餘波尚有 ${mercy} 月` };
  }
  const blood = Number(c.flags[BLOOD_KEY] ?? 0);
  if (blood > 0) {
    return { kind: 'blood', text: `刀下之事·風聲仍在（${blood} 月）` };
  }
  return null;
}

export function styleForCombat(combat: PendingCombat): FoeAiStyle {
  return inferFoeAiStyle(combat.foe.name, combat.foePower ?? 'normal');
}
