import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { artForStanding, getSectContent, sectStandingName } from '@data/content/packs';
import { skillLabel } from '@data/skills/catalog';
import { learnMartialArt } from './flavor';

const MAX_STANDING = 3;

export function ensureSectStanding(c: LifeGameState['character']): number {
  if (typeof c.sectStanding !== 'number' || Number.isNaN(c.sectStanding)) {
    c.sectStanding = c.sectId ? 0 : 0;
  }
  return c.sectStanding;
}

/** 嘗試提升門中地位，成功則傳授該階武學 */
export function tryGainSectStanding(state: LifeGameState, chance = 0.35): string | null {
  const c = state.character;
  if (!c.sectId) return null;
  const standing = ensureSectStanding(c);
  if (standing >= MAX_STANDING) return null;
  const rng = getRng();
  if (!rng.chance(chance)) return null;

  c.sectStanding = standing + 1;
  const name = sectStandingName(c.sectStanding);
  const sectName = getSectContent(c.sectId)?.name ?? state.sects[c.sectId]?.name ?? '門派';
  const lines: string[] = [`${sectName}擢你為「${name}」。`];
  const artId = artForStanding(c.sectId, c.sectStanding);
  if (artId && !c.skills.includes(artId)) {
    lines.push(learnMartialArt(state, artId));
  }
  return lines.join(' ');
}

export function teachSectArtForStanding(state: LifeGameState, standing: number): string | null {
  const c = state.character;
  if (!c.sectId) return null;
  const artId = artForStanding(c.sectId, standing);
  if (!artId || c.skills.includes(artId)) return null;
  return learnMartialArt(state, artId);
}

export function describeSectProgress(state: LifeGameState): string[] {
  const c = state.character;
  if (!c.sectId) return [];
  const sect = getSectContent(c.sectId);
  if (!sect) return [];
  const standing = ensureSectStanding(c);
  const lines = [
    `門中地位：${sectStandingName(standing)}`,
    `門風：${sect.trait}`,
  ];
  for (const art of sect.arts) {
    const learned = c.skills.includes(art.skillId);
    const rank = sectStandingName(art.standing);
    const artName = skillLabel(art.skillId);
    const locked = standing < art.standing && !learned;
    lines.push(
      learned
        ? `✓ ${rank} · ${artName}`
        : locked
          ? `○ ${rank} · ${artName}（需升至${rank}或奇遇）`
          : `○ ${rank} · ${artName}（可請長老傳授）`,
    );
  }
  return lines;
}
