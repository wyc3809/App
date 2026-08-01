import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { rememberNpc, ensureStarterNpcs } from './npcCatalog';
import { pushChronicle } from './chronicle';

/** 短弧：3–5 拍人生片段，不做章節條 */
export interface LifeArcState {
  id: string;
  title: string;
  beat: number;
  maxBeats: number;
  npcId: string;
  monthsLeft: number;
}

type ArcDef = {
  id: string;
  title: string;
  npcId: string;
  maxBeats: number;
  /** 開弧條件 */
  canStart: (state: LifeGameState) => boolean;
  /** 每拍文案與效果 */
  beats: Array<{
    chronicle: string;
    memory: string;
    affinity: number;
    location?: string;
  }>;
};

const ARC_DEFS: ArcDef[] = [
  {
    id: 'arc_lu_ink',
    title: '硯生授字',
    npcId: 'npc_lu_yansheng',
    maxBeats: 3,
    canStart: (s) => s.character.age <= 28 && !s.character.flags.arc_done_lu,
    beats: [
      {
        chronicle: '陸硯生在茶棚邊攤開舊紙，邀你對坐寫字：「字如人，人如江湖。」',
        memory: '與你對坐寫字',
        affinity: 8,
        location: '千燈鎮',
      },
      {
        chronicle: '夜雨中，硯生替你改了一筆敗筆，說道：「急不得，留白也是功夫。」',
        memory: '雨夜改你敗筆',
        affinity: 10,
      },
      {
        chronicle: '硯生將一本薄冊塞進你袖裡：「不必謝。他日若有字，記得寄一封。」',
        memory: '贈你薄冊',
        affinity: 12,
      },
    ],
  },
  {
    id: 'arc_shen_heal',
    title: '暮晴診脈',
    npcId: 'npc_shen_muqing',
    maxBeats: 3,
    canStart: (s) => !s.character.flags.arc_done_shen,
    beats: [
      {
        chronicle: '醫館裡，沈暮晴替路人包紮，見你停步，淡淡道：「外傷易治，心事難醫。」',
        memory: '見你停步觀診',
        affinity: 6,
        location: '千燈鎮醫館',
      },
      {
        chronicle: '你幫暮晴送藥到鎮外，她把一包金瘡藥塞給你：「路上用得著。」',
        memory: '與你同行送藥',
        affinity: 12,
      },
      {
        chronicle: '暮晴看過你舊傷，低聲：「下次別逞強。醫館燈還亮著。」',
        memory: '囑你勿逞強',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_yue_spar',
    title: '長風試拳',
    npcId: 'npc_yue_changfeng',
    maxBeats: 4,
    canStart: (s) => s.character.martial >= 10 && !s.character.flags.arc_done_yue,
    beats: [
      {
        chronicle: '武館教頭岳長風擲來木棍：「站住。出手我看看。」',
        memory: '以木棍試你拳腳',
        affinity: 5,
        location: '千燈武館',
      },
      {
        chronicle: '長風喝停你一式：「肩太緊。力從腳起，不是從脾氣起。」',
        memory: '點破你肩緊',
        affinity: 10,
      },
      {
        chronicle: '館中比試，長風讓你半招，卻道：「有長進。別沾沾自喜。」',
        memory: '館中讓你半招',
        affinity: 12,
      },
      {
        chronicle: '長風將一張拜帖壓在桌案：「華山若開臺，記得來。拳腳要見世面。」',
        memory: '囑你上華山見世面',
        affinity: 15,
      },
    ],
  },
];

export function getArcDef(id: string): ArcDef | undefined {
  return ARC_DEFS.find((a) => a.id === id);
}

/** 由弧狀態重建「訪故人」事件（須可按 pending.eventId 反查） */
export function buildArcVisitEvent(state: LifeGameState, beatOverride?: number): GameEvent | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const def = getArcDef(arc.id);
  if (!def) return null;
  const beat = beatOverride ?? arc.beat;
  return {
    id: `arc_visit_${arc.id}_${beat}`,
    title: `故人·${def.title}`,
    body: `你想起${state.npcs[arc.npcId]?.name ?? '故人'}，腳步不由自主往那邊去。`,
    weight: 28,
    tags: ['arc', 'story'],
    choices: [
      {
        id: 'go',
        text: '前去相見',
        outcomes: [
          {
            effects: [
              { type: 'narrate', text: '你推門而入，舊人舊事，又翻過一頁。' },
              { type: 'flag', key: `arc_visit_${arc.id}`, value: true },
            ],
          },
        ],
      },
      {
        id: 'later',
        text: '改日再說',
        outcomes: [
          {
            effects: [{ type: 'narrate', text: '你站在巷口片刻，終究沒有邁步。有些緣，要等。' }],
          },
        ],
      },
    ],
  };
}

/** 短弧相關事件（活躍弧時提高權重混入池） */
export function listArcBonusEvents(state: LifeGameState): GameEvent[] {
  const ev = buildArcVisitEvent(state);
  return ev ? [ev] : [];
}

/** 解析 pending 短弧事件（含 beat 已推進後仍掛舊 id 的存檔） */
export function lookupArcEvent(state: LifeGameState, eventId: string): GameEvent | null {
  if (!eventId.startsWith('arc_visit_')) return null;
  const live = buildArcVisitEvent(state);
  if (live && live.id === eventId) return live;
  // 存檔／時序：id 內嵌 beat，按 id 重建
  const m = /^arc_visit_(arc_[a-z_]+)_(\d+)$/.exec(eventId);
  if (!m) return null;
  const arcId = m[1]!;
  const beat = Number(m[2]);
  const def = getArcDef(arcId);
  if (!def) return null;
  // 臨時掛上弧資料以便 rebuild（不寫回 state）
  const shadow: LifeGameState = {
    ...state,
    lifeArc: state.lifeArc?.id === arcId
      ? state.lifeArc
      : {
          id: arcId,
          title: def.title,
          beat,
          maxBeats: def.maxBeats,
          npcId: def.npcId,
          monthsLeft: 1,
        },
  };
  return buildArcVisitEvent(shadow, beat);
}

export function maybeStartLifeArc(state: LifeGameState): string[] {
  if (state.lifeArc) return [];
  ensureStarterNpcs(state);
  const rng = getRng();
  if (!rng.chance(0.18)) return [];
  const candidates = ARC_DEFS.filter((d) => d.canStart(state) && state.npcs[d.npcId]?.alive);
  if (!candidates.length) return [];
  const def = rng.pick(candidates);
  state.lifeArc = {
    id: def.id,
    title: def.title,
    beat: 0,
    maxBeats: def.maxBeats,
    npcId: def.npcId,
    monthsLeft: rng.nextInt(2, 4),
  };
  const line = `一段因緣悄悄起了頭——「${def.title}」。`;
  pushChronicle(state, [line]);
  return [line];
}

/** 每月推進短弧；到期則落下一拍 */
export function tickLifeArc(state: LifeGameState): string[] {
  ensureStarterNpcs(state);
  const lines: string[] = [];
  if (!state.lifeArc) {
    lines.push(...maybeStartLifeArc(state));
    return lines;
  }
  const arc = state.lifeArc;
  arc.monthsLeft -= 1;
  if (arc.monthsLeft > 0) return lines;

  const def = getArcDef(arc.id);
  if (!def) {
    state.lifeArc = undefined;
    return lines;
  }
  const beat = def.beats[arc.beat];
  if (!beat) {
    state.lifeArc = undefined;
    return lines;
  }

  if (beat.location) state.character.location = beat.location;
  lines.push(beat.chronicle);
  lines.push(...rememberNpc(state, arc.npcId, beat.memory, beat.affinity));
  // 小幅修養／武學回報
  if (def.id === 'arc_yue_spar') {
    state.character.martial += 1;
    lines.push('武學＋1');
  } else if (def.id === 'arc_shen_heal') {
    state.character.health = Math.min(state.character.maxHealth, state.character.health + 12);
    lines.push('氣血略復');
  } else if (def.id === 'arc_lu_ink') {
    state.character.attributes.wuXing = Math.min(100, state.character.attributes.wuXing + 1);
    lines.push('悟性＋1');
  }

  pushChronicle(state, [beat.chronicle]);
  arc.beat += 1;
  if (arc.beat >= arc.maxBeats) {
    if (def.id === 'arc_lu_ink') state.character.flags.arc_done_lu = true;
    if (def.id === 'arc_shen_heal') state.character.flags.arc_done_shen = true;
    if (def.id === 'arc_yue_spar') state.character.flags.arc_done_yue = true;
    lines.push(`「${def.title}」這段因緣，暫且落幕。`);
    state.lifeArc = undefined;
  } else {
    const rng = getRng();
    arc.monthsLeft = rng.nextInt(2, 5);
  }
  return lines;
}

export function lifeArcStatusLine(state: LifeGameState): string | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const npc = state.npcs[arc.npcId]?.name ?? '故人';
  return `因緣「${arc.title}」· 與${npc}（${arc.beat + 1}/${arc.maxBeats}）`;
}
