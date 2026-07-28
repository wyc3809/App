import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { EVENT_CATALOG } from '@data/events/catalog';
import { getEventById } from '@core/life/eventEngine';
import { useLifeStore } from '../store/lifeStore';
import { LifeDebugPanel } from './LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

export function LifeGameScreen({ state }: Props) {
  const choose = useLifeStore((s) => s.choose);
  const advanceYear = useLifeStore((s) => s.advanceYear);
  const newLife = useLifeStore((s) => s.newLife);
  const saveLabel = useLifeStore((s) => s.saveLabel);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);

  const c = state.character;
  const pendingEvent = state.pending ? getEventById(EVENT_CATALOG, state.pending.eventId) : null;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const lover = c.loverId ? state.npcs[c.loverId] : null;

  return (
    <div className="phone game">
      <header className="status-bar">
        <div>
          <h2>{c.name}</h2>
          <p>
            {c.age} 歲 · {state.year}年
            {sect ? ` · ${sect.name}` : ''}
          </p>
        </div>
        <button type="button" className="btn-icon" onClick={() => setDebugOpen(!debugOpen)} title="除錯">
          ⚙
        </button>
      </header>

      {saveLabel && <p className="save-hint">已存檔 {saveLabel}</p>}

      <section className="vitals">
        <div className="bar-wrap">
          <label>
            氣血 {Math.round(c.health)}/{c.maxHealth}
          </label>
          <div className="bar">
            <div className="fill hp" style={{ width: `${(c.health / c.maxHealth) * 100}%` }} />
          </div>
        </div>
        <div className="stat-row">
          <span>銀兩 {c.money}</span>
          <span>名望 {c.reputation}</span>
          <span>武學 {c.martial}</span>
        </div>
      </section>

      <section className="panel attrs-panel">
        <h3>屬性</h3>
        <div className="attr-grid">
          {wuxiaAttributeKeys.map((k) => (
            <span key={k}>
              {wuxiaAttributeLabels[k]} {c.attributes[k]}
            </span>
          ))}
        </div>
        {lover && <p className="muted">眷屬：{lover.name}</p>}
        {c.skills.length > 0 && <p className="muted">武功：{c.skills.join('、')}</p>}
      </section>

      {state.phase === 'summary' && (
        <section className="panel event-panel summary-panel">
          <h3>人生落幕</h3>
          <pre className="summary-text">{state.summaryText}</pre>
          <button type="button" className="btn-primary" onClick={() => newLife()}>
            轉世再入江湖
          </button>
        </section>
      )}

      {state.phase === 'playing' && pendingEvent && (
        <section className="panel event-panel">
          <h3>{pendingEvent.title}</h3>
          {pendingEvent.body && <p>{pendingEvent.body}</p>}
          <div className="choice-list">
            {pendingEvent.choices.map((ch) => (
              <button key={ch.id} type="button" className="btn-choice" onClick={() => choose(ch.id)}>
                {ch.text}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.phase === 'playing' && !pendingEvent && c.alive && (
        <button type="button" className="btn-primary btn-year" onClick={advanceYear}>
          下一年 ⏳
        </button>
      )}

      <section className="panel feed-panel">
        <h3>人生軌跡</h3>
        <ul className="feed">
          {state.lifeLog.slice(0, 12).map((line, i) => (
            <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
          ))}
        </ul>
      </section>

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
