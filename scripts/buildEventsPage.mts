import { writeFileSync, mkdirSync } from 'fs';
import { ORDINARY_EVENTS } from '../data/events/ordinary';
import { EVENT_CATALOG } from '../data/events/catalog';
import { SECRET_ART_EVENTS } from '../data/events/secretArts';
import { BOSS_ENCOUNTER_EVENTS } from '../data/events/bossEncounters';
import { PRACTICE_WANDER_EVENTS } from '../data/events/practiceWander';
import { JIANGHU_EXTRA_EVENTS } from '../data/events/jianghuExtra100';
import { ROAD_ENCOUNTER_EVENTS } from '../data/events/roadEncounters';
import {
  JINYONG_SPECIAL_EVENTS,
  JINYONG_ORDINARY_EVENTS,
} from '../data/events/jinyongTropes';
import { RANDOM_PACK_EVENTS } from '../core/life/packAdapter';
import { lookupNarrateOverride } from '../data/events/narrateOverrides';

const groups = [
  ['日常', ORDINARY_EVENTS],
  ['人生節點', EVENT_CATALOG],
  ['江湖百事', JIANGHU_EXTRA_EVENTS],
  ['金庸·奇遇', JINYONG_SPECIAL_EVENTS],
  ['金庸·日常', JINYONG_ORDINARY_EVENTS],
  ['秘傳奇遇', SECRET_ART_EVENTS],
  ['修煉機緣', PRACTICE_WANDER_EVENTS],
  ['路遇', ROAD_ENCOUNTER_EVENTS],
  ['首領／傳聞', BOSS_ENCOUNTER_EVENTS],
  ['百人包', RANDOM_PACK_EVENTS],
] as const;

function fmt(e: Record<string, unknown>): string | null {
  switch (e.type) {
    case 'narrate':
      return null;
    case 'attr': {
      const d = e.delta as Record<string, number>;
      return `五維 ${Object.entries(d || {})
        .map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`)
        .join('、')}`;
    }
    case 'nature': {
      const d = e.delta as Record<string, number>;
      return `心性 ${Object.entries(d || {})
        .map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`)
        .join('、')}`;
    }
    case 'world': {
      const d = e.delta as Record<string, number>;
      return `天下 ${Object.entries(d || {})
        .map(([k, v]) => `${k}${v > 0 ? '+' : ''}${v}`)
        .join('、')}`;
    }
    case 'money':
      return `銀兩${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'health':
      return `氣血${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'reputation':
      return `名望${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'martial':
      return `武學${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'qi':
      return `內力${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'maxQi':
      return `內力上限${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'maxHealth':
      return `氣血上限${(e.amount as number) > 0 ? '+' : ''}${e.amount}`;
    case 'learnSkill':
      return `習得「${(e.name as string) || (e.skillId as string)}」`;
    case 'grantGear':
      return `裝備 ${e.gearId}`;
    case 'condition':
      return `傷病 ${e.id}`;
    case 'joinSect':
      return '拜入門派';
    case 'leaveSect':
      return '離開門派';
    case 'die':
      return '死亡';
    case 'flag':
      return null;
    case 'practice':
      return `修煉 ${e.action}`;
    default:
      return null;
  }
}

type Choice = {
  id: string;
  text: string;
  outcomes: Array<{ id?: string; effects: Array<Record<string, unknown>> }>;
};

function choiceLine(ev: { id: string }, ch: Choice) {
  const outs = ch.outcomes || [];
  const fair = outs.find((o) => !String(o.id || '').endsWith('_ill')) || outs[0];
  let effects = [...(fair?.effects || [])];
  const ov = lookupNarrateOverride(ev.id, ch.id);
  if (ov) {
    let hit = false;
    effects = effects.map((e) => {
      if (!hit && e.type === 'narrate') {
        hit = true;
        return { ...e, text: ov };
      }
      return e;
    });
    if (!hit) effects.unshift({ type: 'narrate', text: ov });
  }
  const deltas = effects.map(fmt).filter((x): x is string => Boolean(x)).join('；') || '敘事為主';
  const narr = String(effects.find((e) => e.type === 'narrate')?.text || '')
    .replace(/\s+/g, ' ')
    .slice(0, 70);
  return { text: ch.text, deltas, narr, risky: outs.length > 1 };
}

const plain: string[] = [];
plain.push('江湖一生 · 事件／奇遇一覽（主結果）');
plain.push('（標※者結算或有失手岔路）');
plain.push('');

const sectionHtml: string[] = [];
let total = 0;

for (const [name, list] of groups) {
  plain.push(`【${name}】${list.length}則`);
  const articles: string[] = [];
  for (const ev of list) {
    total += 1;
    plain.push(`\n◆ ${ev.title} (${ev.id})`);
    if (ev.body) plain.push(`  ${ev.body}`);
    const lis: string[] = [];
    for (const ch of (ev.choices || []) as Choice[]) {
      const c = choiceLine(ev, ch);
      plain.push(`  - ${c.text}${c.risky ? '※' : ''} → ${c.deltas}`);
      if (c.narr) plain.push(`    ${c.narr}${c.narr.length >= 70 ? '…' : ''}`);
      lis.push(
        `<li><strong>${escapeHtml(c.text)}</strong>${c.risky ? '<em>※</em>' : ''} → ${escapeHtml(c.deltas)}${
          c.narr
            ? `<div class="n">${escapeHtml(c.narr)}${c.narr.length >= 70 ? '…' : ''}</div>`
            : ''
        }</li>`,
      );
    }
    articles.push(
      `<article id="${escapeHtml(ev.id)}"><h3>${escapeHtml(ev.title)}<code>${escapeHtml(ev.id)}</code></h3>${
        ev.body ? `<p class="body">${escapeHtml(ev.body)}</p>` : ''
      }<ul>${lis.join('')}</ul></article>`,
    );
  }
  plain.push('');
  sectionHtml.push(
    `<section id="g-${escapeHtml(name)}"><h2>${escapeHtml(name)}<small>${list.length}</small></h2>${articles.join('')}</section>`,
  );
}

plain.unshift(`合計 ${total} 則\n`);
const text = plain.join('\n');

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

mkdirSync('public', { recursive: true });
writeFileSync('public/events.txt', text, 'utf8');

const toc = groups.map(([n]) => `<a href="#g-${escapeHtml(n)}">${escapeHtml(n)}</a>`).join('');

const html = `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
<meta name="theme-color" content="#e6d9c4"/>
<title>江湖一生 · 事件一覽</title>
<style>
:root{--paper:#f3ebdc;--ink:#1a1a1a;--mid:#4a4540;--soft:#8a8278;--line:rgba(26,26,26,.14);--cin:#a33a32}
*{box-sizing:border-box}
html,body{margin:0;background:var(--paper);color:var(--ink);font:400 15px/1.65 "Noto Serif TC","Songti TC",serif}
body{padding:max(12px,env(safe-area-inset-top)) 14px max(24px,env(safe-area-inset-bottom))}
header{position:sticky;top:0;z-index:5;background:linear-gradient(180deg,var(--paper) 70%,rgba(243,235,220,.85));padding:10px 0 12px;border-bottom:1px solid var(--line);margin:0 -14px;padding-left:14px;padding-right:14px}
h1{margin:0;font-size:1.45rem;letter-spacing:.18em;font-weight:400}
.sub{margin:4px 0 10px;color:var(--soft);font-size:.82rem}
.actions{display:flex;flex-wrap:wrap;gap:8px}
button,a.btn{appearance:none;border:1px solid var(--ink);background:transparent;color:var(--ink);padding:10px 14px;min-height:44px;font:inherit;letter-spacing:.08em;text-decoration:none;display:inline-flex;align-items:center}
button.primary{background:var(--ink);color:var(--paper)}
button:active,a.btn:active{transform:scale(.97)}
#msg{margin:8px 0 0;color:var(--cin);font-size:.8rem;min-height:1.2em}
h2{margin:28px 0 10px;font-size:1.15rem;letter-spacing:.2em;border-left:3px solid var(--cin);padding-left:10px}
h2 small{margin-left:8px;color:var(--soft);letter-spacing:.06em;font-size:.8rem}
article{padding:12px 0;border-bottom:1px dashed var(--line)}
h3{margin:0 0 6px;font-size:1.05rem;letter-spacing:.1em;font-weight:600}
code{margin-left:8px;font-size:.72rem;color:var(--soft);font-weight:400;letter-spacing:0}
.body{margin:0 0 8px;color:var(--mid);font-size:.9rem}
ul{margin:0;padding:0;list-style:none}
li{padding:8px 0;border-top:1px solid rgba(26,26,26,.06)}
li em{color:var(--cin);font-style:normal;margin-left:4px}
.n{margin-top:4px;color:var(--soft);font-size:.82rem}
nav.toc{display:flex;flex-wrap:wrap;gap:6px;margin:12px 0 0}
nav.toc a{font-size:.78rem;color:var(--mid);text-decoration:none;border-bottom:1px solid var(--line);padding:4px 2px}
.foot{margin-top:24px;font-size:.85rem;color:var(--mid)}
.foot a{color:var(--ink)}
</style>
</head>
<body>
<header>
  <h1>江湖一生 · 事件一覽</h1>
  <p class="sub">共 ${total} 則 · 主結果摘要 · ※=或有失手岔路</p>
  <div class="actions">
    <button type="button" class="primary" id="share">分享／存到手機</button>
    <button type="button" id="dl">下載 TXT</button>
    <a class="btn" href="./">回遊戲</a>
  </div>
  <p id="msg"></p>
  <nav class="toc">${toc}</nav>
</header>
<main>
${sectionHtml.join('\n')}
</main>
<p class="foot">純文字直連：<a id="txtlink" href="./events.txt">events.txt</a>（iPhone：長按連結 →「下載連結嘅項目／儲存到檔案」）</p>
<script>
const TEXT = ${JSON.stringify(text)};
const msg = document.getElementById('msg');
function setMsg(t){ msg.textContent = t || ''; }
async function shareOrSave(){
  const file = new File([TEXT], '江湖一生-事件一覽.txt', { type: 'text/plain' });
  try {
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: '江湖一生事件一覽', text: '事件／奇遇清單' });
      setMsg('已叫出分享選單，可選「儲存到檔案」。');
      return;
    }
    if (navigator.share) {
      await navigator.share({ title: '江湖一生事件一覽', text: TEXT.slice(0, 3500) + '…\\n（全文請用下載 TXT 或長按 events.txt）' });
      setMsg('已分享文字摘要；全文請撳「下載 TXT」或長按 events.txt。');
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') { setMsg(''); return; }
  }
  downloadTxt();
}
function downloadTxt(){
  const blob = new Blob([TEXT], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '江湖一生-事件一覽.txt';
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  setMsg('若無開始下載：用「分享／存到手機」，或長按頁底 events.txt。');
}
document.getElementById('share').onclick = shareOrSave;
document.getElementById('dl').onclick = downloadTxt;
</script>
</body>
</html>
`;

writeFileSync('public/events.html', html, 'utf8');
console.log(JSON.stringify({ total, txtBytes: Buffer.byteLength(text), htmlBytes: Buffer.byteLength(html) }));
