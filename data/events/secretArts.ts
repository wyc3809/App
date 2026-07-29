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
    requirements: { minAge: 16, once: true, maxNature: { e: 55 } },
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
    requirements: { minAge: 16, minAttrs: { wuXing: 40 }, minNature: { xia: 10 }, maxNature: { e: 50 } },
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
    requirements: { minAge: 18, minAttrs: { danShi: 45 }, once: true, minNature: { kuang: 12 } },
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
    requirements: { minAge: 17, maxNature: { e: 48 } },
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
  {
    id: 'secret_beggar_scroll',
    title: '丐者殘卷',
    body: '城門口一老丐把一卷油污帛書塞進你懷裡，口中只道「有緣人」，隨即消失於人潮。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 9,
    requirements: { minAge: 16, once: true, minNature: { xie: 8 }, maxNature: { xia: 70 } },
    choices: [
      {
        id: 'study',
        text: '展卷細讀',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_silk_hand', name: '柔絲手' },
              { type: 'martial', amount: 8 },
              { type: 'narrate', text: '帛書所載竟是化力手法，你越讀越入迷。' },
            ],
          },
        ],
      },
      {
        id: 'sell',
        text: '拿到市集問價',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 25 },
              { type: 'narrate', text: '書商只當它是舊物，給了你一筆小錢。' },
            ],
          },
        ],
      },
      {
        id: 'burn',
        text: '恐是禍端，付之一炬',
        outcomes: [{ effects: [{ type: 'narrate', text: '火光一閃，紙灰隨風散盡。' }] }],
      },
    ],
  },
  {
    id: 'secret_cliff_shadow',
    title: '斷崖影拳',
    body: '暮色中斷崖上有人影獨自打拳，拳影映在岩壁，竟像是三重身法疊加。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 8,
    requirements: { minAge: 16, minAttrs: { wuXing: 35 }, minNature: { kuang: 10 } },
    choices: [
      {
        id: 'imitate',
        text: '在暗處摹拳',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_nine_shadow', name: '九影迷踪步' },
              { type: 'martial', amount: 11 },
              { type: 'narrate', text: '你記下步位，身法忽然輕了半寸。' },
            ],
          },
        ],
      },
      {
        id: 'greet',
        text: '上前請教',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'martial', amount: 4 },
              { type: 'narrate', text: '影中人只點你一處肩線，不肯多言。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不便打擾，悄然退去',
        outcomes: [{ effects: [{ type: 'narrate', text: '你留下餘影在心，轉身下山。' }] }],
      },
    ],
  },
  {
    id: 'secret_temple_bell',
    title: '古寺鐘鳴',
    body: '荒寺鐘聲無故自鳴，梁上落下半頁拳譜，字跡被香火熏得發黃。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 7,
    requirements: { minAge: 17, once: true, minNature: { xia: 14 }, maxNature: { e: 40 } },
    choices: [
      {
        id: 'take',
        text: '收下拳譜苦練',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_thunder_blade', name: '驚雷刀' },
              { type: 'martial', amount: 10 },
              { type: 'grantGear', gearId: 'iron-blade' },
              { type: 'narrate', text: '譜中刀意如雷，你越練越覺腕底生風。' },
            ],
          },
        ],
      },
      {
        id: 'pray',
        text: '重新供上，只求心安',
        outcomes: [
          {
            effects: [
              { type: 'maxQi', amount: 15 },
              { type: 'attr', delta: { fuYuan: 2 } },
              { type: 'narrate', text: '鐘聲再響一記，你內息竟平穩許多。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不敢久留，離寺',
        outcomes: [{ effects: [{ type: 'narrate', text: '你退出山門，回望時寺中已無聲。' }] }],
      },
    ],
  },
  {
    id: 'secret_snow_hermit',
    title: '雪夜隱士',
    body: '大雪封路，茅屋中一白髮隱士正在煮雪，見你凍僵，邀你入內取暖，順便點破你吐納之滯。',
    tags: ['special', 'martial', 'secret', 'qiuyu'],
    weight: 8,
    requirements: { minAge: 16, maxNature: { e: 45 } },
    choices: [
      {
        id: 'learn',
        text: '恭敬求教吐納',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'art_void_breath', name: '空冥吐納' },
              { type: 'maxQi', amount: 30 },
              { type: 'qi', amount: 35 },
              { type: 'narrate', text: '隱士只教半炷香，你已覺丹田溫熱。' },
            ],
          },
        ],
      },
      {
        id: 'chat',
        text: '只敘家常，不談武學',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 20 },
              { type: 'attr', delta: { meiLi: 2 } },
              { type: 'narrate', text: '一碗熱湯入腹，你氣色回了許多。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '道謝後繼續趕路',
        outcomes: [{ effects: [{ type: 'narrate', text: '雪更大了，茅屋很快被白茫茫吞沒。' }] }],
      },
    ],
  },
  {
    id: 'secret_market_duel',
    title: '市井約戰',
    body: '茶棚裡有人出言譏諷你武學花俏，當眾約你比試三招，圍觀者越來越多。',
    tags: ['special', 'combat', 'secret', 'qiuyu'],
    weight: 10,
    requirements: { minAge: 16, minMartial: 10, minNature: { kuang: 12 } },
    choices: [
      {
        id: 'accept',
        text: '應戰比試',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '茶棚外讓出空地，戰端將起。' },
              { type: 'martial', amount: 2 },
            ],
          },
        ],
      },
      {
        id: 'humble',
        text: '以禮化解',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 3 },
              { type: 'narrate', text: '你拱手認弱，對方反倒不好意思，雙方罷手。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不與爭鋒，離席',
        outcomes: [{ effects: [{ type: 'narrate', text: '你放下茶錢離席，背後有人嗤笑。' }, { type: 'reputation', amount: -1 }] }],
      },
    ],
  },
  {
    id: 'secret_night_thief',
    title: '夜半盜譜',
    body: '客棧窗外黑影一閃，似有人欲偷你枕下的殘譜。',
    tags: ['special', 'combat', 'secret', 'qiuyu'],
    weight: 7,
    requirements: { minAge: 16, minNature: { xie: 10 }, maxNature: { xia: 65 } },
    choices: [
      {
        id: 'chase',
        text: '追出夜巷',
        outcomes: [{ effects: [{ type: 'narrate', text: '你提氣追出，夜巷中刀光一閃。' }] }],
      },
      {
        id: 'trap',
        text: '假裝入睡，伺機反制',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 15 },
              { type: 'martial', amount: 3 },
              { type: 'narrate', text: '你抓住盜者手腕，對方丟下一袋碎銀逃走。' },
            ],
          },
        ],
      },
      {
        id: 'yell',
        text: '大喊有賊',
        outcomes: [{ effects: [{ type: 'narrate', text: '客棧喧鬧起來，黑影早已無踪。' }] }],
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
