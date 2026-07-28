import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { addCondition } from './monthly';
import { raiseBaseMaxQi } from './equipment';
import type { PackChoiceRaw, PackOutcomeOp } from './jianghuEventRepository';
import { deltaMoney, deltaHealth, deltaRep } from './flavor';

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export interface OutcomeResolveResult {
  logs: string[];
  deltas: string[];
  feedback: string;
  died: boolean;
  success: boolean;
}

/**
 * OutcomeResolver：依序執行 pack outcomes（各自 chance），
 * 對應 Jianghu Random Events Pack v1 的 op/path/value。
 */
export function resolvePackOutcomes(
  state: LifeGameState,
  choice: PackChoiceRaw,
): OutcomeResolveResult {
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const logs: string[] = [];
  const deltas: string[] = [];
  let died = false;
  let success = true;
  let skillFailed = false;

  const outcomes = choice.outcomes ?? [];
  for (const outcome of outcomes) {
    const chance = outcome.chance ?? 1;
    if (chance < 1 && !rng.chance(chance)) {
      if (outcome.op === 'skill_check') skillFailed = true;
      continue;
    }
    const line = applyPackOutcome(state, outcome);
    if (line.log) logs.push(line.log);
    if (line.delta) deltas.push(line.delta);
    if (line.failedCheck) {
      skillFailed = true;
      success = false;
    }
  }

  if (skillFailed) success = false;

  const rt = choice.result_text;
  const feedback =
    (typeof rt === 'string' ? rt : success ? rt?.success : rt?.failure) ||
    logs.find((l) => !/^(財帛|氣血|名望|武學|內息|疲|銀兩)/.test(l)) ||
    logs[0] ||
    (success ? '你的選擇改變了事情的走向。' : '事情沒有完全按你的預期發展。');

  if (!logs.includes(feedback)) logs.unshift(feedback);

  if (c.health <= 0) {
    c.alive = false;
    died = true;
  }

  snapshotRng(state);
  return { logs, deltas, feedback, died, success };
}

function applyPackOutcome(
  state: LifeGameState,
  outcome: PackOutcomeOp,
): { log?: string; delta?: string; failedCheck?: boolean } {
  const op = outcome.op ?? '';
  const path = String(outcome.path ?? '');
  const value = outcome.value;
  const c = state.character;

  switch (op) {
    case 'add': {
      const amount = Number(value ?? 0);
      if (!amount) return {};
      if (path.includes('wealth.coins')) {
        c.money += amount;
        c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
        const line = deltaMoney(amount);
        return line ? { log: line, delta: line } : {};
      }
      if (path.includes('health.hp')) {
        c.health = clamp(c.health + amount, 0, c.maxHealth);
        const line = deltaHealth(amount);
        return line ? { log: line, delta: line } : {};
      }
      if (path.includes('health.fatigue') || path.includes('resources.time')) {
        c.fatigue = clamp(c.fatigue + Math.abs(amount), 0, 100);
        return { log: '身心更累了些', delta: '略增疲態' };
      }
      if (path.includes('health.stress') || path.includes('emotions.stress')) {
        c.fatigue = clamp(c.fatigue + Math.ceil(Math.abs(amount) / 2), 0, 100);
        c.health = clamp(c.health - Math.max(1, Math.floor(Math.abs(amount) / 3)), 0, c.maxHealth);
        return { log: '心神受擾', delta: '吃了些虧' };
      }
      if (path.includes('emotions.calm') || path.includes('emotions.curiosity')) {
        c.qi = clamp(c.qi + Math.abs(amount), 0, c.maxQi);
        return { log: '心緒稍定，內息回籠', delta: '內息略復' };
      }
      if (path.includes('reputation')) {
        const rep = Math.sign(amount) * Math.max(1, Math.ceil(Math.abs(amount) / 2));
        c.reputation += rep;
        const line = deltaRep(rep);
        return line ? { log: line, delta: line } : {};
      }
      if (path.includes('relationships')) {
        c.reputation += Math.sign(amount) || 1;
        return { log: '人情有變', delta: '人情有變' };
      }
      if (path.includes('attributes')) {
        const gain = Math.sign(amount) * Math.max(1, Math.ceil(Math.abs(amount) / 8));
        if (path.includes('perception') || path.includes('intelligence')) {
          c.attributes.wuXing = clamp(c.attributes.wuXing + gain, 1, 100);
        } else if (path.includes('charisma')) {
          c.attributes.meiLi = clamp(c.attributes.meiLi + gain, 1, 100);
        } else if (path.includes('courage')) {
          c.attributes.danShi = clamp(c.attributes.danShi + gain, 1, 100);
        } else {
          c.martial += Math.abs(gain);
        }
        return { log: '閱歷更深了一分', delta: '閱歷有進' };
      }
      if (path.includes('internal') || path.includes('qi')) {
        raiseBaseMaxQi(c, Math.max(1, Math.ceil(Math.abs(amount) / 2)));
        c.qi = clamp(c.qi + Math.abs(amount), 0, c.maxQi);
        return { log: '內力根基似有鬆動進境', delta: '內力有進' };
      }
      return { log: `事態推移（${path}）` };
    }
    case 'set_flag': {
      const key = path || String(value || 'flag');
      c.flags[key] = true;
      state.worldFlags[key] = true;
      return { log: `記下：${key}`, delta: `旗標·${key}` };
    }
    case 'create_memory': {
      const text = String(value || outcome.note || '你記下了一段江湖見聞。');
      return { log: text };
    }
    case 'add_item': {
      const name = String(value || '江湖雜物');
      c.flags[`item_${name}`] = true;
      const line = `獲得：${name}`;
      return { log: line, delta: line };
    }
    case 'skill_check': {
      // chance 已在外層判定；走到此處視為通過
      return { log: String(outcome.note || '你憑本事闖過這一關。') };
    }
    case 'roll_event': {
      const id = String(value || 'followup');
      c.flags[`followup_${id}`] = true;
      return { log: `後續機緣已種下（${id}）`, delta: '後續機緣' };
    }
    default:
      if (outcome.note) return { log: String(outcome.note) };
      return {};
  }
}

/** 低機率負面餘波（不取代 pack outcomes） */
export function applyPackRiskTail(state: LifeGameState, chance = 0.12): string[] {
  syncRngFromState(state);
  const rng = getRng();
  if (!rng.chance(chance)) {
    snapshotRng(state);
    return [];
  }
  const c = state.character;
  c.health = clamp(c.health - rng.nextInt(8, 18), 0, c.maxHealth);
  addCondition(state, 'bleeding');
  const logs = ['此局仍有餘波，你帶傷收場。', '氣血受損', '傷勢'];
  snapshotRng(state);
  return logs;
}
