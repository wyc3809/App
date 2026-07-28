import { useCallback, useMemo, useState } from 'react';
import type { GameState, PlayerAction } from '@interfaces/game';
import { applyPlayerAction } from '@core/gameplay';
import { getDominantTrait, getPersonalityArchetype } from '@core/personality';
import { computeDerived, getFinalAttributes } from '@core/attribute';
import { formatTimestamp } from '@core/history';
import { characterAge } from '@core/simulation';
import { createDefaultWorld, getPlayer } from '@core/world';
import { GameScreen } from './components/GameScreen';
import { StartScreen } from './components/StartScreen';

function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [feed, setFeed] = useState<string[]>([]);

  const startNew = useCallback((seed?: number) => {
    const s = seed ?? (Date.now() & 0xffffffff);
    const world = createDefaultWorld(s);
    const player = world.characters[world.playerId];
    setState(world);
    setFeed([
      `江湖風起。你是${player.name}，生於${formatTimestamp(world.timestamp)}。`,
      '世界不會因你停下。選擇你的道路。',
    ]);
  }, []);

  const dispatch = useCallback((action: PlayerAction) => {
    setState((prev) => {
      if (!prev) return prev;
      const next = cloneState(prev);
      const lines = applyPlayerAction(next, action);
      setFeed((f) => [...lines, ...f].slice(0, 80));
      return next;
    });
  }, []);

  const meta = useMemo(() => {
    if (!state) return null;
    const player = getPlayer(state);
    const age = characterAge(player.birth, state.timestamp);
    const attrs = getFinalAttributes(player.baseAttributes, player.modifiers, state.tickCount, age);
    const derived = computeDerived(
      attrs,
      player.level,
      player.martialSkill,
      player.internalSkill,
      player.weaponBonus,
      player.armorBonus,
    );
    return {
      player,
      age,
      attrs,
      derived,
      archetype: getPersonalityArchetype(player.personality.traits),
      dominant: getDominantTrait(player.personality.traits),
      city: state.cities[player.cityId],
    };
  }, [state]);

  if (!state || !meta) {
    return <StartScreen onStart={startNew} />;
  }

  return (
    <GameScreen
      state={state}
      meta={meta}
      feed={feed}
      onAction={dispatch}
      onNewLife={() => startNew()}
    />
  );
}
