/** 首局教練文案（鎮居）——語氣與卷面一致 */

export type CoachStep = 'flip' | 'choice' | 'practice' | 'done';

export function coachCopy(step: CoachStep): { title: string; body: string } | null {
  switch (step) {
    case 'flip':
      return {
        title: '開卷第一筆',
        body: '點「翻過一頁」，歲月前移一月。機緣、路遇與抉擇，皆在紙上自來。',
      };
    case 'choice':
      return {
        title: '事來則斷',
        body: '有事時擇甲、乙、丙。銀兩、名望、武學乃至生死，皆因一念落下。',
      };
    case 'practice':
      return {
        title: '閒時可煉',
        body: '無事可去「修煉」苦練；每月次數有限。華山論劍，在「江湖」卷中。',
      };
    default:
      return null;
  }
}

export function nextCoachStep(flags: Record<string, boolean | number | string>): CoachStep {
  if (flags.coach_done) return 'done';
  if (!flags.coach_flipped) return 'flip';
  if (!flags.coach_chose) return 'choice';
  if (!flags.coach_practiced) return 'practice';
  return 'done';
}
