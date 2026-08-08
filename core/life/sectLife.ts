import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { getLifeStage } from './stages';

/** 門派月度碎事：差事／罰跪／師命，令拜入後有後果 */
export function tickSectMonth(state: LifeGameState): string[] {
  const c = state.character;
  if (!c.alive || !c.sectId) return [];
  const sect = state.sects[c.sectId];
  if (!sect) return [];
  const rng = getRng();
  const stage = getLifeStage(c.age);
  const lines: string[] = [];

  // 老年少差事
  if (stage === 'elder' || stage === 'twilight') {
    if (rng.chance(0.2)) {
      lines.push(`${sect.name}長老見你年邁，免了你這個月的雜役。`);
    }
    return lines;
  }

  const roll = rng.nextFloat();
  if (roll < 0.22) {
    const pay = rng.nextInt(2, 6);
    c.money += pay;
    c.stats.wealthPeak = Math.max(c.stats.wealthPeak, c.money);
    c.martial += rng.chance(0.35) ? 1 : 0;
    lines.push(`你完成${sect.name}差事，得銀 ${pay} 兩。`);
  } else if (roll < 0.34) {
    c.fatigue = Math.min(100, (c.fatigue ?? 0) + rng.nextInt(6, 14));
    c.health = Math.max(1, c.health - rng.nextInt(0, 3));
    lines.push(`${sect.name}罰你跪香一炷。膝頭青了，心裡卻更定了半分。`);
  } else if (roll < 0.42) {
    c.reputation += 1;
    lines.push(`師兄稱讚你護山有功。門牆之內，名聲略厚。`);
  } else if (roll < 0.48 && rng.chance(0.4)) {
    const scar = c.conditions.find((x) => x.id === 'scar');
    if (scar) scar.monthsLeft = Math.max(scar.monthsLeft, 12);
    else c.conditions.push({ id: 'scar', name: '舊疤作痛', severity: 1, monthsLeft: 12 });
    lines.push(`師門比武失手，舊疤又熱了一夜。`);
  }

  // 站位緩慢升
  const standing = Number(c.flags.sect_standing ?? 0);
  if (standing < 3 && rng.chance(0.08)) {
    c.flags.sect_standing = standing + 1;
    lines.push(`門中記你一功。站位隱隱上移（${standing + 1}）。`);
  }

  return lines;
}
