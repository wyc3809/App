/** 九陰風格武學階位（原創表述） */
export const MARTIAL_RANKS = ['略有小成', '駕輕就熟', '融會貫通', '神乎其技'] as const;

export type MartialRankName = (typeof MARTIAL_RANKS)[number];

/**
 * 各階升至下一階所需「戰鬥等值次數」區間（漸進變慢）
 * 0→1：約 10–30 次；1→2：約 50–60；2→3：約 90–120
 */
export const ADVANCE_COMBAT_BANDS: ReadonlyArray<{ min: number; max: number }> = [
  { min: 10, max: 30 },
  { min: 50, max: 60 },
  { min: 90, max: 120 },
];

/** 修煉相對戰鬥的進度折算（修煉較慢） */
export const PRACTICE_PROGRESS_WEIGHT = 0.35;

/** 階位對招式威力倍率：rank 0→1.0，每升一階 +25% */
export function rankPowerMult(rank: number): number {
  const r = Math.max(0, Math.min(3, Math.floor(rank)));
  return 1 + r * 0.25;
}

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

export function rollAdvanceNeed(
  currentRank: number,
  rng: { nextInt: (a: number, b: number) => number },
): number {
  const band = ADVANCE_COMBAT_BANDS[currentRank];
  if (!band) return Number.POSITIVE_INFINITY;
  return rng.nextInt(band.min, band.max);
}
