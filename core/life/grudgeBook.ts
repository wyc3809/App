import type { LifeGameState } from '@interfaces/lifeEngine';
import { getRng } from '@core/random';
import { syncRngFromState, snapshotRng } from './gameState';

const FLAG = 'grudge_book_json';

export type GrudgeKind = 'mercy' | 'blood' | 'stun' | 'favor' | 'debt';

export type GrudgeEntry = {
  id: string;
  name: string;
  kind: GrudgeKind;
  /** 1–5：恩怨深淺 */
  strength: number;
  monthsLeft: number;
};

function readBook(c: LifeGameState['character']): GrudgeEntry[] {
  const raw = c.flags[FLAG];
  if (typeof raw !== 'string' || !raw) return [];
  try {
    const parsed = JSON.parse(raw) as GrudgeEntry[];
    return Array.isArray(parsed) ? parsed.filter((g) => g && g.name) : [];
  } catch {
    return [];
  }
}

function writeBook(c: LifeGameState['character'], book: GrudgeEntry[]): void {
  const trimmed = book.slice(0, 12);
  if (!trimmed.length) {
    delete c.flags[FLAG];
    return;
  }
  c.flags[FLAG] = JSON.stringify(trimmed);
}

export function listGrudges(state: LifeGameState): GrudgeEntry[] {
  return readBook(state.character);
}

export function upsertGrudge(
  state: LifeGameState,
  entry: Omit<GrudgeEntry, 'id'> & { id?: string },
): void {
  const c = state.character;
  const book = readBook(c);
  const existing = book.find((g) => g.name === entry.name && g.kind === entry.kind);
  if (existing) {
    existing.strength = Math.min(5, existing.strength + 1);
    existing.monthsLeft = Math.max(existing.monthsLeft, entry.monthsLeft);
  } else {
    book.unshift({
      id: entry.id ?? `g_${entry.kind}_${book.length}_${entry.name.slice(0, 4)}`,
      name: entry.name,
      kind: entry.kind,
      strength: Math.max(1, Math.min(5, entry.strength)),
      monthsLeft: entry.monthsLeft,
    });
  }
  writeBook(c, book);
}

/** 戰後處置記入恩怨簿（與舊 aftermath 旗標並行） */
export function recordGrudgeFromDisposition(
  state: LifeGameState,
  disposition: 'kill' | 'release' | 'stun',
  foeName: string,
): void {
  syncRngFromState(state);
  const rng = getRng();
  if (disposition === 'release') {
    upsertGrudge(state, {
      name: foeName,
      kind: rng.chance(0.45) ? 'favor' : 'mercy',
      strength: 2,
      monthsLeft: rng.nextInt(4, 10),
    });
  } else if (disposition === 'kill') {
    upsertGrudge(state, {
      name: foeName,
      kind: 'blood',
      strength: 3,
      monthsLeft: rng.nextInt(5, 12),
    });
  } else {
    upsertGrudge(state, {
      name: foeName,
      kind: 'stun',
      strength: 1,
      monthsLeft: rng.nextInt(3, 7),
    });
  }
  snapshotRng(state);
}

/**
 * 每月推進恩怨：到期時寫 pending 旗標或贈禮提示行。
 * 實際開戰仍由 tryStartAftermathCombat 處理。
 */
export function tickGrudgeBook(state: LifeGameState): string[] {
  if (!state.character.alive) return [];
  syncRngFromState(state);
  const rng = getRng();
  const c = state.character;
  const book = readBook(c);
  if (!book.length) {
    snapshotRng(state);
    return [];
  }
  const lines: string[] = [];
  const next: GrudgeEntry[] = [];

  for (const g of book) {
    const left = g.monthsLeft - 1;
    if (left > 0) {
      next.push({ ...g, monthsLeft: left });
      continue;
    }
    if (g.kind === 'blood' || (g.kind === 'mercy' && rng.chance(0.4))) {
      if (!c.flags.pending_revenge_foe && !c.flags.pending_blood_foe) {
        c.flags[g.kind === 'blood' ? 'pending_blood_foe' : 'pending_revenge_foe'] = g.name;
        lines.push(`恩怨簿：與「${g.name}」的舊事將至。`);
      } else {
        next.push({ ...g, monthsLeft: rng.nextInt(2, 5) });
      }
    } else if (g.kind === 'favor') {
      const gift = 8 + g.strength * 6;
      c.money += gift;
      lines.push(`恩怨簿：昔日人情回流——「${g.name}」託人送來銀兩${gift}兩。`);
    } else if (g.kind === 'stun' && rng.chance(0.35)) {
      c.flags.pending_revenge_foe = g.name;
      lines.push(`恩怨簿：「${g.name}」醒後不肯罷休。`);
    } else if (g.kind === 'debt') {
      c.reputation = Math.max(0, c.reputation - g.strength);
      lines.push(`恩怨簿：欠「${g.name}」的人情未清，名望略損。`);
    } else {
      lines.push(`恩怨簿：與「${g.name}」的舊事淡了。`);
    }
  }

  writeBook(c, next);
  snapshotRng(state);
  return lines;
}

export function grudgeKindLabel(kind: GrudgeKind): string {
  if (kind === 'blood') return '血債';
  if (kind === 'mercy') return '舊怨';
  if (kind === 'favor') return '人情';
  if (kind === 'stun') return '未了';
  return '欠債';
}

/** 華山／敘事用：取最強可辨認恩怨名 */
export function topGrudgeNames(state: LifeGameState, n = 2): string[] {
  return listGrudges(state)
    .slice()
    .sort((a, b) => b.strength - a.strength)
    .slice(0, n)
    .map((g) => g.name);
}
