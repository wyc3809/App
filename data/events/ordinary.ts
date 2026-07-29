import type { GameEvent } from '@interfaces/lifeEngine';
import { withRiskAndThree } from '@core/life/choiceEnrich';

const RAW: GameEvent[] = [
  {
    id: 'ord_market',
    title: '市集米價',
    body: '千燈鎮市集米價有變，商販都在看風向。',
    tags: ['ordinary', 'economy'],
    weight: 20,
    choices: [
      {
        id: 'buy',
        text: '低買些乾糧',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -8 },
              { type: 'health', amount: 4 },
              { type: 'world', delta: { economy: 1 } },
              {
                type: 'narrate',
                text: '你在攤位前停了片刻，秤杆起落間，米香混著土腥氣。銀兩雖少了些，布袋卻沉了，回家煮飯時不必再為缺糧發愁。這一日市面上的你，像把一點不安按進了米袋裡。',
              },
            ],
          },
        ],
      },
      {
        id: 'help',
        text: '替小販搬貨',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 12 },
              { type: 'reputation', amount: 1 },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'world', delta: { rumors: 1 } },
              {
                type: 'narrate',
                text: '你捲起袖子把一筐筐貨物搬到簷下。小販擦汗道謝，又壓低聲音說起近日哪家店關了門、哪條巷又有人半夜搬貨。辛苦錢到手，街坊對你的眼神也柔和了幾分。',
              },
            ],
          },
        ],
      },
      {
        id: 'watch',
        text: '只看行情',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              { type: 'world', delta: { economy: 1 } },
              {
                type: 'narrate',
                text: '你不急著動手，只站在人群外看秤、聽價、記誰先慌誰後穩。半晌過後，市面的脈絡在你心裡漸漸清晰——這份冷靜，日後於江湖也好用。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_alley',
    title: '巷口爭執',
    body: '兩名街坊在巷口爭得面紅耳赤，旁人越聚越多。',
    tags: ['ordinary'],
    weight: 16,
    choices: [
      {
        id: 'mediate',
        text: '上前調停',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 2 },
              { type: 'nature', delta: { xia: 2 } },
              { type: 'world', delta: { order: 2 } },
              {
                type: 'narrate',
                text: '你分開人群，先問清誰先動手、誰欠誰一句話。言辭不疾不徐，爭執雙方的火氣漸漸散了。圍觀的人散去時，有人朝你點頭：千燈鎮巷口，又多了一個肯說話的人。',
              },
            ],
          },
        ],
      },
      {
        id: 'elder',
        text: '找長者作證',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'world', delta: { order: 1 } },
              {
                type: 'narrate',
                text: '你請出巷尾的老掌櫃。老人拄杖過來，把舊年賬本與人情一併說清。雙方無話可辯，事情平穩落幕。你雖未逞口舌之利，卻讓規矩重新站回巷口。',
              },
            ],
          },
        ],
      },
      {
        id: 'avoid',
        text: '避開人群',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你從人群邊緣繞過去，沒有停下。爭執的名字與口音仍落進耳裡，你默默記下，卻不願此時捲入。江湖路長，有些火候，不必急著伸手。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_clinic',
    title: '醫館藥香',
    body: '回春醫館門前藥香濃重，似乎近日病人不少。',
    tags: ['ordinary', 'health'],
    weight: 14,
    choices: [
      {
        id: 'brew',
        text: '幫忙煎藥',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 8 },
              { type: 'money', amount: 6 },
              {
                type: 'narrate',
                text: '藥爐邊熱氣蒸騰，你學着辨認幾味常見藥草的氣味與火候。醫館先生點頭稱許，塞給你一點工錢。離館時，你覺得胸中那點沉滯也輕了些。',
              },
            ],
          },
        ],
      },
      {
        id: 'ask',
        text: '請教舊傷',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 14 },
              { type: 'money', amount: -8 },
              {
                type: 'narrate',
                text: '醫者按過你脈門，皺眉又放開：「舊傷未清，不可硬撐。」一劑藥飲下，四肢回溫。你付了藥金，也記住了他反覆叮囑的那句話。',
              },
            ],
          },
        ],
      },
      {
        id: 'buy',
        text: '買一包藥散',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -10 },
              { type: 'health', amount: 6 },
              {
                type: 'narrate',
                text: '你買下一包止痛藥散，用紙包好塞進懷裡。路上風一吹，藥香淡淡的，像給漂泊的日子多備了一點退路。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_dojo',
    title: '武館夜燈',
    body: '青石武館夜裡仍亮著燈，有人一遍遍練著同一招。',
    tags: ['ordinary', 'martial'],
    weight: 16,
    choices: [
      {
        id: 'spar',
        text: '留下陪練',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -3 },
              { type: 'martial', amount: 4 },
              { type: 'nature', delta: { kuang: 1 } },
              {
                type: 'narrate',
                text: '你脫去外袍，與對方拆招到夜深。拳風帶熱，汗水滴在青石地上。散場時雙方拱手，你臂上微疼，招式卻比來時更俐落半分。',
              },
            ],
          },
        ],
      },
      {
        id: 'stance',
        text: '請教樁功',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 3 },
              { type: 'maxHealth', amount: 5 },
              {
                type: 'narrate',
                text: '教習只點你半寸腳位：「根不正，拳再快也是空。」你依言站定，氣沉丹田。離開武館時，步伐沉了些，像把地面真正踩實了。',
              },
            ],
          },
        ],
      },
      {
        id: 'watch',
        text: '默默旁觀',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 2 },
              {
                type: 'narrate',
                text: '你不插話，只在廊下看他一遍遍打同一招。錯處、修正、再錯、再改——旁觀夜練，讓你少走了幾段彎路。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_road',
    title: '山道風聲',
    body: '山道風聲清冷，有腳夫請你同行一程。',
    tags: ['ordinary', 'combat'],
    weight: 12,
    choices: [
      {
        id: 'escort',
        text: '護送一段',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: 8 },
              { type: 'reputation', amount: 1 },
              { type: 'nature', delta: { xia: 1 } },
              { type: 'world', delta: { danger: -1, order: 1 } },
              {
                type: 'narrate',
                text: '你走在腳夫身側，目光掃過林影與岔路。風裡有獸跡，卻沒有撲近。到達岔口時，對方塞來一包銅錢，連聲道謝。山道上，你的身影顯得可靠一些。',
              },
            ],
          },
        ],
      },
      {
        id: 'scout',
        text: '探看岔路',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: -2 },
              { type: 'martial', amount: 2 },
              { type: 'nature', delta: { kuang: 1 } },
              { type: 'world', delta: { danger: 1 } },
              {
                type: 'narrate',
                text: '你獨自探入岔路，荊棘刮過衣袖。泥地上有新腳印，方向雜亂，像有人匆忙走過。你記下痕跡退回主道——知道危險在哪，比盲目趕路更重要。',
              },
            ],
          },
        ],
      },
      {
        id: 'delay',
        text: '勸人改日再行',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'world', delta: { danger: -1 } },
              {
                type: 'narrate',
                text: '你聽風聲不對，勸腳夫改日再行。對方猶豫片刻，終究點頭。你們在山腳茶棚歇下，避開了那一段可能出事的山路。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_letter',
    title: '家書將至',
    body: '有鄉人帶來一封薄薄家書，紙邊被雨打皺。',
    tags: ['ordinary', 'family'],
    weight: 12,
    choices: [
      {
        id: 'reply',
        text: '立刻回信',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -2 },
              {
                type: 'narrate',
                text: '你借客棧燈火研墨回信，字跡不算漂亮，卻寫得認真。封口時紙邊仍帶雨痕，像把千燈鎮與來處重新牽在一起。',
              },
            ],
          },
        ],
      },
      {
        id: 'send',
        text: '寄些盤纏',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -18 },
              { type: 'nature', delta: { xia: 1 } },
              {
                type: 'narrate',
                text: '你把一筆盤纏連同短箋交予鄉人。銀兩離手的一瞬，心裡空了些，也暖了些——江湖再遠，家中燈火仍要有人續著。',
              },
            ],
          },
        ],
      },
      {
        id: 'keep',
        text: '暫時收起',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你把家書折好，貼身藏起。紙上字句暫不拆盡，像把思念留到更能安穩坐下的夜晚。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_rumor',
    title: '門前傳聞',
    body: '鎮上有人說，近日傳聞句句有影。',
    tags: ['ordinary'],
    weight: 14,
    choices: [
      {
        id: 'ask',
        text: '追問源頭',
        outcomes: [
          {
            effects: [
              { type: 'money', amount: -4 },
              { type: 'martial', amount: 1 },
              { type: 'world', delta: { rumors: 2 } },
              {
                type: 'narrate',
                text: '你順著閒話一層層問下去，茶錢花了幾文，才摸到傳聞的半截源頭。真相尚未全露，你卻學會：江湖風聲，從來不是平白吹起。',
              },
            ],
          },
        ],
      },
      {
        id: 'check',
        text: '找第二人印證',
        outcomes: [
          {
            effects: [
              { type: 'reputation', amount: 1 },
              { type: 'world', delta: { rumors: 1 } },
              {
                type: 'narrate',
                text: '你不輕信一口之詞，另找一人對過細節。兩處說法有同有異，你把可信的留下，把誇張的丟開——這種謹慎，日後能少踩許多坑。',
              },
            ],
          },
        ],
      },
      {
        id: 'drop',
        text: '不再深究',
        outcomes: [
          {
            effects: [
              {
                type: 'narrate',
                text: '你聽完便走，不再追問。有些傳聞像霧，越抓越亂；放過它，反而讓心裡清靜些。',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'ord_rain',
    title: '夜雨敲窗',
    body: '夜雨敲窗，你忽然想起白日裡幾個沒有問出口的問題。',
    tags: ['ordinary'],
    weight: 18,
    choices: [
      {
        id: 'write',
        text: '整理記憶',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 1 },
              {
                type: 'narrate',
                text: '你就着燈火把近日見聞逐條寫下：誰說過什麼、哪條路不太平、哪一招打得滯澀。雨聲作伴，思緒漸漸理順，像把散落的棋子重新擺回棋盤。',
              },
            ],
          },
        ],
      },
      {
        id: 'meditate',
        text: '運功到天明',
        outcomes: [
          {
            effects: [
              { type: 'martial', amount: 2 },
              { type: 'qi', amount: 20 },
              { type: 'maxQi', amount: 5 },
              {
                type: 'narrate',
                text: '你盤膝調息，雨聲與心跳漸漸合拍。一夜過後，丹田溫熱，窗外天色已白——這場夜雨，成了你靜心的鼓點。',
              },
            ],
          },
        ],
      },
      {
        id: 'sleep',
        text: '早些睡下',
        outcomes: [
          {
            effects: [
              { type: 'health', amount: 10 },
              {
                type: 'narrate',
                text: '你吹滅燈火，聽着雨聲入睡。夢裡沒有刀光，只有屋簷滴水。醒來時精神清爽，像被一場乾淨的雨洗過。',
              },
            ],
          },
        ],
      },
    ],
  },
];

function badStory(_choiceId: string, choiceText?: string): string {
  const act = choiceText ?? '此舉';
  return `你本欲「${act}」，卻在關鍵處失了分寸：人或走避，事或橫生，銀錢與氣血都捱了一記。事與願違之後，你只能把教訓嚥進肚裡，慢慢再走。`;
}

export const ORDINARY_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    (id, text) => [
      { type: 'narrate', text: badStory(id, text) },
      { type: 'health', amount: -12 },
      { type: 'money', amount: -6 },
    ],
    0.17,
  ),
);
