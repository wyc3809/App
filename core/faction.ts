import type {
  CharacterEntity,
  Faction,
  FactionMembership,
  FactionRank,
  GameState,
} from '@interfaces/game';
import { getRng } from './random';

const RANK_ORDER: FactionRank[] = ['outer', 'inner', 'elite', 'elder', 'leader'];

const RANK_LABELS: Record<FactionRank, string> = {
  outer: '外門弟子',
  inner: '內門弟子',
  elite: '精英弟子',
  elder: '長老',
  leader: '掌門',
};

export function rankLabel(rank: FactionRank): string {
  return RANK_LABELS[rank];
}

export function getFactionMembers(state: GameState, factionId: string): CharacterEntity[] {
  const f = state.factions[factionId];
  if (!f) return [];
  return f.memberIds
    .map((id) => state.characters[id])
    .filter((c): c is CharacterEntity => !!c && c.alive);
}

export function syncFactionMemberList(state: GameState, factionId: string): void {
  const f = state.factions[factionId];
  if (!f) return;
  f.memberIds = Object.values(state.characters)
    .filter((c) => c.alive && c.factionId === factionId)
    .map((c) => c.id);
}

export function setMembership(
  character: CharacterEntity,
  membership: FactionMembership | undefined,
  state: GameState,
): void {
  const prev = character.factionId;
  if (membership) {
    character.factionMembership = membership;
    character.factionId = membership.factionId;
    syncFactionMemberList(state, membership.factionId);
  } else {
    character.factionMembership = undefined;
    character.factionId = undefined;
    if (prev) syncFactionMemberList(state, prev);
  }
}

export interface JoinEligibility {
  ok: boolean;
  reason?: string;
}

export function checkJoinFaction(
  state: GameState,
  character: CharacterEntity,
  factionId: string,
): JoinEligibility {
  const faction = state.factions[factionId];
  if (!faction) return { ok: false, reason: '門派不存在。' };
  if (character.factionId) return { ok: false, reason: '你已有所屬，需先脫離。' };
  if (!character.alive) return { ok: false, reason: '無法入派。' };

  const independence = character.personality.traits.independence ?? 50;
  if (independence > 88 && faction.type === 'sect') {
    return { ok: false, reason: '你性情孤傲，難入門牆。' };
  }

  if (faction.type === 'court' && character.reputation < 15) {
    return { ok: false, reason: '朝廷門戶需一定名望。' };
  }
  if (faction.type === 'bandit' && (character.personality.traits.honor ?? 50) > 75) {
    return { ok: false, reason: '你恥與綠林為伍。' };
  }
  if (faction.type === 'sect' && character.martialSkill < 8) {
    return { ok: false, reason: '武學根基太淺，無人收徒。' };
  }

  const members = getFactionMembers(state, factionId);
  if (members.length >= 40) {
    return { ok: false, reason: '名額已滿。' };
  }

  return { ok: true };
}

export function joinFaction(
  state: GameState,
  character: CharacterEntity,
  factionId: string,
): JoinEligibility {
  const check = checkJoinFaction(state, character, factionId);
  if (!check.ok) return check;

  const membership: FactionMembership = {
    factionId,
    rank: 'outer',
    merit: 0,
    joinedAt: { ...state.timestamp },
  };
  setMembership(character, membership, state);
  character.personality.traits.loyalty = Math.min(
    100,
    (character.personality.traits.loyalty ?? 50) + 5,
  );
  return { ok: true };
}

export function leaveFaction(state: GameState, character: CharacterEntity): string | null {
  if (!character.factionId || !character.factionMembership) {
    return '你並無門派。';
  }
  const faction = state.factions[character.factionId];
  const name = faction?.name ?? '門派';
  if (character.factionMembership.rank === 'leader') {
    return '掌門之位不可輕易棄守，需傳位或遭廢黜。';
  }
  setMembership(character, undefined, state);
  character.personality.traits.loyalty = Math.max(
    0,
    (character.personality.traits.loyalty ?? 50) - 8,
  );
  return `你脫離了${name}。`;
}

export function addMerit(character: CharacterEntity, amount: number): void {
  if (!character.factionMembership) return;
  character.factionMembership.merit += amount;
  tryPromote(character);
}

function tryPromote(character: CharacterEntity): void {
  const m = character.factionMembership;
  if (!m || m.rank === 'leader') return;
  const thresholds: Record<FactionRank, number> = {
    outer: 0,
    inner: 30,
    elite: 80,
    elder: 160,
    leader: 9999,
  };
  const idx = RANK_ORDER.indexOf(m.rank);
  if (idx < 0 || idx >= RANK_ORDER.length - 1) return;
  const next = RANK_ORDER[idx + 1];
  if (m.merit >= thresholds[next]) {
    m.rank = next;
  }
}

export function factionTrainingBonus(character: CharacterEntity, faction: Faction): number {
  if (!character.factionId || character.factionId !== faction.id) return 0;
  const typeBonus =
    faction.type === 'sect' ? 2 : faction.type === 'court' ? 1 : faction.type === 'guild' ? 0 : 1;
  const rankIdx = character.factionMembership
    ? RANK_ORDER.indexOf(character.factionMembership.rank)
    : 0;
  return typeBonus + Math.max(0, rankIdx);
}

export function pickRivalTarget(state: GameState, faction: Faction): Faction | null {
  for (const rid of faction.rivalFactionIds) {
    const rival = state.factions[rid];
    if (rival) return rival;
  }
  const others = Object.values(state.factions).filter(
    (f) => f.id !== faction.id && f.type !== faction.type,
  );
  return others[0] ?? null;
}

/** 每 tick 門派層級模擬 */
export function factionWorldTick(state: GameState): void {
  const rng = getRng();
  for (const faction of Object.values(state.factions)) {
    syncFactionMemberList(state, faction.id);
    const members = getFactionMembers(state, faction.id);
    if (!members.length) continue;

    if (!faction.leaderId || !state.characters[faction.leaderId]?.alive) {
      const candidate = members.sort(
        (a, b) => (b.factionMembership?.merit ?? 0) - (a.factionMembership?.merit ?? 0),
      )[0];
      if (candidate) {
        faction.leaderId = candidate.id;
        if (candidate.factionMembership) {
          candidate.factionMembership.rank = 'leader';
        }
      }
    }

    if (rng.chance(0.004)) {
      faction.treasury += rng.nextInt(1, 20);
    }

    if (rng.chance(0.002) && faction.rivalFactionIds.length) {
      const rival = state.factions[rng.pick(faction.rivalFactionIds)];
      if (rival) {
        faction.reputation = Math.max(0, faction.reputation - rng.nextInt(1, 5));
        rival.reputation = Math.max(0, rival.reputation - rng.nextInt(1, 5));
      }
    }
  }
}

export function listJoinableFactions(state: GameState, character: CharacterEntity): Faction[] {
  return Object.values(state.factions).filter((f) => checkJoinFaction(state, character, f.id).ok);
}
