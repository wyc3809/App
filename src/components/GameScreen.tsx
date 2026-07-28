import type { GameState, PlayerAction } from '@interfaces/game';
import type { AttributeComponent, CharacterEntity, City, DerivedStats } from '@interfaces/game';
import { formatTimestamp } from '@core/history';
import { TRAIT_KEYS } from '@core/attribute';

type Meta = {
  player: CharacterEntity;
  age: number;
  attrs: AttributeComponent;
  derived: DerivedStats;
  archetype: string;
  dominant: string;
  city: City;
};

const ACTIONS: { action: PlayerAction; label: string; icon: string }[] = [
  { action: { type: 'train_martial' }, label: '練武', icon: '⚔' },
  { action: { type: 'train_internal' }, label: '修內', icon: '☯' },
  { action: { type: 'work' }, label: '營生', icon: '💰' },
  { action: { type: 'explore' }, label: '遊歷', icon: '🏮' },
  { action: { type: 'socialize' }, label: '結交', icon: '🍶' },
  { action: { type: 'rest' }, label: '歇息', icon: '🛏' },
  { action: { type: 'duel' }, label: '決鬥', icon: '🔥' },
  { action: { type: 'donate' }, label: '行善', icon: '🙏' },
  { action: { type: 'age_year' }, label: '過一年', icon: '⏳' },
];

const ATTR_LABELS: Record<keyof AttributeComponent, string> = {
  strength: '力',
  agility: '敏',
  constitution: '體',
  intelligence: '智',
  spirit: '精',
  perception: '感',
  willpower: '志',
  luck: '運',
};

type Props = {
  state: GameState;
  meta: Meta;
  feed: string[];
  onAction: (a: PlayerAction) => void;
  onNewLife: () => void;
};

export function GameScreen({ state, meta, feed, onAction, onNewLife }: Props) {
  const { player, age, attrs, derived, archetype, city } = meta;
  const alive = player.alive;

  const cities = Object.values(state.cities).filter((c) => c.id !== city.id);

  return (
    <div className="phone game">
      <header className="status-bar">
        <div>
          <h2>{player.name}</h2>
          <p>
            {age} 歲 · {archetype} · {city.name}
          </p>
        </div>
        <div className="date">{formatTimestamp(state.timestamp)}</div>
      </header>

      <section className="vitals">
        <div className="bar-wrap">
          <label>氣血 {Math.round(player.health)}/{derived.maxHp}</label>
          <div className="bar">
            <div className="fill hp" style={{ width: `${(player.health / derived.maxHp) * 100}%` }} />
          </div>
        </div>
        <div className="stat-row">
          <span>銀兩 {player.money}</span>
          <span>名望 {player.reputation}</span>
          <span>武學 {player.martialSkill}</span>
          <span>內功 {player.internalSkill}</span>
        </div>
      </section>

      <section className="panel attrs-panel">
        <h3>八維屬性</h3>
        <div className="attr-grid">
          {(Object.keys(ATTR_LABELS) as (keyof AttributeComponent)[]).map((k) => (
            <div key={k} className="attr-cell">
              <span>{ATTR_LABELS[k]}</span>
              <strong>{Math.round(attrs[k])}</strong>
            </div>
          ))}
        </div>
        <p className="derived">
          攻 {derived.attack} · 防 {derived.defense} · 閃 {derived.dodge} · 暴 {derived.critChance.toFixed(1)}%
        </p>
      </section>

      <section className="panel feed-panel">
        <h3>人生紀事</h3>
        <ul className="feed">
          {feed.map((line, i) => (
            <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
          ))}
        </ul>
      </section>

      {alive ? (
        <>
          <section className="actions">
            {ACTIONS.map(({ action, label, icon }) => (
              <button
                key={label}
                type="button"
                className="action-btn"
                onClick={() => onAction(action)}
              >
                <span className="icon">{icon}</span>
                {label}
              </button>
            ))}
          </section>
          <section className="travel-row">
            {cities.map((c) => (
              <button
                key={c.id}
                type="button"
                className="travel-btn"
                onClick={() => onAction({ type: 'travel', cityId: c.id })}
              >
                前往{c.name}
              </button>
            ))}
          </section>
        </>
      ) : (
        <section className="death-panel">
          <p>你已離世，但江湖依舊。</p>
          <p className="muted">存活 NPC：{Object.values(state.characters).filter((c) => c.alive).length}</p>
          <button type="button" className="btn-primary" onClick={onNewLife}>
            轉世再入江湖
          </button>
        </section>
      )}

      <section className="panel world-panel">
        <h3>江湖傳聞</h3>
        <ul className="rumors">
          {state.rumors.slice(0, 4).map((r) => (
            <li key={r.id}>{r.text}</li>
          ))}
          {!state.rumors.length && <li className="muted">風聲漸起……</li>}
        </ul>
      </section>

      <section className="panel traits-panel">
        <h3>心志 · {player.personality.goals[0]}</h3>
        <div className="traits-scroll">
          {TRAIT_KEYS.slice(0, 8).map((t) => (
            <span key={t} className="trait-pill">
              {t} {player.personality.traits[t]}
            </span>
          ))}
        </div>
      </section>

      <footer className="seed">Seed {state.seed}</footer>
    </div>
  );
}
