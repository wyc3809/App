import type { LifeGameState } from '@interfaces/lifeEngine';
import { getLifeStage } from './stages';
import { careerMonthlyIncome, getCareer } from './careers';

/** 月度薄利：令銀兩有緩慢壓力／來源，唔靠純事件掉錢 */
export function tickMonthlyEconomy(state: LifeGameState): string[] {
  const c = state.character;
  if (!c.alive) return [];
  const lines: string[] = [];
  const stage = getLifeStage(c.age);

  // 日常開銷
  let upkeep = 2;
  if (stage === 'midlife' || stage === 'elder') upkeep = 3;
  if (stage === 'twilight') upkeep = 4;
  if (c.sectId) upkeep += 1;
  if ((c.family?.childrenNames?.length ?? 0) > 0) upkeep += 1;
  if (getCareer(state)) upkeep += 1;

  // 薄利：門派津贴／小買賣／傳承族產／行當
  let income = 0;
  if (c.sectId) income += 2;
  if (c.flags.born_with_family_legacy || c.flags.family_legacy) income += 2;
  if (c.flags.side_trade) income += Number(c.flags.side_trade) || 1;
  if (c.martial >= 40) income += 1;
  income += careerMonthlyIncome(state);

  const net = income - upkeep;
  c.money = Math.max(0, c.money + net);
  c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);

  if (net <= -3 && c.money <= 8) {
    lines.push('這個月銀兩緊了些。茶淡了半碗。');
  } else if (net >= 2) {
    lines.push('這個月略有進項，匣子沉了一點。');
  }

  // 偶發：開一小攤（只觸發一次提示）
  if (!c.flags.side_trade && c.money >= 40 && c.age >= 22 && c.age <= 50) {
    c.flags.side_trade = 2;
    lines.push('你在鎮口支了個小攤，往後每月略有薄利。');
  }

  return lines;
}
