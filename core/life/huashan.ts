import type {
  ContestantBuild,
  HuashanBracketMatch,
  HuashanBracketState,
  LifeGameState,
} from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { ensureGear } from './equipment';
import { pushChronicle } from './chronicle';
import { snapshotRng, syncRngFromState } from './gameState';
import { defaultAttributes, simulateContestDuel } from './duelSim';

export const HUASHAN_MIN_AGE = 16;
export const HUASHAN_MIN_MARTIAL = 12;
export const HUASHAN_FATIGUE_COST = 18;
export const HUASHAN_BRACKET_SIZE = 8;

const ROUND_LABEL: Record<1 | 2 | 3, string> = {
  1: '八強戰',
  2: '四強戰',
  3: '決賽',
};

const GHOST_TEMPLATES: {
  name: string;
  skills: string[];
  ranks: number[];
  martialDelta: number;
  gear: string[];
  weapon: string;
  armor: string;
}[] = [
  {
    name: '鐵笛道人',
    skills: ['基礎吐納', 'art_river_fist'],
    ranks: [0, 0],
    martialDelta: -6,
    gear: ['old-sword', 'plain-robe'],
    weapon: 'old-sword',
    armor: 'plain-robe',
  },
  {
    name: '峨眉俗家弟子',
    skills: ['基礎吐納', 'art_stone_palm'],
    ranks: [0, 1],
    martialDelta: -2,
    gear: ['iron-blade', 'plain-robe'],
    weapon: 'iron-blade',
    armor: 'plain-robe',
  },
  {
    name: '青城劍客',
    skills: ['基礎吐納', 'art_tomb_sword'],
    ranks: [1, 0],
    martialDelta: 0,
    gear: ['inkrain-sword', 'pine-armor'],
    weapon: 'inkrain-sword',
    armor: 'pine-armor',
  },
  {
    name: '神拳門好手',
    skills: ['基礎吐納', 'art_river_fist', 'art_stone_palm'],
    ranks: [1, 1, 0],
    martialDelta: 3,
    gear: ['hundredfold-blade', 'pine-armor'],
    weapon: 'hundredfold-blade',
    armor: 'pine-armor',
  },
  {
    name: '崆峒俗家',
    skills: ['基礎吐納', 'art_bridge_step'],
    ranks: [1, 1],
    martialDelta: 5,
    gear: ['iron-blade', 'pine-armor'],
    weapon: 'iron-blade',
    armor: 'pine-armor',
  },
  {
    name: '江南快刀',
    skills: ['基礎吐納', 'art_stone_palm'],
    ranks: [1, 2],
    martialDelta: 8,
    gear: ['hundredfold-blade', 'pine-armor'],
    weapon: 'hundredfold-blade',
    armor: 'pine-armor',
  },
  {
    name: '華山棄徒',
    skills: ['基礎吐納', 'art_tomb_sword'],
    ranks: [2, 1],
    martialDelta: 11,
    gear: ['inkrain-sword', 'pine-armor'],
    weapon: 'inkrain-sword',
    armor: 'pine-armor',
  },
];

/** 賽季鍵：以 UTC+8 的 ISO 週為準 */
export function getHuashanSeasonKey(now = new Date()): string {
  const utc8 = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const d = new Date(Date.UTC(utc8.getUTCFullYear(), utc8.getUTCMonth(), utc8.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function huashanSeasonLabel(seasonKey: string): string {
  return seasonKey.replace('-W', '年 第') + '週';
}

export function snapshotContestantFromLife(state: LifeGameState): ContestantBuild {
  const c = state.character;
  ensureGear(c);
  const attrs = {} as Record<(typeof wuxiaAttributeKeys)[number], number>;
  for (const k of wuxiaAttributeKeys) attrs[k] = c.attributes[k];
  return {
    id: 'player',
    name: c.name,
    martial: c.martial,
    reputation: c.reputation,
    age: c.age,
    maxHealth: c.maxHealth,
    maxQi: c.maxQi ?? 120,
    attributes: attrs,
    skills: [...c.skills],
    skillRanks: { ...(c.skillRanks ?? {}) },
    gear: [...(c.gear ?? [])],
    equipment: { ...c.equipment },
    isPlayer: true,
  };
}

function buildGhost(id: string, templateIndex: number, playerMartial: number, rng: ReturnType<typeof getRng>): ContestantBuild {
  const t = GHOST_TEMPLATES[templateIndex % GHOST_TEMPLATES.length]!;
  const martial = Math.max(8, playerMartial + t.martialDelta + rng.nextInt(-2, 2));
  const attrs = defaultAttributes(martial);
  const skillRanks: Record<string, number> = {};
  t.skills.forEach((sid, i) => {
    skillRanks[sid] = t.ranks[i] ?? 0;
  });
  const maxHealth = 160 + Math.floor(attrs.genGu * 2.2);
  const maxQi = 120 + Math.floor(attrs.wuXing * 2);
  return {
    id,
    name: t.name,
    martial,
    reputation: Math.max(0, martial * 2 + rng.nextInt(0, 20)),
    age: rng.nextInt(22, 48),
    maxHealth,
    maxQi,
    attributes: attrs,
    skills: [...t.skills],
    skillRanks,
    gear: [...t.gear],
    equipment: { weapon: t.weapon, armor: t.armor, accessory: null },
  };
}

function shuffleIds(ids: string[], rng: ReturnType<typeof getRng>): string[] {
  const out = [...ids];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.nextInt(0, i);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function createInitialMatches(slotIds: string[]): HuashanBracketMatch[] {
  const matches: HuashanBracketMatch[] = [];
  for (let i = 0; i < 4; i += 1) {
    matches.push({
      id: `r1m${i}`,
      round: 1,
      aId: slotIds[i * 2]!,
      bId: slotIds[i * 2 + 1]!,
      resolved: false,
    });
  }
  matches.push({ id: 'r2m0', round: 2, aId: '', bId: '', resolved: false });
  matches.push({ id: 'r2m1', round: 2, aId: '', bId: '', resolved: false });
  matches.push({ id: 'r3f', round: 3, aId: '', bId: '', resolved: false });
  return matches;
}

function matchInvolvesPlayer(m: HuashanBracketMatch, playerId: string): boolean {
  return m.aId === playerId || m.bId === playerId;
}

function duelSeed(seasonKey: string, matchId: string, stateSeed: number): number {
  let h = stateSeed >>> 0;
  for (const ch of `${seasonKey}:${matchId}`) {
    h = (Math.imul(31, h) + ch.charCodeAt(0)) >>> 0;
  }
  return h || 1;
}

function resolveMatch(
  bracket: HuashanBracketState,
  m: HuashanBracketMatch,
  stateSeed: number,
  aIsPlayer: boolean,
): void {
  const a = bracket.contestants[m.aId];
  const b = bracket.contestants[m.bId];
  if (!a || !b) return;
  const title = `華山論劍·${ROUND_LABEL[m.round]}`;
  const result = simulateContestDuel({
    title,
    a,
    b,
    seed: duelSeed(bracket.seasonKey, m.id, stateSeed),
    aIsPlayer,
  });
  m.winnerId = result.winnerId;
  m.log = result.log;
  m.resolved = true;
}

function fillNextRound(bracket: HuashanBracketState): void {
  const r1 = bracket.matches.filter((m) => m.round === 1);
  const r2 = bracket.matches.filter((m) => m.round === 2);
  const r3 = bracket.matches.find((m) => m.round === 3);
  if (r1.every((m) => m.resolved) && r2[0] && !r2[0].aId) {
    r2[0].aId = r1[0]!.winnerId!;
    r2[0].bId = r1[1]!.winnerId!;
    r2[1]!.aId = r1[2]!.winnerId!;
    r2[1]!.bId = r1[3]!.winnerId!;
  }
  if (r2.every((m) => m.resolved && m.aId && m.bId) && r3 && !r3.aId) {
    r3.aId = r2[0]!.winnerId!;
    r3.bId = r2[1]!.winnerId!;
  }
}

function nextOpenMatch(bracket: HuashanBracketState): HuashanBracketMatch | undefined {
  fillNextRound(bracket);
  return bracket.matches.find((m) => !m.resolved && m.aId && m.bId);
}

function autoResolveGhosts(state: LifeGameState, bracket: HuashanBracketState): void {
  const playerId = bracket.playerId;
  for (;;) {
    fillNextRound(bracket);
    const m = nextOpenMatch(bracket);
    if (!m) {
      bracket.pendingMatchId = undefined;
      if (bracket.matches.every((x) => !x.aId || !x.bId || x.resolved)) {
        finishBracket(state, bracket);
      }
      return;
    }
    if (matchInvolvesPlayer(m, playerId)) {
      bracket.pendingMatchId = m.id;
      return;
    }
    resolveMatch(bracket, m, state.seed, false);
  }
}

function placementFromLossRound(round: 1 | 2 | 3): number {
  if (round === 3) return 2;
  if (round === 2) return 4;
  return 8;
}

function finishBracket(state: LifeGameState, bracket: HuashanBracketState): void {
  const final = bracket.matches.find((m) => m.round === 3);
  if (!final?.winnerId) {
    bracket.status = 'completed';
    bracket.placement = 8;
    return;
  }
  bracket.status = 'completed';
  if (final.winnerId === bracket.playerId) {
    bracket.placement = 1;
  } else {
    bracket.placement = 2;
  }
  applyHuashanRewards(state, bracket.placement);
  state.character.flags.huashan_last_season = bracket.seasonKey;
  pushChronicle(state, [
    `【華山論劍】本屆落幕，你的名次：第 ${bracket.placement} 名。`,
  ]);
}

export function applyHuashanRewards(state: LifeGameState, placement: number): string[] {
  const c = state.character;
  const lines: string[] = [];
  const rep =
    placement === 1 ? 28 : placement === 2 ? 18 : placement <= 4 ? 10 : placement <= 8 ? 5 : 2;
  const money =
    placement === 1 ? 120 : placement === 2 ? 70 : placement <= 4 ? 40 : 20;
  const martial =
    placement === 1 ? 5 : placement === 2 ? 3 : placement <= 4 ? 2 : 1;
  c.reputation += rep;
  c.money += money;
  c.martial += martial;
  c.fatigue = Math.min(100, c.fatigue + 8);
  lines.push(`名望＋${rep}，銀兩＋${money}，武學＋${martial}`);
  if (placement === 1) {
    c.flags.title_huashan_champion = bracketSeasonFlag(state);
    lines.push('獲得稱號「華山論劍冠軍」。');
  } else if (placement <= 4) {
    lines.push('晉身四強，江湖傳聞又起。');
  }
  return lines;
}

function bracketSeasonFlag(state: LifeGameState): string {
  return state.huashan?.seasonKey ?? getHuashanSeasonKey();
}

export function canEnterHuashan(state: LifeGameState): { ok: true } | { ok: false; reason: string } {
  const c = state.character;
  if (!c.alive || state.phase !== 'playing') return { ok: false, reason: '此刻無法論劍。' };
  if (state.pending || state.pendingCombat) return { ok: false, reason: '尚有要事未了。' };
  if (c.age < HUASHAN_MIN_AGE) return { ok: false, reason: `需滿 ${HUASHAN_MIN_AGE} 歲方可登山。` };
  if (c.martial < HUASHAN_MIN_MARTIAL) return { ok: false, reason: `武學需達 ${HUASHAN_MIN_MARTIAL} 以上。` };
  const season = getHuashanSeasonKey();
  if (c.flags.huashan_last_season === season) return { ok: false, reason: '本週已參與過華山論劍。' };
  if (state.huashan?.status === 'active') return { ok: false, reason: '本屆論劍尚未結束。' };
  if (c.fatigue + HUASHAN_FATIGUE_COST > 100) return { ok: false, reason: '疲勞過重，需調息後再來。' };
  return { ok: true };
}

export function startHuashanBracket(state: LifeGameState): string[] {
  const gate = canEnterHuashan(state);
  if (!gate.ok) return [gate.reason];
  syncRngFromState(state);
  const rng = getRng();
  const seasonKey = getHuashanSeasonKey();
  const player = snapshotContestantFromLife(state);
  player.id = 'player';

  const contestants: Record<string, ContestantBuild> = { player };
  for (let i = 0; i < 7; i += 1) {
    const id = `ghost_${i}`;
    contestants[id] = buildGhost(id, i, player.martial, rng);
  }

  const ids = shuffleIds(Object.keys(contestants), rng);
  const matches = createInitialMatches(ids);
  const bracket: HuashanBracketState = {
    seasonKey,
    contestants,
    playerId: player.id,
    matches,
    status: 'active',
    fatigueCostPaid: true,
  };
  state.character.fatigue = Math.min(100, state.character.fatigue + HUASHAN_FATIGUE_COST);
  state.huashan = bracket;
  snapshotRng(state);

  const lines = [
    `【華山論劍】你持帖上山，本屆${huashanSeasonLabel(seasonKey)}，八強單淘汰。`,
    '其餘七席為江湖幽靈名手，論劍不問生死，只較一招一式。',
  ];
  pushChronicle(state, [lines[0]!]);
  autoResolveGhosts(state, bracket);
  if (bracket.pendingMatchId) {
    const m = bracket.matches.find((x) => x.id === bracket.pendingMatchId)!;
    const foeId = m.aId === player.id ? m.bId : m.aId;
    const foe = bracket.contestants[foeId]!;
    lines.push(`下一戰·${ROUND_LABEL[m.round]}：對手「${foe.name}」。`);
  }
  return lines;
}

export function getPendingHuashanMatch(
  bracket: HuashanBracketState,
): { match: HuashanBracketMatch; player: ContestantBuild; foe: ContestantBuild } | null {
  if (!bracket.pendingMatchId) return null;
  const match = bracket.matches.find((m) => m.id === bracket.pendingMatchId);
  if (!match || match.resolved) return null;
  const player = bracket.contestants[bracket.playerId];
  if (!player) return null;
  const foeId = match.aId === bracket.playerId ? match.bId : match.aId;
  const foe = bracket.contestants[foeId];
  if (!foe) return null;
  return { match, player, foe };
}

export function runPlayerHuashanDuel(state: LifeGameState): string[] {
  const bracket = state.huashan;
  if (!bracket || bracket.status !== 'active' || !bracket.pendingMatchId) {
    return ['此刻沒有待戰的論劍。'];
  }
  const pending = getPendingHuashanMatch(bracket);
  if (!pending) return ['對陣資料有誤。'];
  const { match, player, foe } = pending;
  const playerIsA = match.aId === bracket.playerId;
  const a = playerIsA ? player : foe;
  const b = playerIsA ? foe : player;
  const result = simulateContestDuel({
    title: `華山論劍·${ROUND_LABEL[match.round]}`,
    a,
    b,
    seed: duelSeed(bracket.seasonKey, match.id, state.seed),
    aIsPlayer: playerIsA,
  });
  match.winnerId = result.winnerId;
  match.log = result.log;
  match.resolved = true;
  bracket.lastDuelLog = result.log;
  bracket.pendingMatchId = undefined;

  const lines = [...result.log];
  const playerWon = result.winnerId === bracket.playerId;

  if (!playerWon) {
    bracket.status = 'completed';
    bracket.placement = placementFromLossRound(match.round);
    applyHuashanRewards(state, bracket.placement);
    state.character.flags.huashan_last_season = bracket.seasonKey;
    lines.push(`你止步於${ROUND_LABEL[match.round]}，本屆第 ${bracket.placement} 名。`);
    pushChronicle(state, [`【華山論劍】${lines[lines.length - 1]}`]);
    snapshotRng(state);
    return lines;
  }

  lines.push(`你勝過「${foe.name}」，晉級。`);
  pushChronicle(state, [`【華山論劍】${ROUND_LABEL[match.round]}告捷。`]);

  autoResolveGhosts(state, bracket);
  if (bracket.pendingMatchId) {
    const next = getPendingHuashanMatch(bracket);
    if (next) {
      lines.push(`下一戰·${ROUND_LABEL[next.match.round]}：對手「${next.foe.name}」。`);
    }
  } else if (bracket.placement === 1) {
    lines.push('你登頂華山，本屆論劍冠軍！');
  }
  snapshotRng(state);
  return lines;
}

export function dismissHuashanReport(state: LifeGameState): void {
  if (state.huashan) state.huashan.lastDuelLog = undefined;
}

export function clearCompletedHuashan(state: LifeGameState): void {
  if (state.huashan?.status === 'completed') {
    state.huashan = undefined;
  }
}

export function bracketProgressLabel(bracket: HuashanBracketState): string {
  const done = bracket.matches.filter((m) => m.resolved && m.round === 1).length;
  if (bracket.status === 'completed') {
    return `已結束·第 ${bracket.placement ?? '?'} 名`;
  }
  if (bracket.pendingMatchId) {
    const m = bracket.matches.find((x) => x.id === bracket.pendingMatchId);
    return m ? `待戰·${ROUND_LABEL[m.round]}` : '待戰';
  }
  return `進行中·八強 ${done}/4`;
}

export { ROUND_LABEL };
