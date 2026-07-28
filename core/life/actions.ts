import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { getGearDef, rollForgeResult, type GearRarity } from '@data/equipment/catalog';
import { addCondition } from './monthly';
import { grantGear, raiseBaseMaxHp, raiseBaseMaxQi, equipGear, ensureGear } from './equipment';
import { snapshotRng, syncRngFromState } from './gameState';
import { pushChronicle } from './chronicle';

export type PracticeActionId =
  | 'train_martial'
  | 'train_internal'
  | 'temper_body'
  | 'join_sect'
  | 'sect_duty'
  | 'forge'
  | 'seek_master'
  | 'heal'
  | 'equip_best';

export interface PracticeAction {
  id: PracticeActionId;
  label: string;
  hint: string;
  cost?: number;
}

export const PRACTICE_ACTIONS: PracticeAction[] = [
  { id: 'train_martial', label: '苦練外功', hint: '武學↑，略耗氣血' },
  { id: 'train_internal', label: '打坐運功', hint: '內息與內力上限↑' },
  { id: 'temper_body', label: '淬體強身', hint: '氣血上限↑，疲勞↑' },
  { id: 'join_sect', label: '拜入門派', hint: '未入派時可試拜師' },
  { id: 'sect_duty', label: '門派差事', hint: '需已入派 · 功勳與銀兩' },
  { id: 'forge', label: '鑄造兵器', hint: '花費 40 兩，或得良器乃至神兵', cost: 40 },
  { id: 'seek_master', label: '尋訪高人', hint: '低機率習得秘傳武學' },
  { id: 'heal', label: '醫館調養', hint: '花費 15 兩，恢復並減傷勢', cost: 15 },
  { id: 'equip_best', label: '整裝披掛', hint: '自動裝備庫中最佳器物' },
];

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

export function performPracticeAction(state: LifeGameState, actionId: PracticeActionId): string[] {
  if (!state.character.alive || state.phase !== 'playing') return ['你已無法行動。'];
  if (state.pending) return ['眼前尚有未決之事，先作抉擇。'];

  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  ensureGear(c);
  const logs: string[] = [];

  switch (actionId) {
    case 'train_martial': {
      const gain = rng.nextInt(2, 5);
      c.martial += gain;
      c.health = clamp(c.health - rng.nextInt(0, 6), 1, c.maxHealth);
      c.fatigue = clamp(c.fatigue + rng.nextInt(4, 10), 0, 100);
      logs.push(`你苦練外功，武學 +${gain}。`);
      if (rng.chance(0.12)) {
        logs.push('走岔半招，皮肉受苦。');
        addCondition(state, 'bleeding');
      }
      break;
    }
    case 'train_internal': {
      const gain = rng.nextInt(8, 18);
      raiseBaseMaxQi(c, rng.nextInt(3, 8));
      c.qi = clamp(c.qi + gain, 0, c.maxQi);
      c.martial += 1;
      logs.push(`你打坐運功，內息回復，內力上限提升（現 ${c.maxQi}）。`);
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
      if (c.martial < 12) {
        logs.push('武學尚淺，各派拒之門外。');
        break;
      }
      const id = rng.pick(Object.keys(state.sects));
      c.sectId = id;
      c.flags.joined_sect = true;
      logs.push(`你拜入${state.sects[id].name}，成為外門弟子。`);
      break;
    }
    case 'sect_duty': {
      if (!c.sectId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const meritPay = rng.nextInt(8, 20);
      c.money += meritPay;
      c.martial += 1;
      c.reputation += 1;
      logs.push(`你完成${state.sects[c.sectId].name}差事，得銀 ${meritPay} 兩。`);
      break;
    }
    case 'forge': {
      if (c.money < 40) {
        logs.push('銀兩不足四十，鐵匠不肯開工。');
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
          { id: 'art_iron_body', name: '鐵布衫（入門）' },
          { id: 'art_moon_sword', name: '弄月劍法' },
          { id: 'art_void_breath', name: '空冥吐納' },
        ];
        const art = rng.pick(arts);
        if (!c.skills.includes(art.id)) {
          c.skills.push(art.id);
          raiseBaseMaxQi(c, rng.nextInt(10, 25));
          c.martial += rng.nextInt(5, 12);
          logs.push(`奇遇高人指點，你習得「${art.name}」。`);
        } else {
          c.martial += 3;
          logs.push('高人只點破你舊招中的滯澀。');
        }
      } else if (rng.chance(0.25)) {
        logs.push('尋訪無果，反而遇上剪徑之徒。');
        c.health = clamp(c.health - rng.nextInt(10, 25), 0, c.maxHealth);
        if (c.health <= 0) {
          c.alive = false;
          logs.push('你力竭倒於山道。');
        }
      } else {
        logs.push('雲深不知處，你空手而歸，只多了幾分眼界。');
        c.attributes.wuXing = clamp(c.attributes.wuXing + 1, 1, 100);
      }
      break;
    }
    case 'heal': {
      if (c.money < 15) {
        logs.push('藥金不足。');
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

  pushChronicle(state, logs);
  snapshotRng(state);
  return logs;
}
