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
  if (f.rumor_boss_sand) hints.push('西行沙道有人揚沙劫武，人稱沙蠍客。');
  if (f.rumor_boss_mirror) hints.push('鏡湖夜有孤燈，隱士以息會友。');

  const boost = Number(f.rumor_boost ?? 0);
  if (boost > 0) {
    hints.push(
      boost >= 3
        ? '你連日打聽風聲，江湖上已有人留意你的腳步——翻頁時較易逢奇人異事。'
        : '你近日多問風聲，路遇稍稠，奇緣或近。',
    );
  }

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
        `你持「${weapon.name}」（${WEAPON_KIND_LABEL[weapon.weaponKind]}），宜習對路功夫，方能人器相合。`,
      );
    }
  }

  const hasQg = c.skills.some((id) => getSkillDef(id)?.kind === 'qinggong');
  if (!hasQg) {
    hints.push('尚未習得輕功；奇遇、尋訪機緣或強敵交手，或可得身法殘篇。');
  }

  const nature = ensureNature(c);
  const dom = dominantNature(c);
  if (nature[dom] >= 40) {
    hints.push(`心性以「${natureLabels[dom]}」獨顯，門牆與奇遇或開或闔。`);
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

/** 修煉頁：尚未習得的江湖武學／輕功提示 */
export function practiceLearningHints(state: LifeGameState): string[] {
  const c = state.character;
  const known = new Set(c.skills);
  const tips: string[] = [];

  const pools: { id: string; how: string }[] = [
    { id: 'art_spear_cloud', how: '聞穿雲槍散佚民間，尋訪或可得（持槍加威）' },
    { id: 'art_staff_iron', how: '鐵杖訣傳於行腳僧道，訪之或可習' },
    { id: 'art_whip_silk', how: '柔絲鞭法多藏於高手袖中，戰勝或尋訪可學' },
    { id: 'art_bow_star', how: '逐星箭意在獵戶與遊俠間流傳，訪之或可得' },
    { id: 'art_sand_palm', how: '沙道人言流沙掌，西行或可遇' },
    { id: 'art_mirror_breath', how: '鏡湖隱士或以澄心鏡息會友' },
    { id: 'art_heavy_halberd', how: '開山戟意沉雄，尋訪長兵高手或可習' },
    { id: 'qg_snow_track', how: '高人或傳「踏雪無痕」輕功' },
    { id: 'qg_reed_drift', how: '放走過對手後，或有人以「蘆花身法」報恩' },
    { id: 'qg_wall_cat', how: '危牆夜影之中，或可習「壁虎遊牆」' },
    { id: 'qg_lotus_steps', how: '荷塘奇遇，或得「踏蓮步」' },
    { id: 'art_shadow_needle', how: '戰勝赤練娘，或可奪「無影針訣」' },
  ];
  for (const p of pools) {
    if (!known.has(p.id)) tips.push(p.how);
  }

  const weaponId = c.equipment?.weapon;
  const weapon = weaponId ? getGearDef(weaponId) : undefined;
  if (weapon?.weaponKind) {
    const hasMatch = c.skills.some((id) => getSkillDef(id)?.weaponKind === weapon.weaponKind);
    if (!hasMatch) {
      tips.unshift(`兵刃「${weapon.name}」尚無對路武學，尋訪奇緣可補。`);
    }
  }

  return tips.slice(0, 3);
}
