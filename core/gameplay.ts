import type { CharacterEntity, GameState, PlayerAction, WorldEvent } from '@interfaces/game';
import { applyModifier, getFinalAttributes } from './attribute';
import {
  addMerit,
  factionTrainingBonus,
  factionWorldTick,
  joinFaction,
  leaveFaction,
  rankLabel,
} from './faction';
import { addHistory } from './history';
import { ids } from './ids';
import { compressOldMemories, createMemory, forgetTick } from './memory';
import { driftPersonality, getPersonalityArchetype } from './personality';
import { getRng } from './random';
import { advanceTick, characterAge } from './simulation';
import { getPlayer, syncCharacterDerived } from './world';

function pushEvent(state: GameState, type: string, summary: string, priority: WorldEvent['priority'], participantIds: string[]): void {
  state.events.unshift({
    id: ids.event(),
    timestamp: { ...state.timestamp },
    priority,
    type,
    summary,
    participantIds,
  });
  if (state.events.length > 200) state.events.length = 200;
}

function trainGrowth(c: CharacterEntity, tick: number, deltas: Partial<import('@interfaces/game').AttributeComponent>): void {
  c.modifiers = applyModifier(c.modifiers, {
    id: `growth_${tick}`,
    source: 'daily_training',
    layer: 'growth',
    deltas,
  });
}

function npcThink(state: GameState, npc: CharacterEntity): void {
  if (!npc.alive || npc.id === state.playerId) return;
  const rng = getRng();
  const age = characterAge(npc.birth, state.timestamp);
  const archetype = getPersonalityArchetype(npc.personality.traits);

  if (rng.chance(0.02)) {
    if (archetype === '商人' && rng.chance(0.5)) {
      npc.money += rng.nextInt(1, 15);
    } else if (archetype === '俠客' || archetype === '梟雄') {
      npc.martialSkill += rng.chance(0.3) ? 1 : 0;
    }
  }

  if (rng.chance(0.003) && npc.martialSkill > 40) {
    const others = Object.values(state.characters).filter(
      (x) => x.alive && x.id !== npc.id && x.cityId === npc.cityId,
    );
    if (others.length) {
      const victim = rng.pick(others);
      if (npc.personality.traits.aggression > 60 && rng.chance(0.4)) {
        const text = `${npc.name}與${victim.name}在${state.cities[npc.cityId].name}交手。`;
        addHistory(state, text, 55, [npc.id, victim.id]);
        victim.health -= rng.nextInt(5, 25);
        if (victim.health <= 0) {
          victim.alive = false;
          addHistory(state, `${victim.name}敗亡於${npc.name}之手。`, 85, [victim.id, npc.id]);
          pushEvent(state, 'death', victim.name + '身亡', 'major', [victim.id, npc.id]);
        }
      }
    }
  }

  syncCharacterDerived(npc, state);
  if (age > 90 && rng.chance(0.0005)) {
    npc.alive = false;
    addHistory(state, `${npc.name}享年${age}歲，離世。`, 70, [npc.id]);
  }
}

export function simulationTick(state: GameState): void {
  state.timestamp = advanceTick(state.timestamp, state.fastSimulation);
  state.tickCount += 1;
  const rng = getRng();

  for (const c of Object.values(state.characters)) {
    if (!c.alive) continue;
    const age = characterAge(c.birth, state.timestamp);
    const attrs = getFinalAttributes(c.baseAttributes, c.modifiers, state.tickCount, age);
    if (state.tickCount % 50 === 0) {
      c.health = Math.min(
        attrs.constitution * 0.1 + c.health,
        100 + attrs.constitution * 12 + c.level * 8,
      );
    }
    c.memories = forgetTick(c.memories, attrs.intelligence, 70);
    c.memories = compressOldMemories(c.memories, state.timestamp.year);
    syncCharacterDerived(c, state);
  }

  const sample = Object.values(state.characters).filter((c) => c.alive && c.id !== state.playerId);
  const budget = Math.min(8, sample.length);
  for (let i = 0; i < budget; i++) {
    npcThink(state, rng.pick(sample));
  }

  factionWorldTick(state);

  if (rng.chance(0.01)) {
    const alive = Object.values(state.characters).filter((c) => c.alive);
    const a = rng.pick(alive);
    const b = rng.pick(alive);
    if (a.id !== b.id) {
      state.rumors.unshift({
        id: ids.rumor(),
        text: `傳聞${a.name}與${b.name}在${state.cities[a.cityId]?.name ?? '江湖'}有過接觸。`,
        spread: rng.nextInt(1, 10),
        truthfulness: rng.nextInt(30, 90),
        createdAt: { ...state.timestamp },
      });
      if (state.rumors.length > 50) state.rumors.length = 50;
    }
  }
}

function resolveExplore(state: GameState, player: CharacterEntity): string {
  const rng = getRng();
  const city = state.cities[player.cityId];
  const roll = rng.nextFloat();
  if (roll < 0.15) {
    const found = rng.nextInt(5, 40);
    player.money += found;
    return `你在${city.name}城郊拾得 ${found} 兩銀子。`;
  }
  if (roll < 0.25) {
    trainGrowth(player, state.tickCount, { perception: 0.05, agility: 0.03 });
    return `你走遍${city.name}街巷，眼界大開。`;
  }
  if (roll < 0.32) {
    const npc = rng.pick(Object.values(state.characters).filter((c) => c.alive && c.id !== player.id));
    player.memories.push(
      createMemory(`曾見${npc.name}一面`, { createdAt: state.timestamp, importance: 40 }),
    );
    return `你遇見了${npc.name}。`;
  }
  return `你在${city.name}閒逛，風平浪靜。`;
}

export function applyPlayerAction(state: GameState, action: PlayerAction): string[] {
  const player = getPlayer(state);
  const logs: string[] = [];
  if (!player.alive) {
    return ['你已離世，江湖仍在運轉……'];
  }

  const rng = getRng();
  const city = state.cities[player.cityId];
  const age = characterAge(player.birth, state.timestamp);

  switch (action.type) {
    case 'train_martial': {
      const faction = player.factionId ? state.factions[player.factionId] : undefined;
      const bonus = faction ? factionTrainingBonus(player, faction) : 0;
      const gain = Math.max(1, Math.round(player.personality.traits.discipline / 30) + bonus);
      player.martialSkill += gain;
      trainGrowth(player, state.tickCount, { strength: 0.08 * gain, agility: 0.05 * gain });
      player.health -= rng.nextInt(0, 5);
      logs.push(`你苦練劍法，武學 +${gain}。`);
      break;
    }
    case 'train_internal': {
      const gain = Math.max(1, Math.round((player.personality.traits.patience ?? 50) / 35));
      player.internalSkill += gain;
      trainGrowth(player, state.tickCount, { spirit: 0.1 * gain, willpower: 0.04 * gain });
      logs.push(`你打坐運功，內功 +${gain}。`);
      break;
    }
    case 'work': {
      const pay = rng.nextInt(8, 25) + Math.floor((player.personality.traits.greed ?? 50) / 20);
      player.money += pay;
      logs.push(`你在${city.name}打零工，賺得 ${pay} 兩。`);
      break;
    }
    case 'explore': {
      logs.push(resolveExplore(state, player));
      break;
    }
    case 'socialize': {
      const others = Object.values(state.characters).filter(
        (c) => c.alive && c.id !== player.id && c.cityId === player.cityId,
      );
      if (!others.length) {
        logs.push('城中空寂，無人交談。');
      } else {
        const npc = rng.pick(others);
        const rep = rng.nextInt(1, 5);
        player.reputation += rep;
        player.memories.push(
          createMemory(`與${npc.name}把酒言歡`, {
            category: 'relationship',
            emotion: 60,
            importance: 45,
            createdAt: state.timestamp,
          }),
        );
        logs.push(`你與${npc.name}暢談，名望 +${rep}。`);
      }
      break;
    }
    case 'rest': {
      const attrs = getFinalAttributes(player.baseAttributes, player.modifiers, state.tickCount, age);
      const heal = Math.round(attrs.constitution / 2) + 10;
      player.health = Math.min(
        100 + attrs.constitution * 12 + player.level * 8,
        player.health + heal,
      );
      logs.push(`你歇息調息，氣血回復 ${heal}。`);
      break;
    }
    case 'duel': {
      const rivals = Object.values(state.characters).filter(
        (c) => c.alive && c.id !== player.id && c.cityId === player.cityId,
      );
      if (!rivals.length) {
        logs.push('無人應戰。');
        break;
      }
      const foe = rng.pick(rivals);
      const pPower = player.martialSkill + player.internalSkill * 0.5 + rng.nextInt(0, 20);
      const fPower = foe.martialSkill + foe.internalSkill * 0.5 + rng.nextInt(0, 20);
      if (pPower >= fPower) {
        player.reputation += 12;
        player.martialSkill += 2;
        foe.health -= rng.nextInt(15, 40);
        const msg = `你擊敗了${foe.name}！`;
        logs.push(msg);
        addHistory(state, `${player.name}擊敗${foe.name}。`, 75, [player.id, foe.id]);
        player.personality = driftPersonality(player.personality, { confidence: 3, aggression: 1 });
      } else {
        player.health -= rng.nextInt(20, 45);
        logs.push(`你不敵${foe.name}，身受重傷。`);
        player.personality = driftPersonality(player.personality, { humility: 2, courage: 1 });
      }
      if (player.health <= 0) {
        player.alive = false;
        addHistory(state, `${player.name}於決鬥中身亡，享年${age}歲。`, 95, [player.id]);
        logs.push('你撒手人寰。世界並未停下。');
      }
      break;
    }
    case 'donate': {
      if (player.money < 10) {
        logs.push('銀兩不足。');
      } else {
        player.money -= 10;
        player.reputation += 8;
        player.personality = driftPersonality(player.personality, { kindness: 2, mercy: 2 });
        logs.push('你施捨粥米，百姓稱善。');
      }
      break;
    }
    case 'travel': {
      if (action.cityId === player.cityId) {
        logs.push('你已在該城。');
      } else if (!state.cities[action.cityId]) {
        logs.push('路途不明。');
      } else {
        const dest = state.cities[action.cityId];
        player.cityId = action.cityId;
        player.money = Math.max(0, player.money - 5);
        player.memories.push(
          createMemory(`抵達${dest.name}`, { category: 'location', createdAt: state.timestamp }),
        );
        logs.push(`你跋涉至${dest.name}。`);
      }
      break;
    }
    case 'age_year': {
      const ticks = state.fastSimulation ? 288 * 30 * 12 : 86400;
      for (let i = 0; i < ticks; i++) simulationTick(state);
      logs.push(`時光流逝，如今是${state.timestamp.year}年。`);
      break;
    }
    case 'join_faction': {
      const result = joinFaction(state, player, action.factionId);
      if (!result.ok) {
        logs.push(result.reason ?? '無法入派。');
      } else {
        const f = state.factions[action.factionId];
        player.memories.push(
          createMemory(`拜入${f.name}`, {
            category: 'identity',
            importance: 85,
            createdAt: state.timestamp,
          }),
        );
        logs.push(`你成為${f.name}外門弟子。`);
        addHistory(state, `${player.name}加入${f.name}。`, 70, [player.id]);
      }
      break;
    }
    case 'leave_faction': {
      const msg = leaveFaction(state, player);
      logs.push(msg ?? '已脫離門派。');
      break;
    }
    case 'faction_duty': {
      if (!player.factionId || !player.factionMembership) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const faction = state.factions[player.factionId];
      const rngDuty = getRng();
      const merit = rngDuty.nextInt(4, 12);
      addMerit(player, merit);
      faction.treasury += rngDuty.nextInt(2, 10);
      faction.reputation = Math.min(100, faction.reputation + 1);
      if (faction.type === 'sect') {
        player.martialSkill += 1;
      } else if (faction.type === 'guild') {
        player.money += rngDuty.nextInt(5, 15);
      } else if (faction.type === 'court') {
        player.reputation += 2;
      }
      logs.push(`你完成${faction.name}差事，功勳 +${merit}（${rankLabel(player.factionMembership.rank)}）。`);
      break;
    }
    case 'faction_donate': {
      if (!player.factionId) {
        logs.push('你尚未拜入門派。');
        break;
      }
      const amount = Math.max(1, action.amount);
      if (player.money < amount) {
        logs.push('銀兩不足。');
        break;
      }
      player.money -= amount;
      const faction = state.factions[player.factionId];
      faction.treasury += amount;
      addMerit(player, Math.round(amount / 5));
      logs.push(`你捐獻 ${amount} 兩予${faction.name}庫藏。`);
      break;
    }
    default:
      logs.push('無所事事。');
  }

  for (const line of logs) {
    addHistory(state, line, 50, [player.id]);
  }

  for (let i = 0; i < 3; i++) simulationTick(state);

  return logs;
}
