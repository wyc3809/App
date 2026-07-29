import { skillLabel } from '@data/skills/catalog';

/** 玩家可見文案：過濾占位英文、技術 id */
const CHOICE_FALLBACK: Record<string, string> = {
  accept: '應允',
  study: '鑽研',
  copy: '抄錄',
  leave: '離去',
  refuse: '婉拒',
  fight: '應戰',
  flee: '避戰',
  draw: '拔劍',
};

export function displayChoiceText(text: string | undefined, choiceId?: string): string {
  const raw = (text ?? '').trim();
  if (!raw || /^none$/i.test(raw)) {
    return CHOICE_FALLBACK[choiceId ?? ''] ?? '抉擇';
  }
  if (/^[a-z][a-z0-9_]*$/i.test(raw) && raw.includes('_')) {
    return CHOICE_FALLBACK[choiceId ?? ''] ?? '抉擇';
  }
  return raw;
}

export function displaySkillName(skillId: string, displayName?: string): string {
  const name = (displayName ?? '').trim();
  if (name && !/^[a-z][a-z0-9_]*$/i.test(name)) return name;
  return skillLabel(skillId);
}
