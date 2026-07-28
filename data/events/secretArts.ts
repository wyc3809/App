import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

/** 參考「奇遇學武」風格（原創招式名，非現代 IP） */
const RAW: GameEvent[] = [
  {
    id: 'secret_cave_manual',
    title: '石壁殘篇',
    body: '山腹石壁刻著模糊掌譜，旁有枯骨與半截火折子。',
    tags: ['special', 'martial', 'secret'],
    weight: 8,
    requirements: { minAge: 16, once: true },
    choices: [
      {
        id: 'study',
        text: '摹下掌譜苦練',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_stone_palm', name: '裂石殘掌' },
              { type: 'martial', amount: 12 },
              { type: 'maxQi', amount: 20 },
              { type: 'narrate', text: '掌影入心，內息為之一振。' },
            ],
          },
        ],
      },
      {
        id: 'copy',
        text: '只抄錄帶走',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 4 },
              { type: 'narrate', text: '你不敢久留，只帶回殘篇日後再研。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '怕有詭異，退去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你退出洞口，風聲如哭。' }] }],
      },
    ],
  },
  {
    id: 'secret_rain_master',
    title: '雨夜傳功',
    body: '一名青衣老者在橋上避雨，見你根骨尚可，願點撥三招。',
    tags: ['special', 'martial', 'secret'],
    weight: 7,
    requirements: { minAge: 16, minAttrs: { wuXing: 40 } },
    choices: [
      {
        id: 'accept',
        text: '拜謝受教',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_bridge_step', name: '斷橋步' },
              { type: 'martial', amount: 10 },
              { type: 'maxHealth', amount: 15 },
              { type: 'narrate', text: '三招過後，老者已不見踪影。' },
            ],
          },
        ],
      },
      {
        id: 'ask_more',
        text: '追問來歷',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 3 },
              { type: 'narrate', text: '老者一笑，只丟下一句「莫問前程」。' },
            ],
          },
        ],
      },
      {
        id: 'refuse',
        text: '婉言謝絕',
        outcomes: [{ effects: [{ type: 'narrate', text: '你拱手退去，雨聲更大。' }] }],
      },
    ],
  },
  {
    id: 'secret_tomb_blade',
    title: '古墓劍塚',
    body: '塌陷的墓道中，一柄無銘長劍插於石台，隱有龍吟。',
    tags: ['special', 'martial', 'secret', 'gear'],
    weight: 5,
    requirements: { minAge: 18, minAttrs: { danShi: 45 }, once: true },
    choices: [
      {
        id: 'draw',
        text: '拔劍試鋒',
        outcomes: [
          {
            effects: [
              { type: 'grantGear', gearId: 'divine-xuan-sword' },
              { type: 'learnSkill', skillId: 'art_tomb_sword', name: '無銘劍意' },
              { type: 'martial', amount: 15 },
              { type: 'narrate', text: '劍出鞘，墓中塵土盡退——神兵在握。' },
            ],
          },
        ],
      },
      {
        id: 'worship',
        text: '上香致敬，不妄取',
        outcomes: [
          {
            effects: [
              { type: 'attr', delta: { fuYuan: 3 } },
              { type: 'maxQi', amount: 10 },
              { type: 'narrate', text: '你只取心法感悟，空手而出。' },
            ],
          },
        ],
      },
      {
        id: 'seal',
        text: '重新封土離開',
        outcomes: [{ effects: [{ type: 'narrate', text: '你封好墓道，不敢驚動地下之事。' }] }],
      },
    ],
  },
  {
    id: 'secret_lake_breath',
    title: '湖心寒息',
    body: '冬湖結薄冰，湖心氣機異動，似有人在冰下運功。',
    tags: ['special', 'martial', 'secret'],
    weight: 6,
    requirements: { minAge: 17 },
    choices: [
      {
        id: 'meditate',
        text: '在岸邊對息',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_lake_breath', name: '寒湖吐納' },
              { type: 'maxQi', amount: 35 },
              { type: 'qi', amount: 40 },
              { type: 'narrate', text: '你借湖心寒息，打通一縷奇經。' },
            ],
          },
        ],
      },
      {
        id: 'dive',
        text: '破冰探查',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -20 },
              { type: 'martial', amount: 6 },
              { type: 'narrate', text: '冰水刺骨，你只撈到一塊刻字玉佩。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '恐有蹊蹺，離去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你遠遠看了一眼，轉身回鎮。' }] }],
      },
    ],
  },
];

export const SECRET_ART_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    () => [
      { type: 'narrate', text: '事與願違，你受了暗傷。' },
      { type: 'health', amount: -18 },
      { type: 'condition', id: 'internal' },
    ],
    0.16,
  ),
);
