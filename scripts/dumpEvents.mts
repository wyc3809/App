import { writeFileSync } from 'fs';
import { ORDINARY_EVENTS } from './data/events/ordinary';
import { EVENT_CATALOG } from './data/events/catalog';
import { SECRET_ART_EVENTS } from './data/events/secretArts';
import { BOSS_ENCOUNTER_EVENTS } from './data/events/bossEncounters';
import { PRACTICE_WANDER_EVENTS } from './data/events/practiceWander';
import { JIANGHU_EXTRA_EVENTS } from './data/events/jianghuExtra100';
import { ROAD_ENCOUNTER_EVENTS } from './data/events/roadEncounters';
import {
  JINYONG_SPECIAL_EVENTS,
  JINYONG_ORDINARY_EVENTS,
} from './data/events/jinyongTropes';
import { RANDOM_PACK_EVENTS } from './core/life/packAdapter';
import { lookupNarrateOverride } from './data/events/narrateOverrides';

const groups: Array<[string, { id: string; title: string; body?: string; tags?: string[]; requirements?: unknown; choices: Array<{ id: string; text: string; outcomes: Array<{ id?: string; effects: Array<Record<string, unknown>> }> }> }[]]> = [
  ['日常 ordinary', ORDINARY_EVENTS],
  ['主線／人生節點 catalog', EVENT_CATALOG],
  ['江湖百事 jianghuExtra', JIANGHU_EXTRA_EVENTS],
  ['金庸橋段·奇遇', JINYONG_SPECIAL_EVENTS],
  ['金庸橋段·日常翻頁', JINYONG_ORDINARY_EVENTS],
  ['秘傳奇遇 secretArts', SECRET_ART_EVENTS],
  ['修煉機緣 practiceWander', PRACTICE_WANDER_EVENTS],
  ['路遇 road', ROAD_ENCOUNTER_EVENTS],
  ['首領／傳聞 boss', BOSS_ENCOUNTER_EVENTS],
  ['百人包 pack', RANDOM_PACK_EVENTS],
];

function fmtEffect(e: Record<string, unknown>): string | null {
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
    case 'flag':
      return `旗標 ${e.key}=${e.value}`;
    case 'learnSkill':
      return `習得「${(e.name as string) || (e.skillId as string)}」`;
    case 'joinSect':
      return `拜入門派${e.sectName || e.sectId ? ` ${e.sectName || e.sectId}` : ''}`;
    case 'leaveSect':
      return '離開門派';
    case 'relationship':
      return `關係 ${e.npcId}${(e.delta as number) > 0 ? '+' : ''}${e.delta}`;
    case 'lover':
      return `結為眷屬 ${e.npcId}`;
    case 'die':
      return `死亡${e.reason ? `（${e.reason}）` : ''}`;
    case 'memory':
      return `記憶 ${e.npcId}`;
    case 'grantGear':
      return `裝備 ${e.gearId}`;
    case 'condition':
      return `傷病 ${e.id}`;
    case 'practice':
      return `修煉 ${e.action}`;
    case 'worldFlag':
      return `世標 ${e.key}=${e.value}`;
    case 'startCombat':
      return `開戰 ${e.foeName || e.foe || ''}`.trim();
    default:
      return String(e.type);
  }
}

function primaryOutcome(
  ch: { id: string; outcomes: Array<{ id?: string; effects: Array<Record<string, unknown>> }> },
  eventId: string,
) {
  const outs = ch.outcomes || [];
  const fair = outs.find((o) => !String(o.id || '').endsWith('_ill')) || outs[0];
  if (!fair) return { deltas: [] as string[], narrate: '', risky: false };
  let effects = [...(fair.effects || [])];
  const ov = lookupNarrateOverride(eventId, ch.id);
  if (ov) {
    let replaced = false;
    effects = effects.map((e) => {
      if (!replaced && e.type === 'narrate') {
        replaced = true;
        return { ...e, text: ov };
      }
      return e;
    });
    if (!replaced) effects = [{ type: 'narrate', text: ov }, ...effects];
  }
  const narrate = String(effects.find((e) => e.type === 'narrate')?.text || '');
  const deltas = effects.map(fmtEffect).filter((x): x is string => Boolean(x));
  return { deltas, narrate, risky: outs.length > 1 };
}

let total = 0;
const seen = new Set<string>();
const lines: string[] = [];

for (const [name, list] of groups) {
  lines.push(`\n## ${name}（${list.length}）\n`);
  for (const ev of list) {
    total++;
    seen.add(ev.id);
    const tags = (ev.tags || []).join('、') || '—';
    const req = ev.requirements ? JSON.stringify(ev.requirements) : '';
    lines.push(`### ${ev.title} \`${ev.id}\``);
    if (ev.body) lines.push(`> ${ev.body}`);
    lines.push(`標籤：${tags}${req ? ` · 條件：\`${req}\`` : ''}`);
    for (const ch of ev.choices || []) {
      const { deltas, narrate, risky } = primaryOutcome(ch, ev.id);
      const d = deltas.length ? deltas.join('；') : '（敘事為主）';
      const n = narrate
        ? narrate.replace(/\s+/g, ' ').slice(0, 100) + (narrate.length > 100 ? '…' : '')
        : '';
      lines.push(
        `- **${ch.text}**（\`${ch.id}\`）${risky ? '〔或有風險岔路〕' : ''} → ${d}`,
      );
      if (n) lines.push(`  - ${n}`);
    }
    lines.push('');
  }
}

const header = `# 江湖一生 · 事件／奇遇一覽

合計條目 **${total}**（去重 id **${seen.size}**）。

> 每選項列出「主結果」數值與敘事摘要。標〔或有風險岔路〕者結算時可能抽到失手版（扣血／扣銀等）。
> 翻頁池大致：日常／江湖百事／金庸日常 → 常規；秘傳／金庸奇遇／首領／部分 pack → 奇遇較稀。

`;

writeFileSync('/workspace/docs/EVENT-CATALOG.md', header + lines.join('\n'));
console.log(JSON.stringify({ total, unique: seen.size, path: 'docs/EVENT-CATALOG.md' }));
