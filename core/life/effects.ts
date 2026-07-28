import type { GameEffect, LifeGameState, WuxiaAttribute } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { randomChineseName } from '@core/ids';

export interface EffectResult {
  logs: string[];
  died: boolean;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

export function applyEffects(state: LifeGameState, effects: GameEffect[]): EffectResult {
  const logs: string[] = [];
  let died = false;
  const c = state.character;

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
        if (eff.amount !== 0) logs.push(eff.amount > 0 ? `銀兩 +${eff.amount}` : `銀兩 ${eff.amount}`);
        break;
      case 'health':
        c.health = clamp(c.health + eff.amount, 0, c.maxHealth);
        if (eff.amount < 0) logs.push(`氣血 ${eff.amount}`);
        break;
      case 'reputation':
        c.reputation += eff.amount;
        if (eff.amount !== 0) logs.push(`名望 ${eff.amount > 0 ? '+' : ''}${eff.amount}`);
        break;
      case 'martial':
        c.martial += eff.amount;
        if (eff.amount !== 0) logs.push(`武學 ${eff.amount > 0 ? '+' : ''}${eff.amount}`);
        break;
      case 'flag':
        c.flags[eff.key] = eff.value;
        break;
      case 'worldFlag':
        state.worldFlags[eff.key] = eff.value;
        break;
      case 'learnSkill': {
        if (!c.skills.includes(eff.skillId)) {
          c.skills.push(eff.skillId);
          logs.push(`習得武功：${eff.name ?? eff.skillId}`);
        }
        break;
      }
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
        if (eff.npcId === 'lover_candidate') {
          ensureLoverCandidate(state);
        }
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
        if (eff.npcId === 'lover_candidate') {
          ensureLoverCandidate(state);
        }
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
  return { logs, died };
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
