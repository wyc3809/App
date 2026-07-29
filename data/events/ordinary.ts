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
      { id: 'buy', text: '低買些乾糧', outcomes: [{ effects: [{ type: 'money', amount: -8 }, { type: 'health', amount: 4 }, { type: 'world', delta: { economy: 1 } }, { type: 'narrate', text: '你買下足夠一月的乾糧。' }] }] },
      { id: 'help', text: '替小販搬貨', outcomes: [{ effects: [{ type: 'money', amount: 12 }, { type: 'reputation', amount: 1 }, { type: 'nature', delta: { xia: 1 } }, { type: 'world', delta: { rumors: 1 } }, { type: 'narrate', text: '你賺到辛苦錢，也聽到街坊消息。' }] }] },
      { id: 'watch', text: '只看行情', outcomes: [{ effects: [{ type: 'martial', amount: 1 }, { type: 'world', delta: { economy: 1 } }, { type: 'narrate', text: '你學會觀察市面風向。' }] }] },
    ],
  },
  {
    id: 'ord_alley',
    title: '巷口爭執',
    body: '兩名街坊在巷口爭得面紅耳赤，旁人越聚越多。',
    tags: ['ordinary'],
    weight: 16,
    choices: [
      { id: 'mediate', text: '上前調停', outcomes: [{ effects: [{ type: 'reputation', amount: 2 }, { type: 'nature', delta: { xia: 2 } }, { type: 'world', delta: { order: 2 } }, { type: 'narrate', text: '你把話說開，眾人總算散去。' }] }] },
      { id: 'elder', text: '找長者作證', outcomes: [{ effects: [{ type: 'reputation', amount: 1 }, { type: 'world', delta: { order: 1 } }, { type: 'narrate', text: '長者出面後，事情平穩落幕。' }] }] },
      { id: 'avoid', text: '避開人群', outcomes: [{ effects: [{ type: 'narrate', text: '你沒有捲入，只記下爭執中的幾個名字。' }] }] },
    ],
  },
  {
    id: 'ord_clinic',
    title: '醫館藥香',
    body: '回春醫館門前藥香濃重，似乎近日病人不少。',
    tags: ['ordinary', 'health'],
    weight: 14,
    choices: [
      { id: 'brew', text: '幫忙煎藥', outcomes: [{ effects: [{ type: 'health', amount: 8 }, { type: 'money', amount: 6 }, { type: 'narrate', text: '你學會辨認幾味常見藥草。' }] }] },
      { id: 'ask', text: '請教舊傷', outcomes: [{ effects: [{ type: 'health', amount: 14 }, { type: 'money', amount: -8 }, { type: 'narrate', text: '醫者提醒你留意舊傷。' }] }] },
      { id: 'buy', text: '買一包藥散', outcomes: [{ effects: [{ type: 'money', amount: -10 }, { type: 'health', amount: 6 }, { type: 'narrate', text: '你買下一包止痛藥散。' }] }] },
    ],
  },
  {
    id: 'ord_dojo',
    title: '武館夜燈',
    body: '青石武館夜裡仍亮著燈，有人一遍遍練著同一招。',
    tags: ['ordinary', 'martial'],
    weight: 16,
    choices: [
      { id: 'spar', text: '留下陪練', outcomes: [{ effects: [{ type: 'health', amount: -3 }, { type: 'martial', amount: 4 }, { type: 'narrate', text: '你與對方拆招到夜深。' }] }] },
      { id: 'stance', text: '請教樁功', outcomes: [{ effects: [{ type: 'martial', amount: 3 }, { type: 'maxHealth', amount: 5 }, { type: 'narrate', text: '半寸腳位也能改變一式拳。' }] }] },
      { id: 'watch', text: '默默旁觀', outcomes: [{ effects: [{ type: 'martial', amount: 2 }, { type: 'narrate', text: '旁觀夜練讓你少走彎路。' }] }] },
    ],
  },
  {
    id: 'ord_road',
    title: '山道風聲',
    body: '山道風聲清冷，有腳夫請你同行一程。',
    tags: ['ordinary', 'combat'],
    weight: 12,
    choices: [
      { id: 'escort', text: '護送一段', outcomes: [{ effects: [{ type: 'money', amount: 8 }, { type: 'reputation', amount: 1 }, { type: 'nature', delta: { xia: 1 } }, { type: 'world', delta: { danger: -1, order: 1 } }, { type: 'narrate', text: '你護送腳夫走過山道。' }] }] },
      { id: 'scout', text: '探看岔路', outcomes: [{ effects: [{ type: 'health', amount: -2 }, { type: 'martial', amount: 2 }, { type: 'nature', delta: { kuang: 1 } }, { type: 'world', delta: { danger: 1 } }, { type: 'narrate', text: '你在岔路看見新腳印。' }] }] },
      { id: 'delay', text: '勸人改日再行', outcomes: [{ effects: [{ type: 'reputation', amount: 1 }, { type: 'world', delta: { danger: -1 } }, { type: 'narrate', text: '你勸人避開一段山路。' }] }] },
    ],
  },
  {
    id: 'ord_letter',
    title: '家書將至',
    body: '有鄉人帶來一封薄薄家書，紙邊被雨打皺。',
    tags: ['ordinary', 'family'],
    weight: 12,
    choices: [
      { id: 'reply', text: '立刻回信', outcomes: [{ effects: [{ type: 'money', amount: -2 }, { type: 'narrate', text: '家書讓你想起來處。' }] }] },
      { id: 'send', text: '寄些盤纏', outcomes: [{ effects: [{ type: 'money', amount: -18 }, { type: 'narrate', text: '你把一筆盤纏寄回家。' }] }] },
      { id: 'keep', text: '暫時收起', outcomes: [{ effects: [{ type: 'narrate', text: '你把家書藏在衣內。' }] }] },
    ],
  },
  {
    id: 'ord_rumor',
    title: '門前傳聞',
    body: '鎮上有人說，近日傳聞句句有影。',
    tags: ['ordinary'],
    weight: 14,
    choices: [
      { id: 'ask', text: '追問源頭', outcomes: [{ effects: [{ type: 'money', amount: -4 }, { type: 'martial', amount: 1 }, { type: 'narrate', text: '你追問過一段傳聞源頭。' }] }] },
      { id: 'check', text: '找第二人印證', outcomes: [{ effects: [{ type: 'reputation', amount: 1 }, { type: 'narrate', text: '你懂得傳聞要互相印證。' }] }] },
      { id: 'drop', text: '不再深究', outcomes: [{ effects: [{ type: 'narrate', text: '你放過了一段不明傳聞。' }] }] },
    ],
  },
  {
    id: 'ord_rain',
    title: '夜雨敲窗',
    body: '夜雨敲窗，你忽然想起白日裡幾個沒有問出口的問題。',
    tags: ['ordinary'],
    weight: 18,
    choices: [
      { id: 'write', text: '整理記憶', outcomes: [{ effects: [{ type: 'martial', amount: 1 }, { type: 'narrate', text: '你整理了一次近日見聞。' }] }] },
      { id: 'meditate', text: '運功到天明', outcomes: [{ effects: [{ type: 'martial', amount: 2 }, { type: 'qi', amount: 20 }, { type: 'maxQi', amount: 5 }, { type: 'narrate', text: '夜雨中你調順了一口內息。' }] }] },
      { id: 'sleep', text: '早些睡下', outcomes: [{ effects: [{ type: 'health', amount: 10 }, { type: 'narrate', text: '你選擇睡過一場夜雨。' }] }] },
    ],
  },
];

export const ORDINARY_EVENTS: GameEvent[] = RAW.map((ev) =>
  withRiskAndThree(
    ev,
    () => [
      { type: 'narrate', text: '事與願違：你失了分寸，付出代價。' },
      { type: 'health', amount: -12 },
      { type: 'money', amount: -6 },
    ],
    0.17,
  ),
);
