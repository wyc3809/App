/** 首局教練文案（鎮居） */

export type CoachStep = 'flip' | 'choice' | 'practice' | 'done';

export function coachCopy(step: CoachStep): { title: string; body: string } | null {
  switch (step) {
    case 'flip':
      return {
        title: '開卷第一筆',
        body: '點「翻過一頁」推進一月。歲月會推來機緣、路遇與抉擇。',
      };
    case 'choice':
      return {
        title: '事來則斷',
        body: '有事時點甲／乙／丙。選擇會留下銀兩、名望、武學或生死的墨跡。',
      };
    case 'practice':
      return {
        title: '閒時可煉',
        body: '無要事時可切「修煉」苦練；每月次數有限。華山論劍在「江湖」卷。',
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
