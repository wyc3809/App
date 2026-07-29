import sectsJson from '@content/sects/sects.json';
import martialJson from '@content/martial/catalog.json';
import familyJson from '@content/family/rules.json';
import storyJson from '@content/story/chapters.json';

export interface SectRankDef {
  standing: number;
  name: string;
  hint: string;
}

export interface SectArtSlot {
  skillId: string;
  standing: number;
}

export interface SectContentDef {
  id: string;
  name: string;
  hint: string;
  trait: string;
  arts: SectArtSlot[];
}

export interface FamilyRules {
  lifetimeChildrenMin: number;
  lifetimeChildrenMax: number;
  monthlyBirthChance: number;
  minAge: number;
  maxAge: number;
  cooldownMonths: number;
  requireLover: boolean;
  notes?: string;
}

export interface StoryChapterDef {
  chapter: number;
  title: string;
  goal: string;
  nextMilestone: number;
}

export const SECT_RANKS: SectRankDef[] = sectsJson.ranks as SectRankDef[];
export const SECT_CONTENT: SectContentDef[] = sectsJson.sects as SectContentDef[];
export const FAMILY_RULES: FamilyRules = familyJson as FamilyRules;
export const STORY_CHAPTERS: StoryChapterDef[] = storyJson.chapters as StoryChapterDef[];
export const MARTIAL_CATALOG_RAW = martialJson;

export function getSectContent(id: string): SectContentDef | undefined {
  return SECT_CONTENT.find((s) => s.id === id);
}

export function sectStandingName(standing: number): string {
  const rank = SECT_RANKS.find((r) => r.standing === standing) ?? SECT_RANKS[0];
  return rank?.name ?? '外門弟子';
}

export function artForStanding(sectId: string, standing: number): string | undefined {
  const sect = getSectContent(sectId);
  return sect?.arts.find((a) => a.standing === standing)?.skillId;
}

export function listSectArts(sectId: string): SectArtSlot[] {
  return getSectContent(sectId)?.arts ?? [];
}
