import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';
import { applyNatureDelta } from './nature';
import { learnMartialArt } from './flavor';
import { raiseBaseMaxQi } from './equipment';

/** 拜師後寫入師門絆 */
export function ensureMasterBond(state: LifeGameState, masterName: string): void {
  const c = state.character;
  if (c.flags.master_name) return;
  c.flags.master_name = masterName;
  c.flags.master_bond = 20;
  c.flags.master_months = 0;
}

export function getMasterName(state: LifeGameState): string | null {
  const n = state.character.flags.master_name;
  return typeof n === 'string' && n ? n : null;
}

export function tickBonds(state: LifeGameState): string[] {
  if (!state.character.alive) return [];
  const c = state.character;
  const lines: string[] = [];
  if (c.flags.master_name) {
    c.flags.master_months = (Number(c.flags.master_months ?? 0) || 0) + 1;
    const bond = Number(c.flags.master_bond ?? 0) || 0;
    // 偶爾自然親近
    if ((Number(c.flags.master_months) || 0) % 5 === 0 && bond < 80) {
      c.flags.master_bond = bond + 2;
    }
  }
  if (c.loverId && state.npcs[c.loverId]) {
    c.flags.lover_months = (Number(c.flags.lover_months ?? 0) || 0) + 1;
  }
  return lines;
}

/** 是否該掛師徒／俠侶抉擇事件 */
export function pickBondEvent(state: LifeGameState): GameEvent | null {
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;

  // 師徒：有師且未決裂／未雙修完成
  const master = getMasterName(state);
  const masterBond = Number(c.flags.master_bond ?? 0) || 0;
  const masterMonths = Number(c.flags.master_months ?? 0) || 0;
  if (
    master &&
    !c.flags.master_severed &&
    !c.flags.master_dual_done &&
    masterMonths >= 6 &&
    rng.chance(0.12 + Math.min(0.15, masterBond / 400))
  ) {
    snapshotRng(state);
    return buildMasterChoiceEvent(master, masterBond);
  }

  // 俠侶
  if (
    c.loverId &&
    state.npcs[c.loverId] &&
    !c.flags.lover_severed &&
    !c.flags.lover_dual_done &&
    (Number(c.flags.lover_months ?? 0) || 0) >= 4 &&
    rng.chance(0.1)
  ) {
    const lover = state.npcs[c.loverId]!;
    snapshotRng(state);
    return buildLoverChoiceEvent(c.loverId, lover.name, lover.affinity ?? 50);
  }

  snapshotRng(state);
  return null;
}

function buildMasterChoiceEvent(master: string, bond: number): GameEvent {
  return {
    id: 'play_master_fork',
    title: '師門心結',
    body: `${master}召你至後山。燈影下，他似有話要說——是傳你不傳之秘，還是責你心性有虧？`,
    tags: ['story', 'master', 'bond'],
    weight: 0,
    choices: [
      {
        id: 'dual',
        text: '跪求雙修心法',
        outcomes: [
          {
            id: 'dual_ok',
            weight: bond >= 40 ? 3 : 1,
            effects: [
              {
                type: 'narrate',
                text: `${master}沉默半晌，終將掌心內息渡來。你與師門羈絆更深。`,
              },
              { type: 'flag', key: 'master_dual_done', value: true },
              { type: 'flag', key: 'master_bond', value: Math.min(100, bond + 25) },
              { type: 'martial', amount: 3 },
              { type: 'maxQi', amount: 20 },
              { type: 'nature', delta: { xia: 1 } },
            ],
          },
          {
            id: 'dual_fail',
            weight: bond >= 40 ? 1 : 2,
            effects: [
              {
                type: 'narrate',
                text: `${master}搖頭：「火候未到。」你退下，心中又愧又急。`,
              },
              { type: 'flag', key: 'master_bond', value: Math.max(0, bond - 5) },
            ],
          },
        ],
      },
      {
        id: 'sever',
        text: '抗命離去',
        outcomes: [
          {
            id: 'sever_ok',
            weight: 1,
            effects: [
              {
                type: 'narrate',
                text: `你對${master}一揖，轉身下山。師門之路，從此兩斷。`,
              },
              { type: 'flag', key: 'master_severed', value: true },
              { type: 'reputation', amount: -4 },
              { type: 'nature', delta: { kuang: 1, xia: -1 } },
            ],
          },
        ],
      },
      {
        id: 'wait',
        text: '恭敬退下',
        outcomes: [
          {
            id: 'wait_ok',
            weight: 1,
            effects: [
              { type: 'narrate', text: '你退下靜室，把話吞回腹中。師恩如山，不敢輕動。' },
              { type: 'flag', key: 'master_bond', value: Math.min(100, bond + 3) },
            ],
          },
        ],
      },
    ],
  };
}

function buildLoverChoiceEvent(loverId: string, loverName: string, affinity: number): GameEvent {
  return {
    id: 'play_lover_fork',
    title: '枕邊風雨',
    body: `${loverName}望著窗外夜色，忽然問你：若江湖與我只能擇一，你會如何？`,
    tags: ['story', 'romance', 'bond'],
    weight: 0,
    choices: [
      {
        id: 'bond',
        text: '許諾相守',
        outcomes: [
          {
            id: 'bond_ok',
            weight: affinity >= 50 ? 3 : 1,
            effects: [
              {
                type: 'narrate',
                text: `${loverName}眼中有光。你們約下「同生共死」四字，心緒皆定。`,
              },
              { type: 'flag', key: 'lover_dual_done', value: true },
              { type: 'relationship', npcId: loverId, delta: 15 },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'reputation', amount: 2 },
            ],
          },
          {
            id: 'bond_soft',
            weight: 1,
            effects: [
              {
                type: 'narrate',
                text: `${loverName}笑了笑，似信非信。你們仍並肩，卻多了一層薄霧。`,
              },
              { type: 'relationship', npcId: loverId, delta: 5 },
            ],
          },
        ],
      },
      {
        id: 'sever',
        text: '以江湖為重',
        outcomes: [
          {
            id: 'sever_ok',
            weight: 1,
            effects: [
              {
                type: 'narrate',
                text: `${loverName}沉默良久，終將定情物推還。從此花開兩岸。`,
              },
              { type: 'flag', key: 'lover_severed', value: true },
              { type: 'flag', key: 'loverId_clear', value: true },
              { type: 'nature', delta: { e: 1, xia: -1 } },
              { type: 'reputation', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'dodge',
        text: '顧左右而言他',
        outcomes: [
          {
            id: 'dodge_ok',
            weight: 1,
            effects: [
              {
                type: 'narrate',
                text: '你扯開話題。燈花爆了一聲，誰也沒再追問。',
              },
              { type: 'relationship', npcId: loverId, delta: -3 },
            ],
          },
        ],
      },
    ],
  };
}

/** 清理非法 effect；雙修成功額外獎勵在 resolve 後補 */
export function applyBondSideEffects(state: LifeGameState, logs: string[]): string[] {
  const c = state.character;
  const out = [...logs];
  if (c.flags.loverId_clear) {
    delete c.flags.loverId_clear;
    if (c.loverId && state.npcs[c.loverId]) {
      state.npcs[c.loverId]!.role = 'friend';
      state.npcs[c.loverId]!.affinity = Math.min(state.npcs[c.loverId]!.affinity ?? 0, 20);
    }
    c.loverId = null;
  }
  if (c.flags.master_dual_done && !c.flags.master_dual_rewarded) {
    c.flags.master_dual_rewarded = true;
    raiseBaseMaxQi(c, 15);
    if (!c.skills.includes('art_tiger_breath')) {
      out.push(learnMartialArt(state, 'art_tiger_breath', '虎嘯內勁'));
    }
    applyNatureDelta(c, { xia: 1 });
  }
  return out;
}
