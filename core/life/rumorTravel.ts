import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';

export type TravelDest = {
  id: string;
  name: string;
  hint: string;
  /** 寫入 flags.travel_region */
  region: string;
};

export const TRAVEL_DESTINATIONS: TravelDest[] = [
  { id: 'dest_sword_tomb', name: '古劍塚', hint: '殘鋒埋雪，或有劍意', region: '劍塚' },
  { id: 'dest_escort', name: '鏢局碼頭', hint: '車馬喧闐，銀兩與刀光', region: '鏢路' },
  { id: 'dest_banquet', name: '夜宴山莊', hint: '酒香掩刀，人情險惡', region: '夜宴' },
  { id: 'dest_herb', name: '藥谷溪畔', hint: '霧氣溫潤，宜醫宜毒', region: '藥谷' },
  { id: 'dest_ruins', name: '廢寺殘垣', hint: '鐘殘人散，易逢奇遇', region: '廢寺' },
  { id: 'dest_market', name: '邊城夜市', hint: '百物雜陳，殘譜流言', region: '邊市' },
];

const OFFER_FLAG = 'travel_offer_json';

export function listTravelOffer(state: LifeGameState): TravelDest[] {
  const raw = state.character.flags[OFFER_FLAG];
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const ids = JSON.parse(raw) as string[];
    return ids
      .map((id) => TRAVEL_DESTINATIONS.find((d) => d.id === id))
      .filter((d): d is TravelDest => Boolean(d));
  } catch {
    return [];
  }
}

/** 打聽傳聞時生成 2–3 個去向（本月可選） */
export function rollTravelOffer(state: LifeGameState): TravelDest[] {
  syncRngFromState(state);
  const rng = getRng();
  const pool = [...TRAVEL_DESTINATIONS];
  const picked: TravelDest[] = [];
  const count = rng.nextInt(2, 3);
  for (let i = 0; i < count && pool.length; i += 1) {
    const idx = rng.nextInt(0, pool.length - 1);
    picked.push(pool.splice(idx, 1)[0]!);
  }
  state.character.flags[OFFER_FLAG] = JSON.stringify(picked.map((d) => d.id));
  snapshotRng(state);
  return picked;
}

export function clearTravelOffer(state: LifeGameState): void {
  delete state.character.flags[OFFER_FLAG];
}

export function applyTravelChoice(state: LifeGameState, destId: string): string[] {
  const dest = TRAVEL_DESTINATIONS.find((d) => d.id === destId);
  if (!dest) return ['此路不通。'];
  const c = state.character;
  c.location = dest.name;
  c.flags.travel_region = dest.region;
  c.flags.travel_dest_id = dest.id;
  c.flags.rumor_boost = Math.min(3, Number(c.flags.rumor_boost ?? 0) + 1);
  clearTravelOffer(state);
  return [`你動身前往「${dest.name}」。${dest.hint}`, `所在 · ${dest.name}`];
}

/** 動態事件：本月傳聞指路（不進靜態目錄亦可由 resolvePendingEvent 掛） */
export function buildTravelOfferEvent(state: LifeGameState): GameEvent | null {
  const offer = listTravelOffer(state);
  if (offer.length < 2) return null;
  return {
    id: 'play_travel_offer',
    title: '江湖傳聞·擇路',
    body: '茶棚裡三言兩語，幾處地名被反覆提起。你可擇一路而行，往後機緣隨地而變。',
    tags: ['ordinary', 'travel', 'rumor'],
    weight: 0,
    choices: [
      ...offer.map((d) => ({
        id: d.id,
        text: `赴${d.name}`,
        outcomes: [
          {
            id: `go_${d.id}`,
            weight: 1,
            effects: [
              { type: 'narrate' as const, text: `你收拾行囊，往「${d.name}」去。${d.hint}` },
              { type: 'flag' as const, key: 'travel_region', value: d.region },
              { type: 'flag' as const, key: 'travel_dest_id', value: d.id },
              { type: 'flag' as const, key: '_travel_apply', value: d.id },
            ],
          },
        ],
      })),
      {
        id: 'stay',
        text: '暫且不動',
        outcomes: [
          {
            id: 'stay_ok',
            weight: 1,
            effects: [{ type: 'narrate' as const, text: '你按兵不動，只把傳聞記在心裡。' }],
          },
        ],
      },
    ],
  };
}

export function isTravelOfferReady(state: LifeGameState): boolean {
  return listTravelOffer(state).length >= 2 && !state.character.flags.travel_offer_consumed;
}

/** startMonth 掛起後標記，避免同月重複；選擇後清掉 */

/** 事件效果套用後：真正改 location */
export function finalizeTravelFromFlags(state: LifeGameState): string[] {
  const id = state.character.flags._travel_apply;
  if (typeof id !== 'string' || !id) return [];
  delete state.character.flags._travel_apply;
  delete state.character.flags.travel_offer_consumed;
  return applyTravelChoice(state, id);
}
