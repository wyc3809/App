import type { LifeGameState, LifeNpc } from '@interfaces/lifeEngine';
import starterNpcs from '@content/npcs/starter_npcs.json';

type StarterNpc = {
  id: string;
  name: string;
  role: string;
  location_id?: string;
};

const ROLE_MAP: Record<string, LifeNpc['role']> = {
  塾師: 'master',
  醫館學徒: 'friend',
  武館教頭: 'master',
  茶客: 'friend',
  商人: 'friend',
};

function mapRole(role: string): LifeNpc['role'] {
  return ROLE_MAP[role] ?? 'friend';
}

/** 千燈鎮常駐人物（來自 content/npcs） */
export function buildStarterNpcs(): Record<string, LifeNpc> {
  const out: Record<string, LifeNpc> = {};
  for (const raw of starterNpcs as StarterNpc[]) {
    out[raw.id] = {
      id: raw.id,
      name: raw.name,
      gender: raw.id.includes('shen') || raw.name.includes('晴') ? 'female' : 'male',
      role: mapRole(raw.role),
      affinity: 25,
      memories: [`鎮裡人都識得這位${raw.role}`],
      alive: true,
    };
  }
  return out;
}

export function ensureStarterNpcs(state: LifeGameState): void {
  const starters = buildStarterNpcs();
  for (const [id, npc] of Object.entries(starters)) {
    if (!state.npcs[id]) state.npcs[id] = npc;
  }
}

export function rememberNpc(
  state: LifeGameState,
  npcId: string,
  memory: string,
  affinityDelta = 0,
): string[] {
  ensureStarterNpcs(state);
  const npc = state.npcs[npcId];
  if (!npc || !npc.alive) return [];
  if (!npc.memories.includes(memory)) {
    npc.memories = [...npc.memories, memory].slice(-8);
  }
  if (affinityDelta) {
    npc.affinity = Math.max(-100, Math.min(100, npc.affinity + affinityDelta));
  }
  return [`${npc.name}記住了這件事（情誼${affinityDelta >= 0 ? '＋' : ''}${affinityDelta || '如故'}）`];
}

export function listKnownNpcLines(state: LifeGameState): string[] {
  return Object.values(state.npcs)
    .filter((n) => n.alive && n.role !== 'parent')
    .slice(0, 8)
    .map((n) => {
      const bond =
        n.affinity >= 60 ? '深交' : n.affinity >= 30 ? '相識' : n.affinity >= 0 ? '點頭之交' : '有隙';
      const mem = n.memories[n.memories.length - 1];
      return `${n.name}（${bond}）${mem ? ` · ${mem}` : ''}`;
    });
}
