import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { getGearDef, rollForgeResult, type GearRarity } from '@data/equipment/catalog';
import { addCondition } from './monthly';
import { grantGear, raiseBaseMaxHp, raiseBaseMaxQi, equipGear, ensureGear } from './equipment';
import { snapshotRng, syncRngFromState, SECT_DEFS } from './gameState';
import { pushChronicle } from './chronicle';
import {
  learnMartialArt,
  tryAdvanceRandomSkill,
  tryAdvanceSkill,
} from './flavor';
import { startCombat } from './combat';
import { getSkillDef } from '@data/skills/catalog';

export type PracticeActionId =
  | 'train_martial'
  | 'train_internal'
  | 'temper_body'
  | 'forge'
  | 'seek_master'
  | 'heal'
  | 'equip_best'
  | 'join_sect'
  | 'sect_duty'
  | 'sect_ask_elder'
  | 'sect_spar'
  | 'sect_guard'
  | 'sect_meditate'
  | 'sect_leave';

export interface PracticeAction {
  id: PracticeActionId;
  label: string;
  hint: string;
}

/** 主修煉選單（門派另開子頁） */
export const PRACTICE_ACTIONS: PracticeAction[] = [
  { id: 'train_martial', label: '苦練外功', hint: '武學↑，或有階位進境' },
  { id: 'train_internal', label: '打坐運功', hint: '內息與內力上限↑' },
  { id: 'temper_body', label: '淬體強身', hint: '氣血上限↑，疲勞↑' },
  { id: 'forge', label: '鑄造兵器', hint: '花費 40 兩，或得良器乃至神兵' },
  { id: 'seek_master', label: '尋訪高人', hint: '或可習得／進階武學' },
  { id: 'heal', label: '醫館調養', hint: '花費 15 兩，恢復並減傷勢' },
  { id: 'equip_best', label: '整裝披掛', hint: '自動裝備庫中最佳器物' },
];

/** 已入門派後的門內事務 */
export const SECT_INNER_ACTIONS: PracticeAction[] = [
  { id: 'sect_duty', label: '門派差事', hint: '跑腿護院，積些人情' },
  { id: 'sect_ask_elder', label: '請教長老', hint: '點撥一二，或悟舊招' },
  { id: 'sect_spar', label: '師門比武', hint: '實戰淬鍊，進階可期' },
  { id: 'sect_guard', label: '守護山門', hint: '夜巡風雨，磨礪心膽' },
  { id: 'sect_meditate', label: '靜室修煉', hint: '門中心法，閉目調息' },
];

export { SECT_DEFS };

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

const RARITY_RANK: Record<GearRarity, number> = {
  common: 1,
  fine: 2,
  rare: 3,
  epic: 4,
  divine: 5,
};

export function performPracticeAction(
  state: LifeGameState,
  actionId: PracticeActionId,
  opts?: { sectId?: string },
): string[] {
  if (!state.character.alive || state.phase !== 'playing') return ['你已無法行動。'];
  if (state.pending) return ['眼前尚有未決之事，先作抉擇。'];
  if (state.pendingCombat) return ['交手未了，豈能分心。'];
  if ((state.practiceActionsLeft ?? 0) <= 0) {
    return ['本月修煉次數已盡，且回鎮居翻過一頁再來。'];
  }

  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  ensureGear(c);
  if (!c.skillRanks) c.skillRanks = {};
  const logs: string[] = [];
  state.practiceActionsLeft = Math.max(0, (state.practiceActionsLeft ?? 3) - 1);

  switch (actionId) {
    case 'train_martial': {
      const gain = rng.nextInt(1, 3);
      c.health = clamp(c.health - rng.nextInt(0, 6), 1, c.maxHealth);
      c.fatigue = clamp(c.fatigue + rng.nextInt(4, 10), 0, 100);
      c.martial += gain;
      logs.push(`你苦練外功，武學 +${gain}。`);
      const externals = c.skills.filter((id) => getSkillDef(id)?.kind === 'external');
      const pool = externals.length ? externals : c.skills;
      if (pool.length) {
        const adv = tryAdvanceSkill(state, rng.pick(pool), 'practice');
        if (adv) logs.push(adv);
        else logs.push('外功招式仍有滯澀，尚未突破階位。');
      }
      if (rng.chance(0.12)) {
        logs.push('走岔半招，皮肉受苦。');
        addCondition(state, 'bleeding');
      }
      break;
    }
    case 'train_internal': {
      const qiGain = rng.nextInt(8, 18);
      const cap = rng.nextInt(3, 8);
      raiseBaseMaxQi(c, cap);
      c.qi = clamp(c.qi + qiGain, 0, c.maxQi);
      logs.push(`你打坐運功，內息 +${qiGain}，內力上限 +${cap}（現 ${c.maxQi}）。`);
      const internals = c.skills.filter((id) => getSkillDef(id)?.kind === 'internal');
      const breath = internals[0] ?? c.skills.find((s) => /breath|吐納/i.test(s));
      if (breath) {
        const adv = tryAdvanceSkill(state, breath, 'practice');
        if (adv) logs.push(adv);
      }
      if (rng.chance(0.08)) {
        logs.push('氣息逆行，險些走火。');
        addCondition(state, 'internal');
      }
      break;
    }
    case 'temper_body': {
      const up = rng.nextInt(8, 20);
      raiseBaseMaxHp(c, up);
      c.fatigue = clamp(c.fatigue + rng.nextInt(6, 14), 0, 100);
      logs.push(`你以藥浴與樁功淬體，氣血上限 +${up}（現 ${c.maxHealth}）。`);
      break;
    }
    case 'join_sect': {
      if (c.sectId) {
        logs.push(`你已是${state.sects[c.sectId]?.name ?? '門派'}中人。`);
        break;
      }
      const target = opts?.sectId;
      if (!target || !state.sects[target]) {
        logs.push('你尚未選定要拜的門派。');
        break;
      }
      // 後台門檻，不對玩家顯示數字
      if (c.martial < 12 && overallWeak(c)) {
        logs.push(`${state.sects[target].name}看你根基尚淺，暫未收錄。`);
        break;
      }
      if (rng.chance(0.22)) {
        logs.push(`${state.sects[target].name}此番未允，只道「機緣未到」。`);
        break;
      }
      c.sectId = target;
      c.flags.joined_sect = true;
      logs.push(`你拜入${state.sects[target].name}，成為外門弟子。`);
      // 門派入門武學
      const artId = `sect_art_${target}`;
      logs.push(learnMartialArt(state, artId, `${state.sects[target].name}入門心法`));
      break;
    }
    case 'sect_duty': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const meritPay = rng.nextInt(8, 20);
      c.money += meritPay;
      c.reputation += 1;
      c.martial += 1;
      logs.push(`你完成${state.sects[c.sectId].name}差事，得銀 ${meritPay} 兩。`);
      break;
    }
    case 'sect_ask_elder': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      c.fatigue = clamp(c.fatigue + 3, 0, 100);
      logs.push('長老只點了三處破綻，餘下要你自己悟。');
      const adv = tryAdvanceRandomSkill(state, 'practice');
      if (adv) logs.push(adv);
      else logs.push('你似懂非懂，回去還得再練。');
      break;
    }
    case 'sect_spar': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const foeName = `${state.sects[c.sectId].name}師兄`;
      logs.push(...startCombat(state, {
        source: 'spar',
        title: '師門比武',
        foeName,
        foePower: 'normal',
        rewardOnWin: { reputation: 2, martial: 2 },
        rewardOnLose: { reputation: -1 },
      }));
      break;
    }
    case 'sect_guard': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      c.fatigue = clamp(c.fatigue + rng.nextInt(4, 10), 0, 100);
      c.attributes.danShi = clamp(c.attributes.danShi + (rng.chance(0.4) ? 1 : 0), 1, 100);
      logs.push('你守了一夜山門，風聲鶴唳中心膽更定。');
      if (rng.chance(0.15)) {
        logs.push('遇著探子，你與師兄合力驅離。');
        const adv = tryAdvanceRandomSkill(state, 'combat');
        if (adv) logs.push(adv);
      }
      break;
    }
    case 'sect_meditate': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      raiseBaseMaxQi(c, rng.nextInt(2, 6));
      c.qi = clamp(c.qi + rng.nextInt(10, 22), 0, c.maxQi);
      logs.push('靜室之中，你按門中心法緩緩吐納。');
      const sectArt = c.skills.find((s) => s.startsWith('sect_art_'));
      if (sectArt) {
        const adv = tryAdvanceSkill(state, sectArt, 'practice');
        if (adv) logs.push(adv);
      } else {
        const adv = tryAdvanceRandomSkill(state, 'practice');
        if (adv) logs.push(adv);
      }
      break;
    }
    case 'sect_leave': {
      if (!c.sectId) {
        logs.push('你本就不屬任何門派。');
        break;
      }
      const name = state.sects[c.sectId]?.name ?? '門派';
      c.sectId = null;
      c.reputation = Math.max(0, c.reputation - 3);
      logs.push(`你辭別${name}，从此山門內外，兩不相干。`);
      break;
    }
    case 'forge': {
      if (c.money < 40) {
        logs.push('鐵匠看了看你的錢袋，搖頭不肯開工。');
        break;
      }
      c.money -= 40;
      if (rng.chance(0.18)) {
        logs.push('爐火失控，兵器毀於一旦，還燙傷了手。');
        addCondition(state, 'bleeding');
        break;
      }
      const gearId = rollForgeResult(rng);
      const name = grantGear(state, gearId);
      logs.push(`爐火純青，你煉成「${name}」。`);
      if (gearId.startsWith('divine')) logs.push('天地異象一瞬——竟是神兵！');
      break;
    }
    case 'seek_master': {
      c.fatigue = clamp(c.fatigue + 5, 0, 100);
      if (rng.chance(0.22)) {
        const arts = [
          { id: 'art_nine_shadow', name: '九影迷踪步' },
          { id: 'art_cold_palm', name: '寒霜掌' },
          { id: 'art_iron_body', name: '鐵布衫' },
          { id: 'art_moon_sword', name: '弄月劍法' },
          { id: 'art_void_breath', name: '空冥吐納' },
        ];
        const art = rng.pick(arts);
        if (!c.skills.includes(art.id)) {
          logs.push(learnMartialArt(state, art.id, art.name));
          raiseBaseMaxQi(c, rng.nextInt(10, 25));
        } else {
          const adv = tryAdvanceSkill(state, art.id, 'practice');
          logs.push(adv ?? '高人只點破你舊招中的滯澀。');
        }
      } else if (rng.chance(0.25)) {
        logs.push('尋訪無果，山道上卻撞見剪徑之徒——只好交手。');
        logs.push(
          ...startCombat(state, {
            source: 'bandit',
            title: '山道劫匪',
            foeName: '剪徑之徒',
            foePower: 'weak',
            rewardOnWin: { money: 12, martial: 1 },
            rewardOnLose: { money: -10 },
          }),
        );
      } else {
        logs.push('雲深不知處，你空手而歸，只多了幾分眼界。');
        c.attributes.wuXing = clamp(c.attributes.wuXing + 1, 1, 100);
      }
      break;
    }
    case 'heal': {
      if (c.money < 15) {
        logs.push('藥金不足，醫者只給你一碗清茶。');
        break;
      }
      c.money -= 15;
      c.health = clamp(c.health + rng.nextInt(20, 40), 0, c.maxHealth);
      if (c.conditions.length) {
        c.conditions = c.conditions
          .map((x) => ({ ...x, monthsLeft: x.monthsLeft - 2 }))
          .filter((x) => x.monthsLeft > 0);
      }
      logs.push('醫館調養後，氣色好了許多。');
      break;
    }
    case 'equip_best': {
      for (const slot of ['weapon', 'armor', 'accessory'] as const) {
        const best = c.gear
          .map((id) => getGearDef(id))
          .filter((d) => d && d.slot === slot)
          .sort((a, b) => (RARITY_RANK[b!.rarity] ?? 0) - (RARITY_RANK[a!.rarity] ?? 0))[0];
        if (best) logs.push(equipGear(state, best.id));
      }
      if (!logs.length) logs.push('無可換之裝。');
      break;
    }
    default:
      logs.push('無事可做。');
  }

  logs.push(`本月尚餘修煉 ${state.practiceActionsLeft} 次。`);
  pushChronicle(state, logs);
  snapshotRng(state);
  return logs;
}

function overallWeak(c: LifeGameState['character']): boolean {
  const ranks = Object.values(c.skillRanks ?? {});
  const best = ranks.length ? Math.max(...ranks) : 0;
  return best < 1 && c.martial < 12;
}
