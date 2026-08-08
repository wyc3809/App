import type { GameEvent, LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { rememberNpc, ensureStarterNpcs } from './npcCatalog';
import { pushChronicle } from './chronicle';

/** 短弧：5–6 拍人生片段，可絕交／結緣分岔 */
export interface LifeArcState {
  id: string;
  title: string;
  beat: number;
  maxBeats: number;
  npcId: string;
  monthsLeft: number;
  /** severed | bonded | undefined */
  branch?: 'severed' | 'bonded';
}

type ArcBeat = {
  chronicle: string;
  memory: string;
  affinity: number;
  location?: string;
};

type ArcDef = {
  id: string;
  title: string;
  npcId: string;
  maxBeats: number;
  canStart: (state: LifeGameState) => boolean;
  beats: ArcBeat[];
  /** 中段可選絕交 */
  severAtBeat?: number;
  severMemory?: string;
  bondMemory?: string;
};

const ARC_DEFS: ArcDef[] = [
  {
    id: 'arc_lu_ink',
    title: '硯生授字',
    npcId: 'npc_lu_yansheng',
    maxBeats: 5,
    severAtBeat: 2,
    severMemory: '與你絕了紙緣',
    bondMemory: '認你為忘年筆友',
    canStart: (s) => s.character.age <= 32 && !s.character.flags.arc_done_lu,
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
        chronicle: '他問起你的來處。你答得含糊，他也不追，只把硯台推近你一寸。',
        memory: '不問來處',
        affinity: 8,
      },
      {
        chronicle: '硯生將一本薄冊塞進你袖裡：「不必謝。他日若有字，記得寄一封。」',
        memory: '贈你薄冊',
        affinity: 12,
      },
      {
        chronicle: '鎮口送別。他說：「字寫完了，人還在路上。」風把紙角掀起，像在揮手。',
        memory: '鎮口揮手',
        affinity: 14,
      },
    ],
  },
  {
    id: 'arc_shen_heal',
    title: '暮晴診脈',
    npcId: 'npc_shen_muqing',
    maxBeats: 5,
    severAtBeat: 2,
    severMemory: '與你生分了',
    bondMemory: '允你有難來醫館',
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
        chronicle: '雨夜有人撞門求醫。你幫忙按住傷者，她眼神只在傷口上，卻說了聲「謝」。',
        memory: '雨夜同診',
        affinity: 10,
      },
      {
        chronicle: '暮晴看過你舊傷，低聲：「下次別逞強。醫館燈還亮著。」',
        memory: '囑你勿逞強',
        affinity: 14,
      },
      {
        chronicle: '你離開醫館時，她把一盞小燈掛到檐下：「認得這光，就還找得到路。」',
        memory: '檐下掛燈',
        affinity: 16,
      },
    ],
  },
  {
    id: 'arc_yue_spar',
    title: '長風試拳',
    npcId: 'npc_yue_changfeng',
    maxBeats: 6,
    severAtBeat: 3,
    severMemory: '嫌你心浮',
    bondMemory: '收你半個徒弟',
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
        chronicle: '他罰你馬步到腿顫：「根基不穩，華山風會把你吹下去。」',
        memory: '罰你馬步',
        affinity: 9,
      },
      {
        chronicle: '長風將一張拜帖壓在桌案：「華山若開臺，記得來。拳腳要見世面。」',
        memory: '囑你上華山見世面',
        affinity: 15,
      },
      {
        chronicle: '臨別他拍你肩：「打輸了回來，別把臉埋進酒裡——埋進砂袋。」',
        memory: '囑你輸了練砂袋',
        affinity: 16,
      },
    ],
  },
];

export function getArcDef(id: string): ArcDef | undefined {
  return ARC_DEFS.find((a) => a.id === id);
}

export function isArcVisitReady(state: LifeGameState): boolean {
  return Boolean(state.lifeArc && state.lifeArc.monthsLeft <= 0);
}

export function buildArcVisitEvent(state: LifeGameState, beatOverride?: number): GameEvent | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const def = getArcDef(arc.id);
  if (!def) return null;
  const beat = beatOverride ?? arc.beat;
  const beatDef = def.beats[beat];
  if (!beatDef) return null;
  const npcName = state.npcs[arc.npcId]?.name ?? '故人';
  const choices: GameEvent['choices'] = [
    {
      id: 'go',
      text: '前去相見',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你推門而入，與${npcName}相對。${beatDef.chronicle}`,
            },
          ],
        },
      ],
    },
    {
      id: 'later',
      text: '改日再說',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你在巷口停了停，沒有邁步。${npcName}那邊的燈火還在。`,
            },
          ],
        },
      ],
    },
  ];

  // 中段分岔：絕交／深交
  if (def.severAtBeat !== undefined && beat === def.severAtBeat) {
    choices.push({
      id: 'sever',
      text: '疏遠斷了這段緣',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你拱手退去，話只剩半句。${npcName}望着你的背影，終究沒有喊。`,
            },
          ],
        },
      ],
    });
    choices.push({
      id: 'bond',
      text: '以心相交，深結此緣',
      outcomes: [
        {
          effects: [
            {
              type: 'narrate',
              text: `你把心裏那點猶豫說開。${npcName}沉默片刻，點了點頭——從此這段緣，沉了一寸。`,
            },
          ],
        },
      ],
    });
  }

  return {
    id: `arc_visit_${arc.id}_${beat}`,
    title: `故人·${def.title}`,
    body: beatDef.chronicle,
    weight: 40,
    tags: ['arc', 'story'],
    choices,
  };
}

export function listArcBonusEvents(state: LifeGameState): GameEvent[] {
  if (!isArcVisitReady(state)) return [];
  const ev = buildArcVisitEvent(state);
  return ev ? [ev] : [];
}

export function lookupArcEvent(state: LifeGameState, eventId: string): GameEvent | null {
  if (!eventId.startsWith('arc_visit_')) return null;
  const live = buildArcVisitEvent(state);
  if (live && live.id === eventId) return live;
  const m = /^arc_visit_(arc_[a-z_]+)_(\d+)$/.exec(eventId);
  if (!m) return null;
  const arcId = m[1]!;
  const beat = Number(m[2]);
  const def = getArcDef(arcId);
  if (!def) return null;
  const shadow: LifeGameState = {
    ...state,
    lifeArc:
      state.lifeArc?.id === arcId
        ? { ...state.lifeArc, beat, monthsLeft: 0 }
        : {
            id: arcId,
            title: def.title,
            beat,
            maxBeats: def.maxBeats,
            npcId: def.npcId,
            monthsLeft: 0,
          },
  };
  return buildArcVisitEvent(shadow, beat);
}

export function maybeStartLifeArc(state: LifeGameState): string[] {
  if (state.lifeArc) return [];
  ensureStarterNpcs(state);
  const rng = getRng();
  if (!rng.chance(0.14)) return [];
  const candidates = ARC_DEFS.filter((d) => d.canStart(state) && state.npcs[d.npcId]?.alive);
  if (!candidates.length) return [];
  const def = rng.pick(candidates);
  state.lifeArc = {
    id: def.id,
    title: def.title,
    beat: 0,
    maxBeats: def.maxBeats,
    npcId: def.npcId,
    monthsLeft: rng.nextInt(1, 3),
  };
  const line = `一段因緣悄悄起了頭——「${def.title}」。`;
  pushChronicle(state, [line]);
  return [line];
}

export function tickLifeArc(state: LifeGameState): string[] {
  ensureStarterNpcs(state);
  const lines: string[] = [];
  if (!state.lifeArc) {
    lines.push(...maybeStartLifeArc(state));
    return lines;
  }
  const arc = state.lifeArc;
  if (arc.monthsLeft > 0) {
    arc.monthsLeft -= 1;
  }
  return lines;
}

function markArcDone(state: LifeGameState, def: ArcDef): void {
  if (def.id === 'arc_lu_ink') state.character.flags.arc_done_lu = true;
  if (def.id === 'arc_shen_heal') state.character.flags.arc_done_shen = true;
  if (def.id === 'arc_yue_spar') state.character.flags.arc_done_yue = true;
}

/** 「前去相見」／結緣：寫入本拍、推進下一拍或落幕 */
export function resolveArcVisitGo(state: LifeGameState, mode: 'go' | 'bond' = 'go'): string[] {
  ensureStarterNpcs(state);
  const arc = state.lifeArc;
  if (!arc) return [];
  const def = getArcDef(arc.id);
  if (!def) {
    state.lifeArc = undefined;
    return [];
  }
  const beat = def.beats[arc.beat];
  if (!beat) {
    state.lifeArc = undefined;
    return [];
  }

  const lines: string[] = [];
  if (beat.location) state.character.location = beat.location;
  const affinity = mode === 'bond' ? beat.affinity + 6 : beat.affinity;
  const memory = mode === 'bond' && def.bondMemory ? def.bondMemory : beat.memory;
  lines.push(...rememberNpc(state, arc.npcId, memory, affinity));

  if (mode === 'bond') {
    arc.branch = 'bonded';
    state.character.flags[`arc_bond_${def.id}`] = true;
    lines.push('這段緣，你們認了。');
  }

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

  arc.beat += 1;
  if (arc.beat >= arc.maxBeats) {
    markArcDone(state, def);
    if (arc.branch === 'bonded') {
      state.character.flags.legacy_friend = def.npcId;
      lines.push(`「${def.title}」落幕。來世若還記得，或許仍會撞見。`);
    } else {
      lines.push(`「${def.title}」這段因緣，暫且落幕。`);
    }
    state.lifeArc = undefined;
  } else {
    const rng = getRng();
    arc.monthsLeft = rng.nextInt(2, 5);
    lines.push(`下一段會面，約在 ${arc.monthsLeft} 個月後。`);
  }
  return lines;
}

/** 疏遠斷緣 */
export function resolveArcVisitSever(state: LifeGameState): string[] {
  const arc = state.lifeArc;
  if (!arc) return [];
  const def = getArcDef(arc.id);
  if (!def) {
    state.lifeArc = undefined;
    return [];
  }
  const lines = rememberNpc(state, arc.npcId, def.severMemory ?? '與你疏遠', -12);
  arc.branch = 'severed';
  markArcDone(state, def);
  state.character.flags[`arc_sever_${def.id}`] = true;
  state.lifeArc = undefined;
  lines.push(`你與「${def.title}」一筆勾了。有些燈，轉身就不看。`);
  return lines;
}

export function resolveArcVisitLater(state: LifeGameState): string[] {
  const arc = state.lifeArc;
  if (!arc) return [];
  const rng = getRng();
  arc.monthsLeft = rng.nextInt(1, 2);
  return [`你改日再訪。這段因緣暫緩 ${arc.monthsLeft} 個月。`];
}

export function lifeArcStatusLine(state: LifeGameState): string | null {
  const arc = state.lifeArc;
  if (!arc) return null;
  const npc = state.npcs[arc.npcId]?.name ?? '故人';
  const ready = arc.monthsLeft <= 0 ? '· 可往一見' : `· ${arc.monthsLeft}月後可再訪`;
  return `因緣「${arc.title}」· 與${npc}（${Math.min(arc.beat + 1, arc.maxBeats)}/${arc.maxBeats}）${ready}`;
}
