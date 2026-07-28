import type { AttributeComponent, CharacterEntity, City, Faction, GameState } from '@interfaces/game';
import { computeDerived, getFinalAttributes } from './attribute';
import { ids, randomChineseName, resetIdCounter } from './ids';
import { createMemory } from './memory';
import { createRandomPersonality } from './personality';
import { getRng, initRng } from './random';
import { syncFactionMemberList } from './faction';
import { characterAge } from './simulation';

function randomAttributes(): AttributeComponent {
  const rng = getRng();
  return {
    strength: rng.nextInt(8, 18),
    agility: rng.nextInt(8, 18),
    constitution: rng.nextInt(8, 18),
    intelligence: rng.nextInt(8, 18),
    spirit: rng.nextInt(8, 18),
    perception: rng.nextInt(8, 18),
    willpower: rng.nextInt(8, 18),
    luck: rng.nextInt(5, 20),
  };
}

export function createCharacter(
  name: string,
  birth: GameState['timestamp'],
  cityId: string,
  gender: 'male' | 'female',
  parentIds: [string?, string?] = [],
): CharacterEntity {
  const base = randomAttributes();
  const personality = createRandomPersonality();
  const derived = computeDerived(base, 1, 5, 5, 0, 0);
  return {
    id: ids.character(),
    name,
    gender,
    birth: { ...birth },
    alive: true,
    level: 1,
    cityId,
    parentIds,
    baseAttributes: base,
    modifiers: [],
    personality,
    memories: [
      createMemory('出生於江湖之中', {
        category: 'long',
        importance: 95,
        createdAt: birth,
      }),
    ],
    martialSkill: 5,
    internalSkill: 5,
    weaponBonus: 0,
    armorBonus: 0,
    health: derived.maxHp,
    reputation: 0,
    money: 50,
  };
}

export function createDefaultWorld(seed: number): GameState {
  resetIdCounter(0);
  initRng(seed);
  const rng = getRng();
  const timestamp = { year: 1000, month: 1, day: 1, hour: 6, tick: 0 };

  const cities: Record<string, City> = {};
  const cityNames = [
    ['洛陽', '中原'],
    ['長安', '關中'],
    ['襄陽', '荊楚'],
    ['成都', '巴蜀'],
    ['蘇州', '江南'],
  ];
  for (const [name, region] of cityNames) {
    const id = ids.city();
    cities[id] = { id, name, region };
  }
  const cityIds = Object.keys(cities);
  const startCity = rng.pick(cityIds);

  const factions: Record<string, Faction> = {};
  const factionDefs: {
    name: string;
    type: Faction['type'];
    doctrine: string;
    rivals: number[];
  }[] = [
    { name: '青雲劍派', type: 'sect', doctrine: '劍道正心', rivals: [1, 4] },
    { name: '天刀門', type: 'sect', doctrine: '刀鎮山河', rivals: [0, 4] },
    { name: '朝廷錦衣衛', type: 'court', doctrine: '忠君護國', rivals: [4] },
    { name: '四海商會', type: 'guild', doctrine: '利市倍出', rivals: [] },
    { name: '黑虎寨', type: 'bandit', doctrine: '弱肉強食', rivals: [0, 1, 2] },
  ];
  const factionIds: string[] = [];
  for (const def of factionDefs) {
    const id = ids.faction();
    factionIds.push(id);
    factions[id] = {
      id,
      name: def.name,
      type: def.type,
      reputation: rng.nextInt(20, 80),
      homeCityId: rng.pick(cityIds),
      doctrine: def.doctrine,
      treasury: rng.nextInt(100, 800),
      rivalFactionIds: [],
      memberIds: [],
    };
  }
  for (let i = 0; i < factionDefs.length; i++) {
    factions[factionIds[i]].rivalFactionIds = factionDefs[i].rivals
      .map((idx) => factionIds[idx])
      .filter(Boolean);
  }

  const characters: Record<string, CharacterEntity> = {};
  const playerName = randomChineseName();
  const player = createCharacter(playerName, timestamp, startCity, rng.chance(0.5) ? 'male' : 'female');
  characters[player.id] = player;

  for (let i = 0; i < 24; i++) {
    const c = createCharacter(
      randomChineseName(),
      {
        year: timestamp.year - rng.nextInt(16, 55),
        month: rng.nextInt(1, 12),
        day: rng.nextInt(1, 28),
        hour: 0,
        tick: 0,
      },
      rng.pick(cityIds),
      rng.chance(0.5) ? 'male' : 'female',
    );
    if (rng.chance(0.45)) {
      const fid = rng.pick(factionIds);
      c.factionId = fid;
      c.factionMembership = {
        factionId: fid,
        rank: rng.chance(0.15) ? 'elder' : 'inner',
        merit: rng.nextInt(5, 60),
        joinedAt: { ...timestamp, year: timestamp.year - rng.nextInt(1, 10) },
      };
    }
    c.martialSkill = rng.nextInt(5, 60);
    c.internalSkill = rng.nextInt(5, 50);
    c.money = rng.nextInt(10, 500);
    characters[c.id] = c;
  }

  const state: GameState = {
    seed,
    worldSeed: seed ^ 0x9e3779b9,
    playerId: player.id,
    timestamp: { ...timestamp },
    fastSimulation: true,
    characters,
    cities,
    factions,
    events: [],
    history: [],
    rumors: [],
    tickCount: 0,
  };

  for (const fid of factionIds) {
    syncFactionMemberList(state, fid);
  }

  for (const f of Object.values(factions)) {
    const members = getFactionMembersFromState(state, f.id);
    if (members.length) {
      const leader = rng.pick(members);
      f.leaderId = leader.id;
      if (leader.factionMembership) leader.factionMembership.rank = 'leader';
    }
  }

  return state;
}

function getFactionMembersFromState(state: GameState, factionId: string): CharacterEntity[] {
  return Object.values(state.characters).filter((c) => c.alive && c.factionId === factionId);
}

export function syncCharacterDerived(c: CharacterEntity, state: GameState): void {
  const age = characterAge(c.birth, state.timestamp);
  const attrs = getFinalAttributes(c.baseAttributes, c.modifiers, state.tickCount, age);
  const derived = computeDerived(
    attrs,
    c.level,
    c.martialSkill,
    c.internalSkill,
    c.weaponBonus,
    c.armorBonus,
  );
  c.health = Math.min(c.health, derived.maxHp);
  if (c.health <= 0) c.alive = false;
}

export function getPlayer(state: GameState): CharacterEntity {
  return state.characters[state.playerId];
}
