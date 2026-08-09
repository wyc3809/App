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

/** 首領戰結算：勝後掉落 */
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
  boss_frost_blade: {
    foeName: '霜刀客',
    foePower: 'boss',
    rewardOnWin: {
      money: 48,
      reputation: 11,
      martial: 10,
      skillId: 'art_thunder_blade',
      skillName: '驚雷刀',
      gearId: 'crescent-blade',
    },
  },
  boss_lute_ferry: {
    foeName: '琵琶舫主',
    foePower: 'boss',
    rewardOnWin: {
      money: 42,
      reputation: 14,
      martial: 8,
      skillId: 'art_whip_silk',
      skillName: '柔絲鞭法',
      gearId: 'meteor-whip',
    },
  },
  boss_sand_scorpion: {
    foeName: '沙蠍客',
    foePower: 'boss',
    rewardOnWin: {
      money: 44,
      reputation: 9,
      martial: 9,
      skillId: 'art_sand_palm',
      skillName: '流沙掌',
      gearId: 'bronze-spear',
    },
  },
  boss_mirror_lake: {
    foeName: '鏡湖隱士',
    foePower: 'boss',
    rewardOnWin: {
      money: 40,
      reputation: 16,
      martial: 11,
      skillId: 'art_mirror_breath',
      skillName: '澄心鏡息',
      gearId: 'jade-token',
    },
  },
};

const RUMORS: GameEvent[] = [
  {
    id: 'rumor_scarlet',
    title: '茶棚耳語',
    body: '茶博士壓低聲音：赤練娘近日在千燈外截人，專取暗器與殘譜。有緣人若撞上，須留三分神。',
    tags: ['special', 'rumor', 'secret'],
    weight: 6,
    requirements: { minAge: 18, once: true, notFlags: ['rumor_boss_scarlet'] },
    choices: [
      {
        id: 'listen',
        text: '默記於心',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_scarlet', value: true },
              { type: 'narrate', text: '你把「赤練娘」三字咬進心裡。茶香未散，風聲已在路上。' },
            ],
          },
        ],
      },
      {
        id: 'ask',
        text: '追問細節',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_scarlet', value: true },
              { type: 'money', amount: -2 },
              { type: 'narrate', text: '你多丟了兩文茶錢，換來袖針與紅裙的細節。' },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '只當閒話',
        outcomes: [{ effects: [{ type: 'narrate', text: '你笑笑不語。有些風聲，聽過也就過了。' }] }],
      },
    ],
  },
  {
    id: 'rumor_iron',
    title: '官道鐵輪',
    body: '商旅說官道有鐵甲車攔路，車主聲如悶雷，過路要買命錢。',
    tags: ['special', 'rumor', 'secret'],
    weight: 5,
    requirements: { minAge: 20, once: true, notFlags: ['rumor_boss_iron'] },
    choices: [
      {
        id: 'mark',
        text: '記下方位',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_iron', value: true },
              { type: 'narrate', text: '你在袖裡劃了道痕：鐵輪過處，日後或要硬闖。' },
            ],
          },
        ],
      },
      {
        id: 'warn',
        text: '轉告路人',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_iron', value: true },
              { type: 'reputation', amount: 2 },
              { type: 'narrate', text: '你把消息傳開，名望略振，鐵甲車的影子卻更清晰了。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '改走野徑',
        outcomes: [{ effects: [{ type: 'narrate', text: '你暫時避開官道。野徑泥濘，心卻稍安。' }] }],
      },
    ],
  },
  {
    id: 'rumor_monk',
    title: '破廟酒氣',
    body: '有人見破廟裡瘋僧敲木魚飲酒，揚言要試過路人三掌。',
    tags: ['special', 'rumor', 'secret'],
    weight: 5,
    requirements: { minAge: 17, once: true, notFlags: ['rumor_boss_monk'], minNature: { xia: 6 } },
    choices: [
      {
        id: 'seek',
        text: '心生好奇',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_monk', value: true },
              { type: 'narrate', text: '你決定日後若近破廟，便去見見那瘋僧。' },
            ],
          },
        ],
      },
      {
        id: 'pray',
        text: '遙遙合十',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_monk', value: true },
              { type: 'attr', delta: { fuYuan: 1 } },
              { type: 'narrate', text: '你合十一禮。酒氣與梵音，似乎都遠了些。' },
            ],
          },
        ],
      },
      {
        id: 'avoid',
        text: '不去招惹',
        outcomes: [{ effects: [{ type: 'narrate', text: '你把破廟劃出行程。有些緣，強求無益。' }] }],
      },
    ],
  },
  {
    id: 'rumor_black',
    title: '黑風過林',
    body: '獵人說黑風寨主鞭影如幕，點名要找過往的江湖人比武。',
    tags: ['special', 'rumor', 'secret'],
    weight: 5,
    requirements: { minAge: 22, once: true, notFlags: ['rumor_boss_black'] },
    choices: [
      {
        id: 'ready',
        text: '磨刀以待',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_black', value: true },
              { type: 'martial', amount: 1 },
              { type: 'narrate', text: '你把兵器擦亮。黑風若來，便以武相見。' },
            ],
          },
        ],
      },
      {
        id: 'scout',
        text: '探聽寨口',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_black', value: true },
              { type: 'narrate', text: '你摸清寨口方位，風聲裡多了一分把握。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '遠走他鄉',
        outcomes: [{ effects: [{ type: 'narrate', text: '你暫時離開林緣。黑風再大，也有吹不到的地方。' }] }],
      },
    ],
  },
  {
    id: 'rumor_frost',
    title: '北嶺寒刀',
    body: '北嶺客商說霜刀客獨行雪地，刀未出鞘已寒氣入骨，似在等人試刀。',
    tags: ['special', 'rumor', 'secret'],
    weight: 4,
    requirements: { minAge: 21, once: true, notFlags: ['rumor_boss_frost'] },
    choices: [
      {
        id: 'note',
        text: '記下刀勢',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_frost', value: true },
              { type: 'narrate', text: '你把「霜刀」二字與北嶺風向一併記牢。' },
            ],
          },
        ],
      },
      {
        id: 'buy',
        text: '買件厚襖',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_frost', value: true },
              { type: 'money', amount: -5 },
              { type: 'narrate', text: '厚襖在身，寒意略退，刀聲卻更清晰。' },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '不當回事',
        outcomes: [{ effects: [{ type: 'narrate', text: '北嶺再遠，與你何干——至少此刻如此。' }] }],
      },
    ],
  },
  {
    id: 'rumor_lute',
    title: '河舫夜曲',
    body: '船家說夜半琵琶一響，便有人失踪。舫主以樂會友，實則以樂試人。',
    tags: ['special', 'rumor', 'secret'],
    weight: 4,
    requirements: { minAge: 19, once: true, notFlags: ['rumor_boss_lute'], maxNature: { e: 55 } },
    choices: [
      {
        id: 'listen',
        text: '隔岸傾聽',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_lute', value: true },
              { type: 'narrate', text: '琵琶聲斷續入耳。你知這曲，日後或要親身接。' },
            ],
          },
        ],
      },
      {
        id: 'coin',
        text: '丟錢問訊',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_lute', value: true },
              { type: 'money', amount: -3 },
              { type: 'narrate', text: '船家收了錢，點出舫尾燈火的方位。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '連夜改道',
        outcomes: [{ effects: [{ type: 'narrate', text: '你改走旱路。夜曲再美，也不必以命相和。' }] }],
      },
    ],
  },
  {
    id: 'rumor_sand',
    title: '沙道蝎影',
    body: '西行客說沙道有人揮掌揚沙，專劫過路武人，人稱沙蠍客。',
    tags: ['special', 'rumor', 'secret'],
    weight: 4,
    requirements: { minAge: 20, once: true, notFlags: ['rumor_boss_sand'] },
    choices: [
      {
        id: 'note',
        text: '記下沙道',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_sand', value: true },
              { type: 'narrate', text: '你把沙道方位與「揚沙迷目」記在心裡。' },
            ],
          },
        ],
      },
      {
        id: 'buy',
        text: '買塊面紗',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_sand', value: true },
              { type: 'money', amount: -4 },
              { type: 'narrate', text: '面紗遮塵，也提醒你：沙蠍若現，先護眼。' },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '不當回事',
        outcomes: [{ effects: [{ type: 'narrate', text: '西行再遠，此刻與你無干。' }] }],
      },
    ],
  },
  {
    id: 'rumor_mirror',
    title: '鏡湖夜燈',
    body: '漁人說鏡湖夜有孤燈，隱士以息會友，能接下他吐納者，可傳澄心之法。',
    tags: ['special', 'rumor', 'secret'],
    weight: 4,
    requirements: {
      minAge: 18,
      once: true,
      notFlags: ['rumor_boss_mirror'],
      minNature: { xia: 10 },
      maxNature: { e: 45 },
    },
    choices: [
      {
        id: 'seek',
        text: '願一訪湖',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_mirror', value: true },
              { type: 'narrate', text: '你把鏡湖畫進行程。孤燈若在，便去一見。' },
            ],
          },
        ],
      },
      {
        id: 'pray',
        text: '隔岸一禮',
        outcomes: [
          {
            effects: [
              { type: 'flag', key: 'rumor_boss_mirror', value: true },
              { type: 'attr', delta: { fuYuan: 1 } },
              { type: 'narrate', text: '你隔岸一禮。湖面無風，心卻靜了半分。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不去打擾',
        outcomes: [{ effects: [{ type: 'narrate', text: '隱士之緣，強求不得。你轉身離去。' }] }],
      },
    ],
  },
];

const FIGHTS: GameEvent[] = [
  {
    id: 'boss_scarlet_viper',
    title: '赤練娘',
    body: '茶棚外紅裙一閃，袖中寒芒對準咽喉。赤練娘笑道：「聽說你記得我名字——那便留下暗器與命，選一樣。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 4,
    requirements: { minAge: 20, minMartial: 28, once: true },
    choices: [
      {
        id: 'fight',
        text: '拔刃應戰',
        outcomes: [{ effects: [{ type: 'narrate', text: '劍光與袖針在半空交錯。' }] }],
      },
      {
        id: 'fight_kill',
        text: '存心取她性命',
        requirements: { minNature: { e: 18 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你眼神一冷，招招奔著咽喉去。' }] }],
      },
      {
        id: 'flee',
        text: '抽身退入人群',
        requirements: { maxNature: { kuang: 45 } },
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你混入茶客之中。赤練娘瞥一眼，竟未追來。' },
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
    body: '官道橫着鐵甲車。車簾掀起，魁梧漢子聲如悶雷：「買路錢，或者命。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 4,
    requirements: { minAge: 22, minMartial: 28, once: true },
    choices: [
      {
        id: 'fight',
        text: '破車斬將',
        outcomes: [{ effects: [{ type: 'narrate', text: '你繞至車側，尋甲縫破綻。' }] }],
      },
      {
        id: 'pay',
        text: '拋銀試探',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '銀兩落地，對方大笑：「不夠買命！」拳風已至。' },
              { type: 'money', amount: -20 },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '繞道而行',
        requirements: { minNature: { xia: 8 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你棄官道走野徑，鐵輪聲漸遠。' }] }],
      },
    ],
  },
  {
    id: 'boss_wandering_monk',
    title: '瘋癲僧',
    body: '破廟酒氣沖天。瘋僧敲木魚大笑：「小友可願接老衲三掌？」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: {
      minAge: 18,
      minAttrs: { wuXing: 48 },
      once: true,
      minNature: { xia: 8 },
    },
    choices: [
      {
        id: 'fight',
        text: '合掌應掌',
        outcomes: [{ effects: [{ type: 'narrate', text: '你氣沉丹田，迎上第一掌。' }] }],
      },
      {
        id: 'wine',
        text: '陪飲三碗',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '酒過三碗，瘋僧仍要試你身法。' },
              { type: 'health', amount: -8 },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '合十告退',
        requirements: { maxNature: { kuang: 40 } },
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '瘋僧不攔，只對着背影唱了一句梵音。' },
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
    body: '林間鐵鏈拖地。黑風寨主鞭影如幕：「今日要留一件——命，或者武學。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 4,
    requirements: { minAge: 24, minMartial: 34, once: true },
    choices: [
      {
        id: 'fight',
        text: '直取寨主',
        outcomes: [{ effects: [{ type: 'narrate', text: '你直撲腕脈，鞭風已至面門。' }] }],
      },
      {
        id: 'fight_kill',
        text: '打算斬草除根',
        requirements: { minNature: { e: 22 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你眼神一沉，招招不留餘地。' }] }],
      },
      {
        id: 'flee',
        text: '借樹影遁走',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '密林連轉，追殺聲漸息。' },
              { type: 'reputation', amount: -3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'boss_frost_blade',
    title: '霜刀客',
    body: '北嶺雪地上，一柄未出鞘的刀凝着霜。刀客抬頭：「來試刀的，就你？」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: { minAge: 21, minMartial: 30, once: true },
    choices: [
      {
        id: 'fight',
        text: '拔刀相對',
        outcomes: [{ effects: [{ type: 'narrate', text: '寒氣入骨，刀光已起。' }] }],
      },
      {
        id: 'talk',
        text: '先問來歷',
        requirements: { minNature: { xia: 12 } },
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '他只回一句「刀不問名」，下一瞬刀已出鞘——只能接。' },
            ],
          },
        ],
      },
      {
        id: 'flee',
        text: '退回南坡',
        requirements: { maxNature: { kuang: 50 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你退回南坡。霜意在背後追了一程。' }] }],
      },
    ],
  },
  {
    id: 'boss_lute_ferry',
    title: '琵琶舫主',
    body: '河舫燈火晃動，琵琶聲忽然一緊。舫主笑：「以樂會友，或以命相和——請。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: {
      minAge: 19,
      minMartial: 30,
      once: true,
      maxNature: { e: 60 },
    },
    choices: [
      {
        id: 'fight',
        text: '以武接曲',
        outcomes: [{ effects: [{ type: 'narrate', text: '弦音化作鞭影，河面濺起水花。' }] }],
      },
      {
        id: 'fight_kill',
        text: '打算拆了這舫',
        requirements: { minNature: { e: 20, kuang: 15 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你不再客氣，招招奔着桅索與人影。' }] }],
      },
      {
        id: 'flee',
        text: '跳幫離去',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你躍向鄰船。琵琶聲在水上碎成一片。' },
              { type: 'reputation', amount: -1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'boss_sand_scorpion',
    title: '沙蠍客',
    body: '沙道揚塵，掌風挾沙直撲面門。沙蠍客低笑：「留下兵器，或留下眼睛。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: { minAge: 20, minMartial: 32, once: true },
    choices: [
      {
        id: 'fight',
        text: '閉氣硬接',
        outcomes: [{ effects: [{ type: 'narrate', text: '你閉氣護目，迎上沙掌。' }] }],
      },
      {
        id: 'fight_kill',
        text: '打算埋了他',
        requirements: { minNature: { e: 20 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你眼神一寒，招招奔着要害。' }] }],
      },
      {
        id: 'flee',
        text: '退回綠洲',
        requirements: { maxNature: { kuang: 48 } },
        outcomes: [{ effects: [{ type: 'narrate', text: '你退回綠洲。沙塵在身後翻湧。' }] }],
      },
    ],
  },
  {
    id: 'boss_mirror_lake',
    title: '鏡湖隱士',
    body: '鏡湖孤燈下，隱士盤膝：「以息相會。接得住，傳你澄心；接不住，湖水會記得你。」',
    tags: ['special', 'combat', 'boss', 'secret'],
    weight: 3,
    requirements: {
      minAge: 18,
      minMartial: 28,
      once: true,
      minNature: { xia: 10 },
      maxNature: { e: 48 },
    },
    choices: [
      {
        id: 'fight',
        text: '以息相迎',
        outcomes: [{ effects: [{ type: 'narrate', text: '兩道內息在湖面相交，水紋成圓。' }] }],
      },
      {
        id: 'talk',
        text: '先請教心法',
        requirements: { minNature: { xia: 16 } },
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '隱士只道「言多無益」，下一息已至——只能硬接。' },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '合十告退',
        requirements: { maxNature: { kuang: 42 } },
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '隱士點頭，孤燈依舊。你帶着未完的緣離開湖岸。' },
              { type: 'attr', delta: { fuYuan: 1 } },
            ],
          },
        ],
      },
    ],
  },
];

export const BOSS_ENCOUNTER_EVENTS: GameEvent[] = [...RUMORS, ...FIGHTS].map((ev) =>
  withRiskAndThree(
    ev,
    (_id, text = '此舉') => [
      {
        type: 'narrate',
        text: `風聲或首領之局中你欲「${text}」，卻踏空一步，當場吃了暗虧。`,
      },
      { type: 'health', amount: -16 },
      { type: 'money', amount: -8 },
    ],
    0.12,
  ),
);

export function getBossFightConfig(eventId: string): BossFightConfig | undefined {
  return BOSS_FIGHT_CONFIG[eventId];
}
