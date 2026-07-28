import type { GameTimestamp, MemoryNode } from '@interfaces/game';
import { ids } from './ids';
import { getRng } from './random';

export function createMemory(
  summary: string,
  opts: {
    category?: MemoryNode['category'];
    emotion?: number;
    importance?: number;
    confidence?: number;
    createdAt: GameTimestamp;
    secret?: boolean;
  },
): MemoryNode {
  return {
    id: ids.memory(),
    category: opts.category ?? 'event',
    summary,
    emotion: opts.emotion ?? 50,
    importance: opts.importance ?? 50,
    confidence: opts.confidence ?? 85,
    createdAt: opts.createdAt,
    decay: 0,
    secret: opts.secret ?? false,
  };
}

export function forgetTick(memories: MemoryNode[], importance: number, sleepQuality: number): MemoryNode[] {
  const rng = getRng();
  return memories
    .map((m) => {
      const retention =
        (m.importance / 100) *
        (m.emotion / 100) *
        (importance / 100) *
        (sleepQuality / 100);
      const decayRate = (1 - retention) * 0.02;
      return { ...m, decay: m.decay + decayRate };
    })
    .filter((m) => {
      if (m.category === 'long' || m.importance >= 90) return true;
      return m.decay < 1 || rng.chance(m.importance / 200);
    });
}

export function recall(memories: MemoryNode[], query: string): MemoryNode[] {
  return memories.filter((m) => m.summary.includes(query) || query.length < 2);
}

export function compressOldMemories(memories: MemoryNode[], currentYear: number): MemoryNode[] {
  return memories.map((m) => {
    const age = currentYear - m.createdAt.year;
    if (age < 10 || m.importance >= 80) return m;
    const shortened =
      m.summary.length > 24 ? `${m.summary.slice(0, 20)}…` : m.summary;
    return { ...m, summary: shortened, confidence: Math.max(40, m.confidence - age) };
  });
}
