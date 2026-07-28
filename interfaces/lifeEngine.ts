import { z } from 'zod';

/** 根骨、悟性、福緣、魅力、膽識 */
export const wuxiaAttributeKeys = ['genGu', 'wuXing', 'fuYuan', 'meiLi', 'danShi'] as const;
export type WuxiaAttribute = (typeof wuxiaAttributeKeys)[number];

export const wuxiaAttributeLabels: Record<WuxiaAttribute, string> = {
  genGu: '根骨',
  wuXing: '悟性',
  fuYuan: '福緣',
  meiLi: '魅力',
  danShi: '膽識',
};

const partialAttrsSchema = z.partialRecord(
  z.enum(wuxiaAttributeKeys),
  z.number(),
);

export const requirementSchema = z.object({
  minAge: z.number().optional(),
  maxAge: z.number().optional(),
  minAttrs: partialAttrsSchema.optional(),
  maxAttrs: partialAttrsSchema.optional(),
  flags: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])).optional(),
  notFlags: z.array(z.string()).optional(),
  sectRequired: z.boolean().optional(),
  noSect: z.boolean().optional(),
  minMoney: z.number().optional(),
  minHealth: z.number().optional(),
  minMartial: z.number().optional(),
  minReputation: z.number().optional(),
  once: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  anyTag: z.array(z.string()).optional(),
});

export type EventRequirement = z.infer<typeof requirementSchema>;

export const effectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('narrate'), text: z.string() }),
  z.object({ type: z.literal('attr'), delta: partialAttrsSchema }),
  z.object({ type: z.literal('money'), amount: z.number() }),
  z.object({ type: z.literal('health'), amount: z.number() }),
  z.object({ type: z.literal('reputation'), amount: z.number() }),
  z.object({ type: z.literal('martial'), amount: z.number() }),
  z.object({ type: z.literal('flag'), key: z.string(), value: z.union([z.boolean(), z.number(), z.string()]) }),
  z.object({ type: z.literal('learnSkill'), skillId: z.string(), name: z.string().optional() }),
  z.object({ type: z.literal('joinSect'), sectId: z.string().optional(), sectName: z.string().optional() }),
  z.object({ type: z.literal('leaveSect') }),
  z.object({ type: z.literal('relationship'), npcId: z.string(), delta: z.number() }),
  z.object({ type: z.literal('lover'), npcId: z.string() }),
  z.object({ type: z.literal('worldFlag'), key: z.string(), value: z.union([z.boolean(), z.number(), z.string()]) }),
  z.object({ type: z.literal('die'), reason: z.string().optional() }),
  z.object({ type: z.literal('memory'), npcId: z.string(), text: z.string(), affinity: z.number().optional() }),
]);

export type GameEffect = z.infer<typeof effectSchema>;

export const outcomeSchema = z.object({
  id: z.string().optional(),
  label: z.string().optional(),
  weight: z.number().optional(),
  chance: z.number().min(0).max(1).optional(),
  effects: z.array(effectSchema),
});

export const choiceSchema = z.object({
  id: z.string(),
  text: z.string(),
  requirements: requirementSchema.optional(),
  outcomes: z.array(outcomeSchema).min(1),
});

export const gameEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string().optional(),
  tags: z.array(z.string()).optional(),
  weight: z.number().optional(),
  requirements: requirementSchema.optional(),
  choices: z.array(choiceSchema).min(1),
  /** 無選項時自動執行第一個 choice 的第一個 outcome */
  autoAdvance: z.boolean().optional(),
});

export type GameEvent = z.infer<typeof gameEventSchema>;
export type EventChoice = z.infer<typeof choiceSchema>;
export type EventOutcome = z.infer<typeof outcomeSchema>;

export interface LifeNpc {
  id: string;
  name: string;
  gender: 'male' | 'female';
  role: 'parent' | 'master' | 'lover' | 'rival' | 'friend' | 'stranger';
  affinity: number;
  memories: string[];
  alive: boolean;
}

export interface LifeSect {
  id: string;
  name: string;
  rank: 'outer' | 'inner' | 'elite' | 'elder';
  merit: number;
}

export interface LifeCharacter {
  name: string;
  gender: 'male' | 'female';
  age: number;
  alive: boolean;
  health: number;
  maxHealth: number;
  money: number;
  reputation: number;
  martial: number;
  attributes: Record<WuxiaAttribute, number>;
  skills: string[];
  sectId: string | null;
  loverId: string | null;
  flags: Record<string, boolean | number | string>;
  family: {
    fatherName?: string;
    motherName?: string;
  };
  stats: {
    yearsLived: number;
    eventsSeen: number;
    combats: number;
    combatsWon: number;
    lovers: number;
    wealthPeak: number;
  };
}

export interface PendingEvent {
  eventId: string;
  year: number;
}

export interface LifeGameState {
  version: 1;
  seed: number;
  rngState: string;
  year: number;
  character: LifeCharacter;
  npcs: Record<string, LifeNpc>;
  sects: Record<string, { id: string; name: string }>;
  worldFlags: Record<string, boolean | number | string>;
  completedEvents: string[];
  pending: PendingEvent | null;
  lifeLog: string[];
  phase: 'create' | 'playing' | 'summary';
  summaryText?: string;
}

export const lifeCharacterSchema = z.object({
  name: z.string(),
  gender: z.enum(['male', 'female']),
  age: z.number(),
  alive: z.boolean(),
  health: z.number(),
  maxHealth: z.number(),
  money: z.number(),
  reputation: z.number(),
  martial: z.number(),
  attributes: z.record(z.enum(wuxiaAttributeKeys), z.number()),
  skills: z.array(z.string()),
  sectId: z.string().nullable(),
  loverId: z.string().nullable(),
  flags: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  family: z.object({
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
  }),
  stats: z.object({
    yearsLived: z.number(),
    eventsSeen: z.number(),
    combats: z.number(),
    combatsWon: z.number(),
    lovers: z.number(),
    wealthPeak: z.number(),
  }),
});

export const lifeGameStateSchema = z.object({
  version: z.literal(1),
  seed: z.number(),
  rngState: z.string(),
  year: z.number(),
  character: lifeCharacterSchema,
  npcs: z.record(
    z.string(),
    z.object({
      id: z.string(),
      name: z.string(),
      gender: z.enum(['male', 'female']),
      role: z.enum(['parent', 'master', 'lover', 'rival', 'friend', 'stranger']),
      affinity: z.number(),
      memories: z.array(z.string()),
      alive: z.boolean(),
    }),
  ),
  sects: z.record(z.string(), z.object({ id: z.string(), name: z.string() })),
  worldFlags: z.record(z.string(), z.union([z.boolean(), z.number(), z.string()])),
  completedEvents: z.array(z.string()),
  pending: z
    .object({
      eventId: z.string(),
      year: z.number(),
    })
    .nullable(),
  lifeLog: z.array(z.string()),
  phase: z.enum(['create', 'playing', 'summary']),
  summaryText: z.string().optional(),
});
