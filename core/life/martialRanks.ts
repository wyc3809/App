/** 九陰風格武學階位（原創表述，後台百分比進階） */
export const MARTIAL_RANKS = ['略有小成', '駕輕就熟', '融會貫通', '神乎其技'] as const;

export type MartialRankName = (typeof MARTIAL_RANKS)[number];

/** 當前階位 → 下一階的進階機率（後台用，不對玩家顯示） */
export const ADVANCE_CHANCE: Record<'practice' | 'combat', number[]> = {
  // index = 當前階；神乎其技(3) 不可再進
  practice: [0.28, 0.14, 0.055, 0],
  combat: [0.36, 0.18, 0.08, 0],
};

export function rankName(rank: number): MartialRankName {
  const i = Math.max(0, Math.min(3, Math.floor(rank)));
  return MARTIAL_RANKS[i];
}

export function ensureSkillRanks(ranks: Record<string, number> | undefined): Record<string, number> {
  return ranks ?? {};
}

export function grantSkillRank(
  ranks: Record<string, number>,
  skillId: string,
  startRank = 0,
): void {
  if (ranks[skillId] === undefined) ranks[skillId] = startRank;
}
