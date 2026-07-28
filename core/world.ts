import type { AttributeComponent, CharacterEntity, City, Faction, GameState } from '@interfaces/game';
import { computeDerived, getFinalAttributes } from './attribute';
import { ids, randomChineseName, resetIdCounter } from './ids';
import { createMemory } from './memory';
import { createRandomPersonality } from './personality';
import { getRng, initRng } from './random';
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
  const factionDefs: [string, Faction['type']][] = [
    ['青雲劍派', 'sect'],
    ['天刀門', 'sect'],
    ['朝廷錦衣衛', 'court'],
    ['四海商會', 'guild'],
    ['黑虎寨', 'bandit'],
  ];
  for (const [name, type] of factionDefs) {
    const id = ids.faction();
    factions[id] = { id, name, type, reputation: rng.nextInt(20, 80) };
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
    const factionList = Object.values(factions);
    if (rng.chance(0.45)) {
      c.factionId = rng.pick(factionList).id;
    }
    c.martialSkill = rng.nextInt(5, 60);
    c.internalSkill = rng.nextInt(5, 50);
    c.money = rng.nextInt(10, 500);
    characters[c.id] = c;
  }

  const factionValues = Object.values(factions);
  for (const f of factionValues) {
    const members = Object.values(characters).filter((c) => c.factionId === f.id);
    if (members.length) {
      f.leaderId = rng.pick(members).id;
    }
  }

  return {
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
