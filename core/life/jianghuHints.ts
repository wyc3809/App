import type { LifeGameState } from '@interfaces/lifeEngine';
import { natureLabels } from '@interfaces/lifeEngine';
import { getSkillDef } from '@data/skills/catalog';
import { sumEvasionBonus } from '@data/skills/catalog';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import { ensureNature, dominantNature } from './nature';

/** 鎮居／修煉頁「近日傳聞」與學習提示（不顯示四維數值） */
export function jianghuHints(state: LifeGameState): string[] {
  const hints: string[] = [];
  const c = state.character;
  const f = c.flags;

  if (f.rumor_boss_scarlet) hints.push('茶棚裡有人低聲提「赤練娘」三字，袖裡似藏針。');
  if (f.rumor_boss_iron) hints.push('官道傳聞鐵甲車攔路，過客多繞野徑。');
  if (f.rumor_boss_monk) hints.push('破廟酒氣沖天，有人說瘋僧要試掌。');
  if (f.rumor_boss_black) hints.push('黑風寨鞭影如幕，寨主點名尋人比武。');
  if (f.rumor_boss_frost) hints.push('北嶺傳來寒刀聲，霜刀客似在等人。');
  if (f.rumor_boss_lute) hints.push('河舫夜曲不祥，琵琶一響便有人失踪。');

  if (Number(f.aftermath_mercy_months ?? 0) > 0) {
    hints.push('你曾放走過對手，江湖上或有回音。');
  }
  if (Number(f.aftermath_blood_months ?? 0) > 0) {
    hints.push('血債未冷，暗處或有耳目。');
  }

  if (state.world?.lastWorldShift) {
    hints.push(state.world.lastWorldShift);
  }

  const weaponId = c.equipment?.weapon;
  const weapon = weaponId ? getGearDef(weaponId) : undefined;
  if (weapon?.weaponKind) {
    const match = c.skills.some((id) => getSkillDef(id)?.weaponKind === weapon.weaponKind);
    if (!match) {
      hints.push(
        `你持「${weapon.name}」（${WEAPON_KIND_LABEL[weapon.weaponKind]}），若習對應江湖武學，交手更順。`,
      );
    }
  }

  const hasQg = c.skills.some((id) => getSkillDef(id)?.kind === 'qinggong');
  if (!hasQg) {
    hints.push('尚未習得輕功；奇遇、尋訪或首領戰或可遇身法殘篇。');
  }

  const nature = ensureNature(c);
  const dom = dominantNature(c);
  if (nature[dom] >= 40) {
    hints.push(`心性以「${natureLabels[dom]}」獨顯，門派與奇遇的門檻會隨之開合。`);
  }

  // 去重、最多 4 條
  const seen = new Set<string>();
  const out: string[] = [];
  for (const h of hints) {
    if (!h || seen.has(h)) continue;
    seen.add(h);
    out.push(h);
    if (out.length >= 4) break;
  }
  return out;
}

export function playerEvasionPercent(state: LifeGameState): number {
  const c = state.character;
  const ev = sumEvasionBonus(c.skills, c.skillRanks ?? {}) + c.attributes.danShi / 500;
  return Math.round(Math.min(0.45, ev) * 100);
}
