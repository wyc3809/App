#!/usr/bin/env node
/** 掃描事件敘事：空洞模板 + AI 套話禁詞；CI 可用 --fail */
import { readFileSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const fail = process.argv.includes('--fail');

/** 內容檔：禁止新模板與禁詞 */
const contentFiles = [
  'data/events/jianghuExtra100.ts',
  'data/events/ordinary.ts',
  'data/events/practiceWander.ts',
  'data/events/secretArts.ts',
  'data/events/jinyongTropes.ts',
  'core/life/choiceEnrich.ts',
  'core/life/flavor.ts',
  'core/life/arcs.ts',
  'core/life/summary.ts',
];

/** catalog 允許模板（由 narrateOverrides 覆蓋），只報數 */
const catalogFile = 'data/events/catalog.ts';

const templateRe = /就「.+?」一事，你選擇「.+?」|這段經過像一頁墨跡/g;
const banRe =
  /局面鬆動|有得有失|立誓下回|像棋盤上多落了一子|命運的齒輪|機緣悄然降臨|開啟新的篇章|踏上新的征途|在這個關鍵時刻|不虛此行|一切才剛剛開始|故事才剛開始|命運眷顧|命運弄人|江湖路遠，且行且珍惜|這一選擇改變了你的人生軌跡/g;

let templateHits = 0;
let banHits = 0;
let hardFail = 0;

function scan(f, { allowTemplates = false } = {}) {
  let text = '';
  try {
    text = readFileSync(join(root, f), 'utf8');
  } catch {
    console.log(`${f}: (missing, skip)`);
    return;
  }
  const templates = text.match(templateRe) ?? [];
  const bans = text.match(banRe) ?? [];
  templateHits += templates.length;
  banHits += bans.length;
  const badTemplates = allowTemplates ? 0 : templates.length;
  if (badTemplates || bans.length) hardFail += badTemplates + bans.length;
  console.log(
    `${f}: templates=${templates.length}${allowTemplates ? ' (allowed)' : ''} bans=${bans.length}`,
  );
}

scan(catalogFile, { allowTemplates: true });
for (const f of contentFiles) scan(f);

console.log(`total templates: ${templateHits}`);
console.log(`total ban-words: ${banHits}`);
console.log(`hard-fail count: ${hardFail}`);

if (fail && hardFail > 0) {
  console.error('auditNarrate: FAIL — non-catalog templates or ban-words present');
  process.exit(1);
}
process.exit(0);