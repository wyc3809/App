/**
 * 水墨聲腔示例事件 — 可參考／改寫後併入 data/events/catalog.ts
 * 效果鍵名請以專案 interfaces 為準；此處用可讀別名。
 */

export const inkPackSampleEvents = [
  {
    id: 'ink_rain_inn_01',
    title: '夜雨投店',
    tags: ['travel', 'social'],
    minAge: 16,
    maxAge: 60,
    body:
      '秋雨未歇。你拍盡蓑衣上的泥，店小二卻只顧打量你腰間那柄無名劍。屋內炭盆將旺未旺，角落有人把酒杯磕得很輕——輕得像故意讓你聽見。',
    choices: [
      {
        id: 'ask',
        label: '上前問一句來歷',
        effects: [{ type: 'stat', key: 'charm', delta: 1 }],
        epilogue: '那人抬眼，竟像識得你師門舊時的暗號。',
      },
      {
        id: 'watch',
        label: '另開一桌，背對門口',
        effects: [{ type: 'stat', key: 'courage', delta: 1 }],
        epilogue: '刀聲沒起。雨聲替你們說完了今夜。',
      },
      {
        id: 'leave',
        label: '推門而出，雨更大了',
        effects: [{ type: 'stat', key: 'luck', delta: 1 }],
        epilogue: '背後炭火一響，像有人把杯放下。',
      },
    ],
  },
  {
    id: 'ink_bridge_01',
    title: '橋上有人',
    tags: ['travel', 'encounter'],
    minAge: 14,
    maxAge: 70,
    body:
      '石橋中央立著個撐傘的背影。橋下流水很急，傘卻一動不動。你數了三十步，對方仍不讓。',
    choices: [
      {
        id: 'bow',
        label: '拱手請對方先過',
        effects: [{ type: 'stat', key: 'charm', delta: 1 }],
        epilogue: '傘沿一傾，露出半張蒼白的笑。',
      },
      {
        id: 'push',
        label: '抬步硬闖',
        effects: [
          { type: 'stat', key: 'courage', delta: 1 },
          { type: 'hp', delta: -5 },
        ],
        epilogue: '傘骨擦過你肩，像一句沒說出口的規矩。',
      },
      {
        id: 'wait',
        label: '立在橋頭等雨停',
        effects: [{ type: 'stat', key: 'insight', delta: 1 }],
        epilogue: '雨未停。人卻先不見了。',
      },
    ],
  },
  {
    id: 'ink_letter_01',
    title: '師門來信',
    tags: ['sect', 'story'],
    minAge: 18,
    maxAge: 55,
    requires: [{ type: 'flag', key: 'has_master', eq: true }],
    body:
      '信封無字，只有一枚舊時練功的汗布條。展開後，紙上只有兩個字：回來。墨跡未乾，像剛寫完便塞進了驛袋。',
    choices: [
      {
        id: 'return',
        label: '即日束裝上山',
        effects: [{ type: 'flag', key: 'returning_to_sect', value: true }],
        epilogue: '山門在記憶裡比路近。',
      },
      {
        id: 'ask',
        label: '回信只問緣故',
        effects: [{ type: 'stat', key: 'insight', delta: 1 }],
        epilogue: '驛卒收下信，沒答應你何時有回音。',
      },
      {
        id: 'burn',
        label: '把信燒了，當沒看見',
        effects: [
          { type: 'stat', key: 'courage', delta: -1 },
          { type: 'flag', key: 'ignored_master_letter', value: true },
        ],
        epilogue: '灰燼裡汗布條最後蜷成一個結。',
      },
    ],
  },
] as const;
