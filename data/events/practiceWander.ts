import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/** 翻頁時可能遇到的修煉／鑄兵／尋訪機緣（原修煉頁主動項） */
const RAW: GameEvent[] = [
  {
    id: 'wander_train_martial',
    title: '苦練外功',
    body: '院中空地，你提起舊招反覆演練，拳風帶起簷前塵土。',
    tags: ['ordinary', 'practice_wander'],
    weight: 14,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'do',
        text: '專心苦練',
        outcomes: [{ effects: [{ type: 'practice', action: 'train_martial' }] }],
      },
      {
        id: 'light',
        text: '點到為止',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              { type: 'narrate', text: '你只走了半套，收勢時汗水已濕衣。今日不求猛進，但求不生滯澀。' },
            ],
          },
        ],
      },
      {
        id: 'rest',
        text: '歇手休息',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 3 },
              { type: 'narrate', text: '你收拳靠牆，聽風過竹梢。力氣留著，日後再說。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'wander_train_internal',
    title: '打坐運功',
    body: '夜深人靜，你盤膝調息，想把近日亂了的內息理順。',
    tags: ['ordinary', 'practice_wander'],
    weight: 13,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'do',
        text: '閉目運功',
        outcomes: [{ effects: [{ type: 'practice', action: 'train_internal' }] }],
      },
      {
        id: 'short',
        text: '只調半炷香',
        outcomes: [
          {
            effects: [
              { type: 'qi', amount: 8 },
              { type: 'narrate', text: '你只坐了片刻便起身。內息略平，卻未敢貪功。' },
            ],
          },
        ],
      },
      {
        id: 'rest',
        text: '改日再坐',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '今夜雜念太多，你起身飲水，把運功留到心靜之時。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'wander_temper_body',
    title: '淬體強身',
    body: '藥香與樁功並至，你想起「練拳先練身」的舊話。',
    tags: ['ordinary', 'practice_wander'],
    weight: 12,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'do',
        text: '藥浴樁功',
        outcomes: [{ effects: [{ type: 'practice', action: 'temper_body' }] }],
      },
      {
        id: 'light',
        text: '只站一炷香',
        outcomes: [
          {
            effects: [
              { type: 'maxHealth', amount: 4 },
              { type: 'narrate', text: '你站樁至腿顫便停。身子略沉，算是沒白站。' },
            ],
          },
        ],
      },
      {
        id: 'rest',
        text: '怕傷筋骨，作罷',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你摸摸舊傷，決定今日不硬來。身子還在，不怕沒日練。' },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'wander_forge',
    title: '鍛造兵器',
    body: '鐵匠鋪爐火正旺，掌櫃朝你招手：「可要趁火加一道？」',
    tags: ['ordinary', 'practice_wander'],
    weight: 10,
    requirements: { minAge: 16, minMoney: 40 },
    choices: [
      {
        id: 'do',
        text: '花費四十兩開爐',
        outcomes: [{ effects: [{ type: 'practice', action: 'forge' }] }],
      },
      {
        id: 'watch',
        text: '只看不買',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { wuXing: 1 } },
              { type: 'narrate', text: '你立在爐邊看火候與錘法，銀兩未動，眼界卻寬了半分。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '改日再來',
        outcomes: [
          {
            effects: [{ type: 'narrate', text: '你拱手離開鐵匠鋪。爐火在身後轟然一響，像在催你下次帶夠銀兩。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wander_seek_master',
    title: '尋訪高人',
    body: '山道雲深，有人說附近住著隱士；也有人說只是剪徑的幌子。',
    tags: ['ordinary', 'practice_wander'],
    weight: 11,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'do',
        text: '深入尋訪',
        outcomes: [{ effects: [{ type: 'practice', action: 'seek_master' }] }],
      },
      {
        id: 'ask',
        text: '只問鄉人',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { fuYuan: 1 } },
              { type: 'narrate', text: '鄉人指了個方向又搖頭。你記下方位，不急著入山。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '恐有不測，退去',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你看天色將暮，轉身下山。機緣這回事，強求不得。' },
            ],
          },
        ],
      },
    ],
  },
];

export const PRACTICE_WANDER_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (_id, text = '此舉') => [
      {
        type: 'narrate',
        text: `你欲「${text}」，卻事與願違：一時分神，氣力與銀錢都捱了一記。`,
      },
      { type: 'health', amount: -8 },
      { type: 'money', amount: -5 },
    ],
    0.12,
  ),
);
