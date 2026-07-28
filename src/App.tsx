import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { GameState, PlayerAction } from '@interfaces/game';
import { applyPlayerAction } from '@core/gameplay';
import { getDominantTrait, getPersonalityArchetype } from '@core/personality';
import { computeDerived, getFinalAttributes } from '@core/attribute';
import { formatTimestamp } from '@core/history';
import { characterAge } from '@core/simulation';
import {
  clearSaveStorage,
  formatSaveTime,
  loadSaveFromStorage,
  persistSave,
  readPersistedSave,
  type PersistedSave,
  writeSaveToStorage,
} from '@core/save';
import { createDefaultWorld, getPlayer } from '@core/world';
import { GameScreen } from './components/GameScreen';
import { StartScreen } from './components/StartScreen';

function cloneState(s: GameState): GameState {
  return structuredClone(s);
}

export default function App() {
  const [state, setState] = useState<GameState | null>(null);
  const [feed, setFeed] = useState<string[]>([]);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const persistedRef = useRef<PersistedSave | null>(null);
  const lastStateRef = useRef<GameState | null>(null);
  const feedRef = useRef<string[]>([]);

  const resume = loadSaveFromStorage();

  const commitSave = useCallback((nextState: GameState, nextFeed: string[]) => {
    const persisted = persistSave(persistedRef.current, lastStateRef.current, nextState, nextFeed);
    persistedRef.current = persisted;
    lastStateRef.current = cloneState(nextState);
    writeSaveToStorage(persisted);
    setSaveLabel(formatSaveTime(persisted.savedAt));
  }, []);

  const startNew = useCallback(
    (seed?: number) => {
      clearSaveStorage();
      persistedRef.current = null;
      lastStateRef.current = null;
      const s = seed ?? (Date.now() & 0xffffffff);
      const world = createDefaultWorld(s);
      const player = world.characters[world.playerId];
      const initialFeed = [
        `江湖風起。你是${player.name}，生於${formatTimestamp(world.timestamp)}。`,
        '世界不會因你停下。選擇你的道路。',
      ];
      setState(world);
      setFeed(initialFeed);
      feedRef.current = initialFeed;
      commitSave(world, initialFeed);
    },
    [commitSave],
  );

  const continueGame = useCallback(() => {
    const raw = readPersistedSave();
    const loaded = loadSaveFromStorage();
    if (!raw || !loaded) return;
    persistedRef.current = raw;
    lastStateRef.current = cloneState(loaded.state);
    setState(loaded.state);
    setFeed(loaded.feed);
    feedRef.current = loaded.feed;
    setSaveLabel(formatSaveTime(loaded.savedAt));
  }, []);

  const dispatch = useCallback(
    (action: PlayerAction) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = cloneState(prev);
        const lines = applyPlayerAction(next, action);
        setFeed((f) => {
          const merged = [...lines, ...f].slice(0, 80);
          feedRef.current = merged;
          commitSave(next, merged);
          return merged;
        });
        return next;
      });
    },
    [commitSave],
  );

  useEffect(() => {
    const onHide = () => {
      if (lastStateRef.current) {
        commitSave(lastStateRef.current, feedRef.current);
      }
    };
    window.addEventListener('pagehide', onHide);
    window.addEventListener('beforeunload', onHide);
    return () => {
      window.removeEventListener('pagehide', onHide);
      window.removeEventListener('beforeunload', onHide);
    };
  }, [commitSave]);

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
    const faction = player.factionId ? state.factions[player.factionId] : undefined;
    return {
      player,
      age,
      attrs,
      derived,
      archetype: getPersonalityArchetype(player.personality.traits),
      dominant: getDominantTrait(player.personality.traits),
      city: state.cities[player.cityId],
      faction,
    };
  }, [state]);

  if (!state || !meta) {
    return (
      <StartScreen
        onStart={startNew}
        onContinue={resume ? continueGame : undefined}
        resumeHint={
          resume
            ? `${resume.state.characters[resume.state.playerId]?.name ?? '俠客'} · ${formatTimestamp(resume.state.timestamp)}`
            : undefined
        }
      />
    );
  }

  return (
    <GameScreen
      state={state}
      meta={meta}
      feed={feed}
      saveLabel={saveLabel}
      onAction={dispatch}
      onNewLife={() => startNew()}
    />
  );
}
