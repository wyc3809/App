import type { LifeGameState } from '@interfaces/lifeEngine';
import { getHeirName, listChildNames } from './family';

const CHRONICLE_FLAG = 'genealogy_chronicle_json';

export type GenealogyEntry = {
  /** 世系標籤，如「上一代」「本世」「子嗣」 */
  generation: string;
  /** 稱謂：父／母／本人／眷屬／子／女／嗣 */
  title: string;
  name: string;
  note?: string;
  /** 本人高亮 */
  self?: boolean;
  /** 繼承人 */
  heir?: boolean;
};

export type GenealogyView = {
  /** 本世族譜行（由上至下） */
  entries: GenealogyEntry[];
  /** 跨世殘頁（前世摘錄） */
  chronicle: string[];
  /** 世數 */
  generationIndex: number;
  clanLabel: string;
};

function readChronicle(c: LifeGameState['character']): string[] {
  const raw = c.flags[CHRONICLE_FLAG];
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function writeGenealogyChronicle(c: LifeGameState['character'], lines: string[]): void {
  const trimmed = lines.filter(Boolean).slice(-24);
  if (!trimmed.length) {
    delete c.flags[CHRONICLE_FLAG];
    return;
  }
  c.flags[CHRONICLE_FLAG] = JSON.stringify(trimmed);
}

export function listGenealogyChronicle(state: LifeGameState): string[] {
  return readChronicle(state.character);
}

/** 本世結束時摘錄一行，供來世族譜殘頁 */
export function snapshotLifeForGenealogy(state: LifeGameState): string {
  const c = state.character;
  const gen = Math.max(1, Number(c.flags.legacy_generation ?? 1));
  const kids = listChildNames(state);
  const heir = getHeirName(state);
  const lover =
    c.loverId && state.npcs[c.loverId] ? state.npcs[c.loverId]!.name : undefined;
  const bits = [
    `第${gen}世「${c.name}」`,
    `享年${c.age}`,
    lover ? `眷屬${lover}` : '',
    kids.length ? `子女${kids.join('、')}` : '無嗣',
    heir ? `立嗣${heir}` : '',
  ].filter(Boolean);
  return bits.join(' · ');
}

/** 組裝當前可展示的族譜 */
export function buildGenealogy(state: LifeGameState): GenealogyView {
  const c = state.character;
  const gen = Math.max(1, Number(c.flags.legacy_generation ?? 1));
  const entries: GenealogyEntry[] = [];
  const father = c.family?.fatherName;
  const mother = c.family?.motherName;
  const ancestor =
    typeof c.flags.legacy_ancestor === 'string' ? c.flags.legacy_ancestor : undefined;

  if (ancestor && gen > 1) {
    entries.push({
      generation: '先祖',
      title: '前世',
      name: ancestor,
      note: `第${gen - 1}世墨跡`,
    });
  }

  if (father) {
    entries.push({
      generation: '上一代',
      title: '父',
      name: father,
      note: state.npcs.parent_father?.alive === false ? '已故' : undefined,
    });
  }
  if (mother) {
    entries.push({
      generation: '上一代',
      title: '母',
      name: mother,
      note: state.npcs.parent_mother?.alive === false ? '已故' : undefined,
    });
  }

  entries.push({
    generation: '本世',
    title: '本人',
    name: c.name,
    self: true,
    note: [
      `${c.age}歲`,
      c.birthplace ? `籍${c.birthplace}` : '',
      c.sectId && state.sects[c.sectId] ? state.sects[c.sectId]!.name : '',
    ]
      .filter(Boolean)
      .join(' · '),
  });

  if (c.loverId && state.npcs[c.loverId]) {
    const lover = state.npcs[c.loverId]!;
    entries.push({
      generation: '本世',
      title: c.flags.lover_severed ? '舊侶' : '眷屬',
      name: lover.name,
      note: c.flags.lover_dual_done
        ? '相守'
        : c.flags.lover_severed
          ? '已斷'
          : lover.affinity >= 70
            ? '情深'
            : undefined,
    });
  } else if (c.flags.lover_severed) {
    entries.push({
      generation: '本世',
      title: '舊侶',
      name: '（名已淡）',
      note: '緣盡',
    });
  }

  const heir = getHeirName(state);
  const kids = listChildNames(state);
  for (const name of kids) {
    const childNpc = Object.values(state.npcs).find(
      (n) => n.name === name && n.id.startsWith('child_'),
    );
    entries.push({
      generation: '子嗣',
      title: childNpc?.gender === 'female' ? '女' : childNpc?.gender === 'male' ? '子' : '子女',
      name,
      heir: heir === name,
      note: heir === name ? '繼承人' : undefined,
    });
  }

  if (!kids.length && c.flags.legacy_siblings_echo) {
    const echo = String(c.flags.legacy_siblings_echo);
    for (const name of echo.split('、').filter(Boolean).slice(0, 5)) {
      entries.push({
        generation: '族譜殘頁',
        title: '前世子女',
        name,
        note: '墨跡',
      });
    }
  }

  const clan =
    typeof c.flags.legacy_ancestor === 'string' && c.flags.legacy_ancestor
      ? `${String(c.flags.legacy_ancestor).slice(0, 1)}氏旁支`
      : c.family?.fatherName
        ? `${c.family.fatherName.slice(0, 1)}氏`
        : `${c.name.slice(0, 1)}氏`;

  return {
    entries,
    chronicle: readChronicle(c),
    generationIndex: gen,
    clanLabel: clan,
  };
}

/** 掩卷／摘要用純文字族譜 */
export function formatGenealogyText(state: LifeGameState): string[] {
  const g = buildGenealogy(state);
  const lines: string[] = [`【族譜·${g.clanLabel}】第${g.generationIndex}世`];
  let lastGen = '';
  for (const e of g.entries) {
    if (e.generation !== lastGen) {
      lines.push(`　— ${e.generation} —`);
      lastGen = e.generation;
    }
    const mark = e.self ? '◆' : e.heir ? '◎' : '·';
    lines.push(
      `　${mark}${e.title}　${e.name}${e.note ? `（${e.note}）` : ''}`,
    );
  }
  if (g.chronicle.length) {
    lines.push('　— 跨世殘頁 —');
    for (const row of g.chronicle.slice(-6)) {
      lines.push(`　· ${row}`);
    }
  }
  return lines;
}

/**
 * 死亡／轉世前：把本世記入族譜殘頁，並回傳完整殘頁供 LegacyCarry。
 */
export function sealGenealogyForLegacy(state: LifeGameState): string[] {
  const prev = readChronicle(state.character);
  const snap = snapshotLifeForGenealogy(state);
  const next = [...prev.filter((l) => l !== snap), snap].slice(-24);
  writeGenealogyChronicle(state.character, next);
  return next;
}
