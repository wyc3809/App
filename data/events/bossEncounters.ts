import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

export type BossFightConfig = {
  foeName: string;
  foePower: 'boss';
  rewardOnWin: {
    money?: number;
    reputation?: number;
    martial?: number;
    gearId?: string;
    skillId?: string;
    skillName?: string;
  };
};

/** 首領戰結算：勝後掉落（finishCombat 讀取 rewardOnWin） */
export const BOSS_FIGHT_CONFIG: Record<string, BossFightConfig> = {
  boss_scarlet_viper: {
    foeName: '赤練娘',
    foePower: 'boss',
    rewardOnWin: {
      money: 45,
      reputation: 12,
      martial: 8,
      skillId: 'art_shadow_needle',
      skillName: '無影針訣',
      gearId: 'sleeve-darts',
    },
  },
  boss_iron_chariot: {
    foeName: '鐵甲車',
    foePower: 'boss',
    rewardOnWin: {
      money: 55,
      reputation: 10,
      martial: 10,
      skillId: 'art_hook_silk',
      skillName: '鐵線鉤法',
      gearId: 'twin-hooks',
    },
  },
  boss_wandering_monk: {
    foeName: '瘋癲僧',
    foePower: 'boss',
    rewardOnWin: {
      money: 38,
      reputation: 15,
      martial: 12,
      skillId: 'qg_canopy_void',
      skillName: '凌虛步',
      gearId: 'pine-staff',
    },
  },
  boss_black_wind: {
    foeName: '黑風寨主',
    foePower: 'boss',
    rewardOnWin: {
      money: 50,
      reputation: 8,
      martial: 9,
      skillId: 'art_meteor_palm',
      skillName: '流星掌',
      gearId: 'meteor-whip',
    },
  },
};

const RAW: GameEvent[] = [
  {
    id: 'boss_scarlet_viper',
    title: '赤練娘',
    body: '茶棚外傳來女子笑聲，紅裙一閃，袖中寒芒已對準你的咽喉。她自稱「赤練娘」，專劫過路武人，奪其兵譜與暗器。',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: { minAge: 20, minMartial: 28, once: true },
    choices: [
      {
        id: 'fight',
        text: '拔刃應戰',
        outcomes: [{ effects: [{ type: 'narrate', text: '你踏前一步，劍光與袖針在半空交錯。' }] }],
      },
      {
        id: 'talk',
        text: '試探口風',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '赤練娘冷笑：「嘴皮子利的不見得命長。」話未落，袖針已至眉心——你只能以武作答。',
              },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '抽身退入人群',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你混入茶客之中，赤練娘瞥了你一眼，竟未追來。江湖上有些煞星，躲得過一次，未必躲得過第二次。',
              },
              { type: 'reputation', amount: -2 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'boss_iron_chariot',
    title: '鐵甲車',
    body: '官道塵土飛揚，一輛鐵甲車橫在路心。車簾掀起，魁梧漢子全身重甲，聲如悶雷：「此路是我開——留下買路錢，或者留下命。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: { minAge: 22, minMartial: 35, once: true },
    choices: [
      {
        id: 'fight',
        text: '破車斬將',
        outcomes: [{ effects: [{ type: 'narrate', text: '你繞至車側，尋甲縫破綻，戰端已開。' }] }],
      },
      {
        id: 'pay',
        text: '拋銀試探',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '銀兩落地，鐵甲車主卻哈哈大笑：「不夠買命！」他揮拳砸來，你只能硬接。',
              },
              { type: 'money', amount: -20 },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '繞道而行',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你棄官道走野徑，身後鐵輪碾過的聲音漸遠。這份僥倖，日後或要還。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'boss_wandering_monk',
    title: '瘋癲僧',
    body: '破廟裡酒氣沖天，僧袍油亮。瘋僧敲著木魚大笑：「小友骨骼清奇，可願接老衲三掌？接得住，傳你凌虛；接不住，骨頭散架。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 2,
    requirements: { minAge: 18, minAttrs: { wuXing: 50 }, once: true, minNature: { xia: 8 } },
    choices: [
      {
        id: 'fight',
        text: '合掌應掌',
        outcomes: [{ effects: [{ type: 'narrate', text: '你氣沉丹田，迎上瘋僧第一掌，廟柱震落灰塵。' }] }],
      },
      {
        id: 'wine',
        text: '陪飲三碗',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你連飲三碗，瘋僧拍腿叫好，卻仍要試你身法：「酒喝得，掌也得接！」',
              },
              { type: 'health', amount: -8 },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '合十告退',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '瘋僧也不攔你，只對著背影唱了一句梵音。你走出廟門，心裡竟有些空落。',
              },
              { type: 'attr', delta: { fuYuan: 1 } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'boss_black_wind',
    title: '黑風寨主',
    body: '山風驟冷，林間響起鐵鏈拖地聲。黑風寨主率眾現身，鞭影如幕：「闖我寨門者，今日要留一件東西——命，或者武學。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: { minAge: 24, minMartial: 42, once: true },
    choices: [
      {
        id: 'fight',
        text: '直取寨主',
        outcomes: [{ effects: [{ type: 'narrate', text: '你無視嘍囉，直撲寨主腕脈，鞭風已至面門。' }] }],
      },
      {
        id: 'bluff',
        text: '揚言官府將至',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '寨主眯眼片刻，仍揮鞭：「官府？先過我這關！」謊言換不得真安寧。',
              },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '借樹影遁走',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你在密林中連轉數個方向，身後追殺聲漸息。黑風寨的帳，遲早要算。',
              },
              { type: 'reputation', amount: -3 },
            ],
          },
        ],
      },
    ],
  },
];

export const BOSS_ENCOUNTER_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (_id, text = '此舉') => [
      {
        type: 'narrate',
        text: `首領之戰中你欲「${text}」，卻被對方識破破綻，當場吃了暗虧。`,
      },
      { type: 'health', amount: -22 },
      { type: 'money', amount: -15 },
    ],
    0.14,
  ),
);

export function getBossFightConfig(eventId: string): BossFightConfig | undefined {
  return BOSS_FIGHT_CONFIG[eventId];
}
