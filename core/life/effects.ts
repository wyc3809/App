import type { GameEffect, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { randomChineseName } from '@core/ids';
import { grantGear, raiseBaseMaxHp, raiseBaseMaxQi, ensureGear } from './equipment';
import { addCondition } from './monthly';
import { learnMartialArt } from './flavor';

export interface EffectResult {
  logs: string[];
  died: boolean;
  deltas: string[];
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function applyEffects(state: LifeGameState, effects: GameEffect[]): EffectResult {
  const logs: string[] = [];
  const deltas: string[] = [];
  let died = false;
  const c = state.character;
  ensureGear(c);

  for (const eff of effects) {
    switch (eff.type) {
      case 'narrate':
        logs.push(eff.text);
        break;
      case 'attr':
        for (const [k, v] of Object.entries(eff.delta)) {
          const key = k as WuxiaAttribute;
          if (!wuxiaAttributeKeys.includes(key) || v === undefined) continue;
          c.attributes[key] = clamp(c.attributes[key] + v, 1, 100);
        }
        break;
      case 'money':
        c.money += eff.amount;
        c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
        if (eff.amount !== 0) {
          const line = eff.amount > 0 ? `銀兩＋${eff.amount}` : `銀兩${eff.amount}`;
          logs.push(line);
          deltas.push(line);
        }
        break;
      case 'health':
        c.health = clamp(c.health + eff.amount, 0, c.maxHealth);
        if (eff.amount !== 0) {
          const line = `氣血${eff.amount > 0 ? '＋' : ''}${eff.amount}`;
          logs.push(line);
          deltas.push(line);
        }
        break;
      case 'qi':
        c.qi = clamp(c.qi + eff.amount, 0, c.maxQi);
        if (eff.amount !== 0) {
          const line = `內息${eff.amount > 0 ? '＋' : ''}${eff.amount}`;
          logs.push(line);
          deltas.push(line);
        }
        break;
      case 'maxHealth':
        raiseBaseMaxHp(c, eff.amount);
        logs.push(`氣血上限＋${eff.amount}（現 ${c.maxHealth}）`);
        deltas.push(`氣血上限＋${eff.amount}`);
        break;
      case 'maxQi':
        raiseBaseMaxQi(c, eff.amount);
        logs.push(`內力上限＋${eff.amount}（現 ${c.maxQi}）`);
        deltas.push(`內力上限＋${eff.amount}`);
        break;
      case 'reputation':
        c.reputation += eff.amount;
        if (eff.amount !== 0) {
          const line = `名望${eff.amount > 0 ? '＋' : ''}${eff.amount}`;
          logs.push(line);
          deltas.push(line);
        }
        break;
      case 'martial':
        c.martial += eff.amount;
        if (eff.amount !== 0) {
          const line = `武學${eff.amount > 0 ? '＋' : ''}${eff.amount}`;
          logs.push(line);
          deltas.push(line);
        }
        break;
      case 'flag':
        c.flags[eff.key] = eff.value;
        break;
      case 'worldFlag':
        state.worldFlags[eff.key] = eff.value;
        break;
      case 'learnSkill': {
        const line = learnMartialArt(state, eff.skillId, eff.name);
        logs.push(line);
        deltas.push(`武功＋${eff.name ?? eff.skillId}`);
        break;
      }
      case 'grantGear': {
        const name = grantGear(state, eff.gearId);
        if (name) {
          logs.push(`獲得裝備：「${name}」`);
          deltas.push(`裝備＋${name}`);
        }
        break;
      }
      case 'condition':
        addCondition(state, eff.id);
        logs.push('罹患傷勢。');
        deltas.push('傷勢');
        break;
      case 'joinSect': {
        let sectId = eff.sectId;
        if (!sectId && eff.sectName) {
          const found = Object.values(state.sects).find((s) => s.name === eff.sectName);
          sectId = found?.id;
        }
        if (!sectId) {
          const rng = getRng();
          const pool = Object.keys(state.sects);
          sectId = pool.length ? rng.pick(pool) : undefined;
        }
        if (sectId && state.sects[sectId]) {
          c.sectId = sectId;
          c.flags.joined_sect = true;
          logs.push(`拜入${state.sects[sectId].name}。`);
          deltas.push(`門派＝${state.sects[sectId].name}`);
        }
        break;
      }
      case 'leaveSect':
        if (c.sectId) {
          const name = state.sects[c.sectId]?.name ?? '門派';
          c.sectId = null;
          logs.push(`你脫離了${name}。`);
        }
        break;
      case 'relationship': {
        const npc = state.npcs[eff.npcId];
        if (npc) {
          npc.affinity = clamp(npc.affinity + eff.delta, -100, 100);
          npc.memories.push(`第${state.year}年：因緣際會`);
        }
        break;
      }
      case 'lover': {
        if (eff.npcId === 'lover_candidate') ensureLoverCandidate(state);
        const npc = state.npcs[eff.npcId];
        if (npc) {
          c.loverId = eff.npcId;
          npc.role = 'lover';
          npc.affinity = Math.max(npc.affinity, 70);
          c.stats.lovers += 1;
          logs.push(`與${npc.name}結為眷屬。`);
        }
        break;
      }
      case 'memory': {
        if (eff.npcId === 'lover_candidate') ensureLoverCandidate(state);
        const npc = state.npcs[eff.npcId];
        if (npc) {
          npc.memories.push(eff.text);
          if (eff.affinity !== undefined) {
            npc.affinity = clamp(npc.affinity + eff.affinity, -100, 100);
          }
        }
        break;
      }
      case 'die':
        c.alive = false;
        c.health = 0;
        died = true;
        logs.push(eff.reason ?? '你撒手人寰。');
        break;
      default:
        break;
    }
  }

  if (c.money < 0) c.money = 0;
  if (c.health <= 0) {
    c.alive = false;
    died = true;
    if (!logs.some((l) => /撒手|身亡|離世|倒下/.test(l))) logs.push('氣血歸零，你倒下了。');
  }
  return { logs, died, deltas };
}

function ensureLoverCandidate(state: LifeGameState): void {
  if (state.npcs.lover_candidate) return;
  const rng = getRng();
  state.npcs.lover_candidate = {
    id: 'lover_candidate',
    name: randomChineseName(),
    gender: rng.chance(0.5) ? 'male' : 'female',
    role: 'friend',
    affinity: 30,
    memories: [],
    alive: true,
  };
}
