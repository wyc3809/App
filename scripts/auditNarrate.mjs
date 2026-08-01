#!/usr/bin/env node
/** 掃描事件敘事是否仍為空洞模板 */
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const files = [
  'data/events/catalog.ts',
  'data/events/jianghuExtra100.ts',
  'data/events/ordinary.ts',
];

const templateRe = /就「.+?」一事，你選擇「.+?」|這段經過像一頁墨跡/g;
let hits = 0;
for (const f of files) {
  const text = readFileSync(join(root, f), 'utf8');
  const m = text.match(templateRe);
  const n = m?.length ?? 0;
  hits += n;
  console.log(`${f}: ${n} template-like narrates`);
}
console.log(`total: ${hits}`);
process.exit(0);
