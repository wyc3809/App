export type PrimaryAttribute =
  | 'strength'
  | 'agility'
  | 'constitution'
  | 'intelligence'
  | 'spirit'
  | 'perception'
  | 'willpower'
  | 'luck';

export interface AttributeComponent {
  strength: number;
  agility: number;
  constitution: number;
  intelligence: number;
  spirit: number;
  perception: number;
  willpower: number;
  luck: number;
}

export interface AttributeModifier {
  id: string;
  source: string;
  layer: 'growth' | 'equipment' | 'buff' | 'food' | 'environment' | 'temporary' | 'permanent';
  deltas: Partial<AttributeComponent>;
  expiresAtTick?: number;
}

export interface DerivedStats {
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  stamina: number;
  attack: number;
  qiAttack: number;
  defense: number;
  dodge: number;
  accuracy: number;
  critChance: number;
  moveSpeed: number;
  carryKg: number;
  learning: number;
  recovery: number;
}

export interface PersonalityComponent {
  traits: Record<string, number>;
  beliefs: string[];
  goals: string[];
  fears: string[];
  stability: number;
  alignment: number;
}

export interface GameTimestamp {
  year: number;
  month: number;
  day: number;
  hour: number;
  tick: number;
}

export type EventPriority = 'critical' | 'major' | 'normal' | 'background';

export interface WorldEvent {
  id: string;
  timestamp: GameTimestamp;
  priority: EventPriority;
  type: string;
  summary: string;
  participantIds: string[];
  data?: Record<string, unknown>;
}

export interface HistoryEntry {
  id: string;
  timestamp: GameTimestamp;
  text: string;
  importance: number;
  relatedCharacterIds: string[];
}

export interface MemoryNode {
  id: string;
  category:
    | 'short'
    | 'long'
    | 'skill'
    | 'relationship'
    | 'location'
    | 'event'
    | 'rumor'
    | 'emotional'
    | 'combat'
    | 'identity';
  summary: string;
  emotion: number;
  importance: number;
  confidence: number;
  createdAt: GameTimestamp;
  decay: number;
  secret: boolean;
}

export interface CharacterEntity {
  id: string;
  name: string;
  gender: 'male' | 'female';
  birth: GameTimestamp;
  alive: boolean;
  level: number;
  cityId: string;
  /** 與 factionMembership 同步 */
  factionId?: string;
  factionMembership?: FactionMembership;
  parentIds: [string?, string?];
  baseAttributes: AttributeComponent;
  modifiers: AttributeModifier[];
  personality: PersonalityComponent;
  memories: MemoryNode[];
  martialSkill: number;
  internalSkill: number;
  weaponBonus: number;
  armorBonus: number;
  health: number;
  reputation: number;
  money: number;
}

export interface City {
  id: string;
  name: string;
  region: string;
}

export type FactionRank = 'outer' | 'inner' | 'elite' | 'elder' | 'leader';

export interface Faction {
  id: string;
  name: string;
  type: 'sect' | 'court' | 'guild' | 'bandit' | 'family';
  leaderId?: string;
  reputation: number;
  /** 門派駐地城市 */
  homeCityId: string;
  /** 門規 / 理念 */
  doctrine: string;
  treasury: number;
  /** 對立門派 */
  rivalFactionIds: string[];
  memberIds: string[];
}

export interface FactionMembership {
  factionId: string;
  rank: FactionRank;
  /** 門派貢獻 / 功勳 */
  merit: number;
  joinedAt: GameTimestamp;
}

export interface Rumor {
  id: string;
  text: string;
  originCharacterId?: string;
  spread: number;
  truthfulness: number;
  createdAt: GameTimestamp;
}

export interface GameState {
  seed: number;
  worldSeed: number;
  playerId: string;
  timestamp: GameTimestamp;
  fastSimulation: boolean;
  characters: Record<string, CharacterEntity>;
  cities: Record<string, City>;
  factions: Record<string, Faction>;
  events: WorldEvent[];
  history: HistoryEntry[];
  rumors: Rumor[];
  tickCount: number;
  /** 存檔用：上次寫入存檔的 tick */
  lastSaveTick?: number;
}

export type PlayerAction =
  | { type: 'train_martial' }
  | { type: 'train_internal' }
  | { type: 'work' }
  | { type: 'explore' }
  | { type: 'socialize' }
  | { type: 'rest' }
  | { type: 'duel' }
  | { type: 'donate' }
  | { type: 'travel'; cityId: string }
  | { type: 'age_year' }
  | { type: 'join_faction'; factionId: string }
  | { type: 'leave_faction' }
  | { type: 'faction_duty' }
  | { type: 'faction_donate'; amount: number };
