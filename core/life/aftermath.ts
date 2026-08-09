import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { pushChronicle } from './chronicle';
import { learnMartialArt } from './flavor';
import { grantGear } from './equipment';
import { applyNatureDelta } from './nature';
import { recordGrudgeFromDisposition, tickGrudgeBook } from './grudgeBook';

export const MERCY_KEY = 'aftermath_mercy_months';
export const MERCY_FOE = 'aftermath_mercy_foe';
export const BLOOD_KEY = 'aftermath_blood_months';
export const BLOOD_FOE = 'aftermath_blood_foe';
export const PENDING_REVENGE = 'pending_revenge_foe';
export const PENDING_BLOOD = 'pending_blood_foe';

/** 戰後處置寫入後續旗標 */
export function recordDispositionAftermath(
  state: LifeGameState,
  disposition: 'kill' | 'release' | 'stun',
  foeName: string,
): string[] {
  const c = state.character;
  const lines: string[] = [];
  syncRngFromState(state);
  const rng = getRng();
  if (disposition === 'release') {
    c.flags[MERCY_KEY] = rng.nextInt(3, 8);
    c.flags[MERCY_FOE] = foeName;
    lines.push('江湖上或有人記得這份手軟。');
  } else if (disposition === 'kill') {
    c.flags[BLOOD_KEY] = rng.nextInt(4, 10);
    c.flags[BLOOD_FOE] = foeName;
    lines.push('血債入風聲，暗處或有耳目。');
  } else {
    c.flags['aftermath_stun_soft'] = (Number(c.flags['aftermath_stun_soft'] ?? 0) || 0) + 1;
  }
  recordGrudgeFromDisposition(state, disposition, foeName);
  lines.push('已記入恩怨簿。');
  snapshotRng(state);
  return lines;
}

/**
 * 每月推進戰後餘波。
 * 若需開戰，只寫 pending_* 旗標，由 startMonth 呼叫 tryStartAftermathCombat。
 */
export function tickAftermath(state: LifeGameState): string[] {
  if (!state.character.alive) return [];
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const lines: string[] = [];

  const mercy = Number(c.flags[MERCY_KEY] ?? 0);
  if (mercy > 0) {
    const next = mercy - 1;
    c.flags[MERCY_KEY] = next;
    if (next <= 0) {
      const foe = String(c.flags[MERCY_FOE] ?? '故人');
      delete c.flags[MERCY_KEY];
      delete c.flags[MERCY_FOE];
      if (rng.chance(0.55)) {
        const gift = rng.nextInt(12, 35);
        c.money += gift;
        lines.push(`昔日放走的${foe}託人送來銀兩${gift}兩，並附一封短箋致謝。`);
        if (rng.chance(0.28) && !c.skills.includes('qg_reed_drift')) {
          lines.push(learnMartialArt(state, 'qg_reed_drift', '蘆花身法'));
        }
        applyNatureDelta(c, { xia: 1 });
      } else {
        lines.push(`風聲傳來：被你放走的${foe}似有不甘，正在暗中相約再戰。`);
        c.flags[PENDING_REVENGE] = foe;
      }
    }
  }

  const blood = Number(c.flags[BLOOD_KEY] ?? 0);
  if (blood > 0) {
    const next = blood - 1;
    c.flags[BLOOD_KEY] = next;
    if (rng.chance(0.2)) {
      c.reputation = Math.max(0, c.reputation - 1);
      lines.push('市井竊竊：有人議論你刀下不留情。');
    }
    if (next <= 0) {
      const foe = String(c.flags[BLOOD_FOE] ?? '亡者');
      delete c.flags[BLOOD_KEY];
      delete c.flags[BLOOD_FOE];
      if (rng.chance(0.42)) {
        lines.push(`${foe}的舊部欲為血債討還。`);
        c.flags[PENDING_BLOOD] = foe;
      } else if (rng.chance(0.35)) {
        const g = grantGear(state, rng.chance(0.5) ? 'iron-blade' : 'cloud-boots');
        if (g) lines.push(`追緝風聲漸歇，你卻在舊戰場拾得「${g}」。`);
      } else {
        lines.push('血債的風聲淡了，鎮裡人仍偶爾側目。');
      }
    }
  }

  lines.push(...tickGrudgeBook(state));
  if (lines.length) pushChronicle(state, lines);
  snapshotRng(state);
  return lines;
}
