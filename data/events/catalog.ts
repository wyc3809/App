import type { GameEvent } from '@interfaces/lifeEngine';

/** 江湖一生 V1 — 事件資料庫（50） */
export const EVENT_CATALOG: GameEvent[] = [
  {
    id: 'life_birth',
    title: '降生',
    body: '嬰兒啼哭，家人歡喜。',
    weight: 100,
    requirements: { maxAge: 0, once: true },
    choices: [
      {
        id: 'cry',
        text: '哭聲洪亮',
        outcomes: [{ effects: [{ type: 'attr', delta: { genGu: 2 } }, { type: 'narrate', text: '就「降生」一事，你選擇「哭聲洪亮」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
      {
        id: 'quiet',
        text: '安靜凝視',
        outcomes: [{ effects: [{ type: 'attr', delta: { wuXing: 2 } }, { type: 'narrate', text: '就「降生」一事，你選擇「安靜凝視」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
    ],
  },
  {
    id: 'childhood_play',
    title: '童年嬉戲',
    requirements: { minAge: 3, maxAge: 10 },
    choices: [
      {
        id: 'stick',
        text: '木劍為伴',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「童年嬉戲」一事，你選擇「木劍為伴」。武學上進了半寸，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 2 }, { type: 'attr', delta: { danShi: 1 } }] }],
      },
      {
        id: 'book',
        text: '偷聽說書',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「童年嬉戲」一事，你選擇「偷聽說書」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { wuXing: 2, meiLi: 1 } }] }],
      },
    ],
  },
  {
    id: 'family_poverty',
    title: '家道中落',
    requirements: { minAge: 6, maxAge: 16 },
    choices: [
      {
        id: 'help',
        text: '幫父母分憂',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「家道中落」一事，你選擇「幫父母分憂」。袋中多了幾兩銀，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 5 }, { type: 'attr', delta: { meiLi: 1 } }] }],
      },
      {
        id: 'complain',
        text: '怨天尤人',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「家道中落」一事，你選擇「怨天尤人」。名望有了起伏，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { fuYuan: -2 } }, { type: 'reputation', amount: -3 }] }],
      },
    ],
  },
  {
    id: 'find_coin',
    title: '路拾銅錢',
    requirements: { minAge: 5, maxAge: 20 },
    weight: 15,
    choices: [
      {
        id: 'keep',
        text: '收進懷裡',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「路拾銅錢」一事，你選擇「收進懷裡」。袋中多了幾兩銀，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 15 }, { type: 'attr', delta: { fuYuan: 1 } }] }],
      },
      {
        id: 'return',
        text: '交還失主',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「路拾銅錢」一事，你選擇「交還失主」。名望有了起伏，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 8 }, { type: 'attr', delta: { meiLi: 2 } }] }],
      },
    ],
  },
  {
    id: 'master_wanderer',
    title: '遊方道人',
    requirements: { minAge: 8, maxAge: 18, once: true },
    choices: [
      {
        id: 'learn',
        text: '請教吐納',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'skill_breath', name: '基礎吐納' },
              { type: 'martial', amount: 3 },
              { type: 'flag', key: 'met_master', value: true },
            ],
          },
        ],
      },
      {
        id: 'ignore',
        text: '匆匆離去',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「遊方道人」一事，你選擇「請教吐納」。你把一段功夫收入懷中，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
    ],
  },
  {
    id: 'sect_recruit',
    title: '門派招收弟子',
    requirements: { minAge: 12, maxAge: 25, noSect: true, once: true },
    choices: [
      {
        id: 'join',
        text: '拜入山門',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「門派招收弟子」一事，你選擇「拜入山門」。武學上進了半寸，山門為你開了一縫。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'joinSect' }, { type: 'martial', amount: 5 }] }],
      },
      {
        id: 'decline',
        text: '婉言謝絕',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: 1 } }, { type: 'narrate', text: '就「門派招收弟子」一事，你選擇「婉言謝絕」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
    ],
  },
  {
    id: 'sect_training',
    title: '門派演武',
    requirements: { minAge: 14, sectRequired: true },
    choices: [
      {
        id: 'hard',
        text: '苦練不止',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「門派演武」一事，你選擇「苦練不止」。皮肉受苦，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 6 }, { type: 'health', amount: -5 }] }],
      },
      {
        id: 'rest',
        text: '適度調息',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「門派演武」一事，你選擇「適度調息」。氣色回了些，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 3 }, { type: 'health', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'learn_sword',
    title: '劍譜殘頁',
    requirements: { minAge: 15, minMartial: 5, once: true },
    choices: [
      {
        id: 'study',
        text: '日夜鑽研',
        outcomes: [
          { effects: [{ type: 'narrate', text: '就「劍譜殘頁」一事，你選擇「日夜鑽研」。你把一段功夫收入懷中，袋中多了幾兩銀，武學上進了半寸，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'learnSkill', skillId: 'skill_sword_basic', name: '青雲劍法（殘篇）' },
              { type: 'martial', amount: 8 },
              { type: 'attr', delta: { wuXing: 2 } },
            ],
          },
        ],
      },
      {
        id: 'sell',
        text: '賣給書商',
        outcomes: [{ effects: [{ type: 'money', amount: 40 }] }],
      },
    ],
  },
  {
    id: 'love_meet',
    title: '燈會相逢',
    requirements: { minAge: 16, maxAge: 35, once: true },
    choices: [
      {
        id: 'talk',
        text: '主動搭話',
        outcomes: [
          {
            effects: [
              { type: 'memory', npcId: 'lover_candidate', text: '燈會初遇', affinity: 20 },
              { type: 'flag', key: 'romance_started', value: true },
              { type: 'narrate', text: '就「燈會相逢」一事，你選擇「主動搭話」。心性與根骨似被撥動，情絲悄然繫上。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' },
            ],
          },
        ],
      },
      {
        id: 'shy',
        text: '遠遠相望',
        outcomes: [{ effects: [{ type: 'attr', delta: { meiLi: -1 } }] }],
      },
    ],
  },
  {
    id: 'love_confess',
    title: '表白心跡',
    requirements: { minAge: 18, flags: { romance_started: true }, once: true },
    choices: [
      {
        id: 'yes',
        text: '真情告白',
        outcomes: [
          {
            chance: 0.65,
            effects: [
              { type: 'lover', npcId: 'lover_candidate' },
              { type: 'attr', delta: { meiLi: 3 } },
            ],
          },
          {
            chance: 0.35,
            effects: [{ type: 'narrate', text: '就「表白心跡」一事，你選擇「真情告白」。皮肉受苦，心性與根骨似被撥動，情絲悄然繫上。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -10 }],
          },
        ],
      },
      {
        id: 'wait',
        text: '再等等',
        outcomes: [{ effects: [{ type: 'attr', delta: { danShi: -1 } }] }],
      },
    ],
  },
  {
    id: 'duel_street',
    title: '街頭決鬥',
    requirements: { minAge: 16, minMartial: 10 },
    choices: [
      {
        id: 'fight',
        text: '拔劍應戰',
        outcomes: [
          {
            chance: 0.55,
            effects: [
              { type: 'martial', amount: 4 },
              { type: 'reputation', amount: 10 },
              { type: 'narrate', text: '就「街頭決鬥」一事，你選擇「拔劍應戰」。皮肉受苦，名望有了起伏，武學上進了半寸，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' },
            ],
          },
          {
            chance: 0.45,
            effects: [{ type: 'health', amount: -25 }, { type: 'narrate', text: '就「街頭決鬥」一事，你選擇「拔劍應戰」。皮肉受苦，名望有了起伏，武學上進了半寸，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }],
          },
        ],
      },
      {
        id: 'flee',
        text: '避其鋒芒',
        outcomes: [{ effects: [{ type: 'reputation', amount: -5 }, { type: 'attr', delta: { danShi: -2 } }] }],
      },
    ],
  },
  {
    id: 'bandit_raid',
    title: '山賊劫道',
    requirements: { minAge: 14 },
    choices: [
      {
        id: 'defend',
        text: '護送商旅',
        outcomes: [
          {
            chance: 0.5,
            effects: [{ type: 'money', amount: 25 }, { type: 'reputation', amount: 12 }, { type: 'health', amount: -15 }],
          },
          {
            chance: 0.5,
            effects: [{ type: 'health', amount: -30 }, { type: 'money', amount: -10 }],
          },
        ],
      },
      {
        id: 'hide',
        text: '躲入草叢',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「山賊劫道」一事，你選擇「護送商旅」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { danShi: -1 } }] }],
      },
    ],
  },
  {
    id: 'wealth_trade',
    title: '商路機緣',
    requirements: { minAge: 18, minAttrs: { wuXing: 45 } },
    choices: [
      {
        id: 'invest',
        text: '投資貨棧',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「商路機緣」一事，你選擇「投資貨棧」。袋中多了幾兩銀，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 60 }, { type: 'attr', delta: { fuYuan: 1 } }] }],
      },
      {
        id: 'pass',
        text: '穩妥為上',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「商路機緣」一事，你選擇「穩妥為上」。袋中多了幾兩銀。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 10 }] }],
      },
    ],
  },
  {
    id: 'plague',
    title: '瘟疫蔓延',
    requirements: { minAge: 10 },
    weight: 8,
    choices: [
      {
        id: 'aid',
        text: '施粥救患',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「瘟疫蔓延」一事，你選擇「施粥救患」。皮肉受苦，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -15 }, { type: 'reputation', amount: 15 }] }],
      },
      {
        id: 'flee_city',
        text: '離城避禍',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「瘟疫蔓延」一事，你選擇「離城避禍」。銀兩離手，皮肉受苦。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -20 }, { type: 'health', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'martial_tournament',
    title: '武林大會',
    requirements: { minAge: 20, minMartial: 25, once: true },
    choices: [
      {
        id: 'enter',
        text: '登台比武',
        outcomes: [
          {
            chance: 0.4,
            effects: [
              { type: 'reputation', amount: 30 },
              { type: 'martial', amount: 10 },
              { type: 'money', amount: 50 },
            ],
          },
          {
            chance: 0.6,
            effects: [{ type: 'health', amount: -20 }, { type: 'martial', amount: 3 }],
          },
        ],
      },
      {
        id: 'watch',
        text: '旁觀學藝',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「武林大會」一事，你選擇「登台比武」。武學上進了半寸，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 5 }, { type: 'attr', delta: { wuXing: 2 } }] }],
      },
    ],
  },
  {
    id: 'inner_power',
    title: '內力突破',
    requirements: { minAge: 18, minMartial: 20, once: true },
    choices: [
      {
        id: 'breakthrough',
        text: '閉關七日',
        outcomes: [
          {
            chance: 0.6,
            effects: [
              { type: 'martial', amount: 12 },
              { type: 'attr', delta: { genGu: 3 } },
              { type: 'learnSkill', skillId: 'skill_internal', name: '混元心法' },
            ],
          },
          {
            chance: 0.4,
            effects: [{ type: 'health', amount: -20 }, { type: 'narrate', text: '走火入魔，僥倖撿回一命。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'betray_sect',
    title: '師門猜忌',
    requirements: { minAge: 22, sectRequired: true },
    choices: [
      {
        id: 'explain',
        text: '稟明掌門',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「師門猜忌」一事，你選擇「稟明掌門」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 5 }] }],
      },
      {
        id: 'leave',
        text: '憤而離山',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「師門猜忌」一事，你選擇「憤而離山」。武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'leaveSect' }, { type: 'martial', amount: 2 }] }],
      },
    ],
  },
  {
    id: 'elder_task',
    title: '長老密令',
    requirements: { minAge: 25, sectRequired: true, minMartial: 30 },
    choices: [
      {
        id: 'accept',
        text: '奉命行事',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「長老密令」一事，你選擇「奉命行事」。袋中多了幾兩銀，名望有了起伏，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 35 }, { type: 'martial', amount: 5 }, { type: 'reputation', amount: 8 }] }],
      },
      {
        id: 'refuse',
        text: '稱病推辭',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「長老密令」一事，你選擇「稱病推辭」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: -8 }] }],
      },
    ],
  },
  {
    id: 'rival_challenge',
    title: '宿敵挑戰',
    requirements: { minAge: 20, minMartial: 15 },
    choices: [
      {
        id: 'duel',
        text: '應戰',
        outcomes: [
          {
            chance: 0.5,
            effects: [{ type: 'martial', amount: 6 }, { type: 'reputation', amount: 15 }],
          },
          {
            chance: 0.5,
            effects: [{ type: 'health', amount: -35 }],
          },
        ],
      },
    ],
  },
  {
    id: 'treasure_map',
    title: '藏寶圖',
    requirements: { minAge: 18, minAttrs: { fuYuan: 50 }, once: true },
    choices: [
      {
        id: 'dig',
        text: '按圖尋寶',
        outcomes: [
          {
            chance: 0.7,
            effects: [{ type: 'money', amount: 120 }, { type: 'martial', amount: 3 }],
          },
          {
            chance: 0.3,
            effects: [{ type: 'health', amount: -25 }, { type: 'narrate', text: '陷阱埋伏，空手而歸。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'wine_poet',
    title: '酒肆詩會',
    requirements: { minAge: 16, minAttrs: { meiLi: 40 } },
    choices: [
      {
        id: 'recite',
        text: '即興吟詩',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「酒肆詩會」一事，你選擇「即興吟詩」。名望有了起伏，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 12 }, { type: 'attr', delta: { meiLi: 2 } }] }],
      },
      {
        id: 'drink',
        text: '只顧暢飲',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「酒肆詩會」一事，你選擇「只顧暢飲」。銀兩離手，皮肉受苦。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -5 }, { type: 'money', amount: -8 }] }],
      },
    ],
  },
  {
    id: 'assassin',
    title: '殺手夜襲',
    requirements: { minAge: 22, minMartial: 20 },
    choices: [
      {
        id: 'fight',
        text: '反殺',
        outcomes: [
          {
            chance: 0.45,
            effects: [{ type: 'martial', amount: 8 }, { type: 'money', amount: 30 }],
          },
          {
            chance: 0.55,
            effects: [{ type: 'health', amount: -40 }],
          },
        ],
      },
      {
        id: 'escape',
        text: '翻窗逃走',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「殺手夜襲」一事，你選擇「反殺」。皮肉受苦，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -10 }, { type: 'reputation', amount: -10 }] }],
      },
    ],
  },
  {
    id: 'parent_ill',
    title: '父母染恙',
    requirements: { minAge: 12, maxAge: 40, once: true },
    choices: [
      {
        id: 'care',
        text: '床前盡孝',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「父母染恙」一事，你選擇「床前盡孝」。銀兩離手，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -25 }, { type: 'attr', delta: { meiLi: 3, fuYuan: 2 } }] }],
      },
      {
        id: 'doctor',
        text: '請名醫診治',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「父母染恙」一事，你選擇「請名醫診治」。銀兩離手，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -50 }, { type: 'reputation', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'war_draft',
    title: '征召從軍',
    requirements: { minAge: 18, maxAge: 45 },
    weight: 6,
    choices: [
      {
        id: 'serve',
        text: '從軍出征',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「征召從軍」一事，你選擇「從軍出征」。皮肉受苦，名望有了起伏，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 10 }, { type: 'health', amount: -25 }, { type: 'reputation', amount: 10 }] }],
      },
      {
        id: 'bribe',
        text: '設法逃避',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「征召從軍」一事，你選擇「設法逃避」。銀兩離手，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -40 }, { type: 'reputation', amount: -15 }] }],
      },
    ],
  },
  {
    id: 'inn_brawl',
    title: '客棧鬥毆',
    requirements: { minAge: 15 },
    choices: [
      {
        id: 'join',
        text: '捲入其中',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「客棧鬥毆」一事，你選擇「捲入其中」。皮肉受苦，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -12 }, { type: 'martial', amount: 2 }] }],
      },
      {
        id: 'mediate',
        text: '居中調停',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「客棧鬥毆」一事，你選擇「居中調停」。名望有了起伏，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 6 }, { type: 'attr', delta: { meiLi: 1 } }] }],
      },
    ],
  },
  {
    id: 'secret_manual',
    title: '密室經書',
    requirements: { minAge: 20, minAttrs: { wuXing: 55 }, once: true },
    choices: [
      {
        id: 'read',
        text: '研讀經書',
        outcomes: [
          {
            effects: [
              { type: 'learnSkill', skillId: 'skill_palm', name: '降龍十八掌（殘）' },
              { type: 'martial', amount: 15 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'gamble',
    title: '賭坊際遇',
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'play',
        text: '小賭怡情',
        outcomes: [
          { chance: 0.4, effects: [{ type: 'money', amount: 30 }] },
          { chance: 0.6, effects: [{ type: 'money', amount: -25 }] },
        ],
      },
      {
        id: 'quit',
        text: '見好就收',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「賭坊際遇」一事，你選擇「見好就收」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { danShi: 1 } }] }],
      },
    ],
  },
  {
    id: 'rescue_child',
    title: '落水孩童',
    requirements: { minAge: 10, maxAge: 50 },
    choices: [
      {
        id: 'save',
        text: '跳水救人',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「落水孩童」一事，你選擇「跳水救人」。皮肉受苦，名望有了起伏，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 10 }, { type: 'health', amount: -8 }, { type: 'attr', delta: { danShi: 2 } }] }],
      },
    ],
  },
  {
    id: 'herb_gather',
    title: '採藥深山',
    requirements: { minAge: 12 },
    choices: [
      {
        id: 'go',
        text: '入山採藥',
        outcomes: [
          { chance: 0.6, effects: [{ type: 'money', amount: 20 }, { type: 'health', amount: 5 }] },
          { chance: 0.4, effects: [{ type: 'health', amount: -15 }] },
        ],
      },
    ],
  },
  {
    id: 'sect_promotion',
    title: '晉升內門',
    requirements: { minAge: 20, sectRequired: true, minMartial: 35, once: true },
    choices: [
      {
        id: 'trial',
        text: '參加考核',
        outcomes: [
          {
            chance: 0.55,
            effects: [{ type: 'martial', amount: 8 }, { type: 'reputation', amount: 12 }, { type: 'flag', key: 'inner_disciple', value: true }],
          },
          {
            chance: 0.45,
            effects: [{ type: 'narrate', text: '考核失利，來年再試。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'love_rival',
    title: '情敵出現',
    requirements: { minAge: 18, flags: { romance_started: true } },
    choices: [
      {
        id: 'confront',
        text: '當面對質',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'reputation', amount: 5 }, { type: 'martial', amount: 2 }] },
          { chance: 0.5, effects: [{ type: 'health', amount: -15 }, { type: 'memory', npcId: 'lover_candidate', text: '因爭執疏遠', affinity: -15 }] },
        ],
      },
      {
        id: 'trust',
        text: '選擇信任',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「情敵出現」一事，你選擇「選擇信任」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { meiLi: 2 } }] }],
      },
    ],
  },
  {
    id: 'monk_alms',
    title: '僧侶化緣',
    requirements: { minAge: 8 },
    choices: [
      {
        id: 'give',
        text: '布施銀錢',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「僧侶化緣」一事，你選擇「布施銀錢」。銀兩離手，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -5 }, { type: 'attr', delta: { fuYuan: 3 } }] }],
      },
      {
        id: 'listen',
        text: '聽經半日',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「僧侶化緣」一事，你選擇「聽經半日」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { wuXing: 2 } }] }],
      },
    ],
  },
  {
    id: 'blacksmith',
    title: '名匠鑄劍',
    requirements: { minAge: 18, minMoney: 50, once: true },
    choices: [
      {
        id: 'buy',
        text: '重金求劍',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「名匠鑄劍」一事，你選擇「重金求劍」。銀兩離手，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -50 }, { type: 'martial', amount: 5 }] }],
      },
      {
        id: 'apprentice',
        text: '學徒打雜',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「名匠鑄劍」一事，你選擇「學徒打雜」。銀兩離手，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 3 }, { type: 'money', amount: -10 }] }],
      },
    ],
  },
  {
    id: 'court_summon',
    title: '朝廷徵召',
    requirements: { minAge: 25, minReputation: 30 },
    choices: [
      {
        id: 'serve_court',
        text: '入朝為官',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「朝廷徵召」一事，你選擇「入朝為官」。袋中多了幾兩銀，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: 80 }, { type: 'reputation', amount: 20 }, { type: 'flag', key: 'court_official', value: true }] }],
      },
      {
        id: 'decline_court',
        text: '辭不就徵',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「朝廷徵召」一事，你選擇「辭不就徵」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 5 }] }],
      },
    ],
  },
  {
    id: 'jianghu_rumor',
    title: '江湖傳聞',
    requirements: { minAge: 14 },
    weight: 12,
    choices: [
      {
        id: 'investigate',
        text: '追查真相',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'martial', amount: 4 }, { type: 'money', amount: 15 }] },
          { chance: 0.5, effects: [{ type: 'health', amount: -10 }] },
        ],
      },
      {
        id: 'ignore_rumor',
        text: '一笑置之',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「江湖傳聞」一事，你選擇「一笑置之」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { wuXing: 1 } }] }],
      },
    ],
  },
  {
    id: 'poison_test',
    title: '試毒疑雲',
    requirements: { minAge: 20, sectRequired: true },
    choices: [
      {
        id: 'taste',
        text: '親自試毒',
        outcomes: [
          { chance: 0.6, effects: [{ type: 'reputation', amount: 10 }, { type: 'attr', delta: { danShi: 3 } }] },
          { chance: 0.4, effects: [{ type: 'health', amount: -30 }] },
        ],
      },
      {
        id: 'send',
        text: '讓弟子試',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「試毒疑雲」一事，你選擇「讓弟子試」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: -12 }] }],
      },
    ],
  },
  {
    id: 'wedding',
    title: '好友婚禮',
    requirements: { minAge: 18 },
    choices: [
      {
        id: 'gift',
        text: '厚禮出席',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「好友婚禮」一事，你選擇「厚禮出席」。銀兩離手，名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -15 }, { type: 'reputation', amount: 6 }] }],
      },
      {
        id: 'perform',
        text: '獻藝助興',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「好友婚禮」一事，你選擇「獻藝助興」。名望有了起伏，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 10 }, { type: 'martial', amount: 1 }] }],
      },
    ],
  },
  {
    id: 'night_assault',
    title: '夜練劍法',
    requirements: { minAge: 14, minMartial: 8 },
    choices: [
      {
        id: 'practice',
        text: '月下苦練',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「夜練劍法」一事，你選擇「月下苦練」。皮肉受苦，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 4 }, { type: 'health', amount: -3 }] }],
      },
    ],
  },
  {
    id: 'caravan_guard',
    title: '護鏢任務',
    requirements: { minAge: 17, minMartial: 12 },
    choices: [
      {
        id: 'guard',
        text: '押鏢千里',
        outcomes: [
          { chance: 0.65, effects: [{ type: 'money', amount: 45 }, { type: 'martial', amount: 3 }] },
          { chance: 0.35, effects: [{ type: 'health', amount: -22 }, { type: 'money', amount: 10 }] },
        ],
      },
    ],
  },
  {
    id: 'lost_in_forest',
    title: '迷失林海',
    requirements: { minAge: 10, maxAge: 30 },
    choices: [
      {
        id: 'calm',
        text: '靜心辨位',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「迷失林海」一事，你選擇「靜心辨位」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { wuXing: 2, danShi: 1 } }] }],
      },
      {
        id: 'panic',
        text: '慌亂奔逃',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「迷失林海」一事，你選擇「慌亂奔逃」。皮肉受苦。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: -12 }] }],
      },
    ],
  },
  {
    id: 'sect_library',
    title: '藏經閣',
    requirements: { minAge: 16, sectRequired: true },
    choices: [
      {
        id: 'steal_read',
        text: '偷閱秘笈',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'martial', amount: 7 }, { type: 'attr', delta: { wuXing: 3 } }] },
          { chance: 0.5, effects: [{ type: 'reputation', amount: -15 }, { type: 'health', amount: -10 }] },
        ],
      },
      {
        id: 'proper',
        text: '正規借閱',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「藏經閣」一事，你選擇「正規借閱」。武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'martial', amount: 4 }] }],
      },
    ],
  },
  {
    id: 'old_age_reflect',
    title: '花甲回首',
    requirements: { minAge: 60 },
    weight: 20,
    choices: [
      {
        id: 'write',
        text: '撰寫遊記',
        outcomes: [{ effects: [{ type: 'reputation', amount: 15 }, { type: 'narrate', text: '就「花甲回首」一事，你選擇「撰寫遊記」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
      {
        id: 'teach',
        text: '傳功後輩',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「花甲回首」一事，你選擇「傳功後輩」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'reputation', amount: 20 }, { type: 'flag', key: 'legacy_teacher', value: true }] }],
      },
    ],
  },
  {
    id: 'fatal_illness',
    title: '惡疾纏身',
    requirements: { minAge: 55 },
    weight: 15,
    choices: [
      {
        id: 'fight',
        text: '求醫問藥',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'money', amount: -60 }, { type: 'health', amount: 20 }] },
          { chance: 0.5, effects: [{ type: 'die', reason: '藥石罔效，病逝。' }] },
        ],
      },
      {
        id: 'accept',
        text: '安然面對',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「惡疾纏身」一事，你選擇「安然面對」。心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'attr', delta: { danShi: 3 } }] }],
      },
    ],
  },
  {
    id: 'final_duel',
    title: '生涯之戰',
    requirements: { minAge: 40, minMartial: 50, once: true },
    choices: [
      {
        id: 'all_in',
        text: '全力一戰',
        outcomes: [
          { chance: 0.55, effects: [{ type: 'reputation', amount: 40 }, { type: 'martial', amount: 5 }] },
          { chance: 0.45, effects: [{ type: 'die', reason: '力竭而亡，江湖扼腕。' }] },
        ],
      },
      {
        id: 'retire',
        text: '金盆洗手',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「生涯之戰」一事，你選擇「金盆洗手」。武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'flag', key: 'retired', value: true }, { type: 'martial', amount: -5 }] }],
      },
    ],
  },
  {
    id: 'inheritance',
    title: '家族傳承',
    requirements: { minAge: 30, minMoney: 100, once: true },
    choices: [
      {
        id: 'pass',
        text: '立族規傳後人',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「家族傳承」一事，你選擇「立族規傳後人」。名望有了起伏。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'flag', key: 'family_legacy', value: true }, { type: 'reputation', amount: 10 }] }],
      },
    ],
  },
  {
    id: 'random_fortune',
    title: '算命先生',
    requirements: { minAge: 12 },
    weight: 10,
    choices: [
      {
        id: 'pay',
        text: '花錢算命',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「算命先生」一事，你選擇「花錢算命」。銀兩離手，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'money', amount: -8 }, { type: 'attr', delta: { fuYuan: 2 } }] }],
      },
    ],
  },
  {
    id: 'kidnap_plot',
    title: '綁架陰謀',
    requirements: { minAge: 16, minAttrs: { danShi: 35 } },
    choices: [
      {
        id: 'rescue',
        text: '營救人質',
        outcomes: [
          { chance: 0.5, effects: [{ type: 'reputation', amount: 18 }, { type: 'health', amount: -18 }] },
          { chance: 0.5, effects: [{ type: 'health', amount: -35 }] },
        ],
      },
    ],
  },
  {
    id: 'peaceful_year',
    title: '歲月靜好',
    requirements: { minAge: 1 },
    weight: 25,
    choices: [
      {
        id: 'rest',
        text: '平淡度日',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「歲月靜好」一事，你選擇「平淡度日」。氣色回了些，心性與根骨似被撥動。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }, { type: 'health', amount: 5 }, { type: 'attr', delta: { fuYuan: 1 } }] }],
      },
    ],
  },
  {
    id: 'accident_fall',
    title: '失足墜崖',
    requirements: { minAge: 15 },
    weight: 5,
    choices: [
      {
        id: 'lucky',
        text: '抓住藤蔓',
        outcomes: [
          { chance: 0.7, effects: [{ type: 'attr', delta: { fuYuan: 2 } }, { type: 'martial', amount: 2 }] },
          { chance: 0.3, effects: [{ type: 'die', reason: '墜崖身亡。' }] },
        ],
      },
    ],
  },
  {
    id: 'meet_hermit',
    title: '世外高人',
    requirements: { minAge: 25, minAttrs: { fuYuan: 55 }, once: true },
    choices: [
      {
        id: 'kowtow',
        text: '拜師求道',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 20 },
              { type: 'learnSkill', skillId: 'skill_hermit', name: '逍遙步' },
              { type: 'flag', key: 'hermit_student', value: true },
            ],
          },
        ],
      },
      {
        id: 'miss',
        text: '錯過機緣',
        outcomes: [{ effects: [{ type: 'narrate', text: '就「世外高人」一事，你選擇「拜師求道」。你把一段功夫收入懷中，武學上進了半寸。這段經過像一頁墨跡，慢慢乾在你的江湖年譜裡。' }] }],
      },
    ],
  },
];

export const EVENT_COUNT = EVENT_CATALOG.length;

/** 依標題／id 補 tags，供人生階段權重使用 */
for (const ev of EVENT_CATALOG) {
  if (ev.tags?.length) continue;
  const tags: string[] = [];
  if (/child|birth|family|parent|童年|父母|襁褓|降生|嬉戲/.test(ev.id + ev.title)) tags.push('childhood', 'family');
  if (/love|romance|表白|燈會|情敵|眷屬/.test(ev.id + ev.title)) tags.push('romance');
  if (/duel|assassin|bandit|rival|combat|決鬥|殺手|山賊|宿敵|比武/.test(ev.id + ev.title))
    tags.push('combat', 'martial');
  if (/sect|master|門派|拜|劍譜|內力|藏經|晉升/.test(ev.id + ev.title)) tags.push('martial');
  if (/old|fatal|花甲|惡疾|遲暮|生涯/.test(ev.id + ev.title)) tags.push('old_age');
  if (/die|墜崖|身亡/.test(ev.id + ev.title)) tags.push('death');
  if (tags.length) ev.tags = tags;
}
