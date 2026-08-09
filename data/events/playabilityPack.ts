import type { GameEvent } from '@interfaces/lifeEngine';

/** 可玩性擴充包：職業／門派政治／殘譜／旅途 */
export const PLAYABILITY_EVENTS: GameEvent[] = [
  {
    id: 'play_career_offer',
    title: '行當招手',
    body: '鎮口有人吆喝招手：鏢局缺人、衙門募役、藥鋪請坐堂、還有人鬼鬼祟祟問你可識金石。',
    tags: ['ordinary', 'career'],
    weight: 9,
    requirements: { minAge: 18, notFlags: ['career_id'] },
    choices: [
      {
        id: 'escort',
        text: '投鏢局',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你接下鏢旗。以後車馬道上，刀光便是飯錢。' },
              { type: 'flag', key: 'career_id', value: 'escort' },
              { type: 'money', amount: 10 },
              { type: 'reputation', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'constable',
        text: '應捕快',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '官差腰牌入手。緝盜捉賊，名望與麻煩一併上門。' },
              { type: 'flag', key: 'career_id', value: 'constable' },
              { type: 'reputation', amount: 3 },
              { type: 'nature', delta: { xia: 1 } },
            ],
          },
        ],
      },
      {
        id: 'healer',
        text: '做遊醫',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '藥箱一挎，你開始走街行醫。少些殺氣，多些香火。' },
              { type: 'flag', key: 'career_id', value: 'healer' },
              { type: 'money', amount: 6 },
              { type: 'nature', delta: { xia: 1, e: -1 } },
            ],
          },
        ],
      },
      {
        id: 'tomb',
        text: '去摸金',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你接過羅盤與短鏟。廢塚夜色裡，銀兩與屍氣同路。' },
              { type: 'flag', key: 'career_id', value: 'tomb' },
              { type: 'money', amount: 18 },
              { type: 'nature', delta: { xie: 1, e: 1 } },
              { type: 'reputation', amount: -2 },
            ],
          },
        ],
      },
      {
        id: 'decline',
        text: '不做行當',
        outcomes: [
          {
            weight: 1,
            effects: [{ type: 'narrate', text: '你拱手謝過，仍做閒雲一身。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'play_career_job',
    title: '本業差事',
    body: '行當上有樁差事找上門——接或不接，都在你一句話。',
    tags: ['ordinary', 'career'],
    weight: 11,
    requirements: { minAge: 18, flags: { career_id: 'escort' } },
    choices: [
      {
        id: 'take',
        text: '接鏢護貨',
        outcomes: [
          {
            weight: 2,
            effects: [
              { type: 'narrate', text: '鏢車過嶺，你刀下逼退剪徑。貨主添了賞金。' },
              { type: 'money', amount: 22 },
              { type: 'martial', amount: 1 },
              { type: 'reputation', amount: 1 },
            ],
          },
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '遇著硬茬，鏢銀散了半箱，你也掛了彩。' },
              { type: 'money', amount: -8 },
              { type: 'health', amount: -12 },
            ],
          },
        ],
      },
      {
        id: 'skip',
        text: '推給別人',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你稱病不出。鏢局裡闲話漸起。' },
              { type: 'reputation', amount: -1 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'play_career_constable',
    title: '衙門差票',
    body: '捕頭丟來一張差票：城外有盜，要你帶人去緝。',
    tags: ['ordinary', 'career'],
    weight: 11,
    requirements: { minAge: 18, flags: { career_id: 'constable' } },
    choices: [
      {
        id: 'hunt',
        text: '連夜緝捕',
        outcomes: [
          {
            weight: 2,
            effects: [
              { type: 'narrate', text: '你拿下盜首，縣裡賞錢到手，百姓也記得你臉。' },
              { type: 'money', amount: 14 },
              { type: 'reputation', amount: 3 },
              { type: 'nature', delta: { xia: 1 } },
            ],
          },
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '盜匪竄入林中，你空手而歸，還挨了上司一頓斥。' },
              { type: 'reputation', amount: -2 },
              { type: 'health', amount: -6 },
            ],
          },
        ],
      },
      {
        id: 'bribe',
        text: '收錢放人',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '銀子沉甸甸，良心卻輕了。' },
              { type: 'money', amount: 30 },
              { type: 'nature', delta: { e: 2, xia: -1 } },
              { type: 'reputation', amount: -3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'play_career_healer',
    title: '求醫者至',
    body: '門外有人咳血求藥——是救，是索高價，還是怕惹麻煩拒之？',
    tags: ['ordinary', 'career'],
    weight: 11,
    requirements: { minAge: 18, flags: { career_id: 'healer' } },
    choices: [
      {
        id: 'heal',
        text: '義診施藥',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你診脈開方。對方痊癒後，逢人便說你的好。' },
              { type: 'money', amount: -4 },
              { type: 'reputation', amount: 4 },
              { type: 'nature', delta: { xia: 2 } },
            ],
          },
        ],
      },
      {
        id: 'charge',
        text: '照市收錢',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '藥金兩清。你不多不少，心裡也安。' },
              { type: 'money', amount: 12 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'play_career_tomb',
    title: '廢塚夜色',
    body: '羅盤微顫。塚門半開——進去，可能是寶，也可能是葬身之處。',
    tags: ['ordinary', 'career'],
    weight: 10,
    requirements: { minAge: 18, flags: { career_id: 'tomb' } },
    choices: [
      {
        id: 'enter',
        text: '摸進去',
        outcomes: [
          {
            weight: 2,
            effects: [
              { type: 'narrate', text: '你掘得古物與半卷殘譜，袖裡一涼。' },
              { type: 'money', amount: 28 },
              { type: 'flag', key: '_roll_fragment', value: true },
              { type: 'nature', delta: { xie: 1 } },
            ],
          },
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '機關觸發，石屑砸肩。你狼狽爬出，只剩半口氣。' },
              { type: 'health', amount: -18 },
              { type: 'money', amount: -5 },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '今夜不作',
        outcomes: [
          {
            weight: 1,
            effects: [{ type: 'narrate', text: '你收起羅盤。有些墓，不開也罷。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'play_sect_politics',
    title: '山門風波',
    body: '師兄弟為了執事之位暗中較勁。長老目光掃過你——是站隊，是調解，還是裝聾？',
    tags: ['ordinary', 'sect', 'politics'],
    weight: 12,
    requirements: { minAge: 17, flags: { joined_sect: true } },
    choices: [
      {
        id: 'side_elder',
        text: '站長老一邊',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你遞上名帖，表明心跡。長老頷首，門中人情偏向你。' },
              { type: 'reputation', amount: 2 },
              { type: 'flag', key: 'sect_politics_elder', value: true },
              { type: 'martial', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'mediate',
        text: '兩邊勸和',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你兩頭說和，風波暫歇，卻也兩不討好。' },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'reputation', amount: 1 },
            ],
          },
        ],
      },
      {
        id: 'ambush',
        text: '暗中踢一腳',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你使了陰招。對手跌了面子，你卻在門中多了盯梢的眼。' },
              { type: 'nature', delta: { e: 1, xie: 1 } },
              { type: 'flag', key: 'sect_rival_anger', value: true },
              { type: 'money', amount: 8 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'play_sect_namecard',
    title: '名帖往來',
    body: '外派使者持帖上門，欲與本門交好——或試探虛實。掌門令你接待。',
    tags: ['ordinary', 'sect', 'politics'],
    weight: 10,
    requirements: { minAge: 17, flags: { joined_sect: true } },
    choices: [
      {
        id: 'courteous',
        text: '以禮相待',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你遞帖回禮，茶過三巡。兩門少了一分刀兵氣。' },
              { type: 'reputation', amount: 2 },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'money', amount: -3 },
            ],
          },
        ],
      },
      {
        id: 'probe',
        text: '試其深淺',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '言談間你套出對方虛實，暗記於心。' },
              { type: 'martial', amount: 1 },
              { type: 'flag', key: 'rumor_boost', value: 1 },
            ],
          },
        ],
      },
      {
        id: 'insult',
        text: '冷臉逐客',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '使者拂袖而去。山門外風聲頓緊。' },
              { type: 'reputation', amount: -2 },
              { type: 'nature', delta: { kuang: 1 } },
              { type: 'world', delta: { danger: 3 } },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'play_fragment_peddler',
    title: '殘譜貨郎',
    body: '舊書攤上，貨郎展開半卷焦邊紙頁：「殘譜三卷，缺一不可——這是其中一卷。」',
    tags: ['ordinary', 'manual'],
    weight: 8,
    requirements: { minAge: 16 },
    choices: [
      {
        id: 'buy',
        text: '花二十四兩買下',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '你點錢換譜。紙上墨跡淡得像一句沒說完的話。' },
              { type: 'money', amount: -24 },
              { type: 'flag', key: '_roll_fragment', value: true },
            ],
          },
        ],
      },
      {
        id: 'haggle',
        text: '殺價硬購',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '貨郎咒罵著收了十二兩。你疑這卷是偽，卻仍揣進懷裡。' },
              { type: 'money', amount: -12 },
              { type: 'flag', key: '_roll_fragment', value: true },
              { type: 'nature', delta: { xie: 1 } },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '搖頭離開',
        outcomes: [
          {
            weight: 1,
            effects: [{ type: 'narrate', text: '你怕是騙局，拱手離去。' }],
          },
        ],
      },
    ],
  },
  {
    id: 'play_region_sword',
    title: '劍塚夜聲',
    body: '古劍塚風聲如訴。石縫間似有劍鳴——拔劍一試，或默然離去。',
    tags: ['ordinary', 'travel', 'region'],
    weight: 14,
    requirements: { minAge: 16, flags: { travel_region: '劍塚' } },
    choices: [
      {
        id: 'draw',
        text: '拔劍一試',
        outcomes: [
          {
            weight: 1,
            effects: [
              { type: 'narrate', text: '劍意入臂。你悟得半分刀劍之理，也摸到一卷殘簡。' },
              { type: 'martial', amount: 2 },
              { type: 'flag', key: '_roll_fragment', value: true },
            ],
          },
        ],
      },
      {
        id: 'leave',
        text: '不敢驚動',
        outcomes: [
          {
            weight: 1,
            effects: [{ type: 'narrate', text: '你退下塚外。有些劍，未到時機不該出鞘。' }],
          },
        ],
      },
    ],
  },
];
