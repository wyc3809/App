import { useEffect } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { EVENT_CATALOG } from '@data/events/catalog';
import { getEventById } from '@core/life/eventEngine';
import { getLifeStageLabel } from '@core/life/stages';
import { useLifeStore } from '../../store/lifeStore';
import { InkScrollBackdrop, InkSealStamp } from './InkDecor';
import { LifeDebugPanel } from '../LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

export function InkPlayScreen({ state }: Props) {
  const choose = useLifeStore((s) => s.choose);
  const advanceYear = useLifeStore((s) => s.advanceYear);
  const newLife = useLifeStore((s) => s.newLife);
  const saveLabel = useLifeStore((s) => s.saveLabel);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);
  const sealText = useLifeStore((s) => s.sealText);
  const flashLines = useLifeStore((s) => s.flashLines);
  const clearSeal = useLifeStore((s) => s.clearSeal);

  useEffect(() => {
    if (!sealText) return;
    const t = window.setTimeout(() => clearSeal(), 900);
    return () => window.clearTimeout(t);
  }, [sealText, clearSeal]);

  const c = state.character;
  const pendingEvent = state.pending ? getEventById(EVENT_CATALOG, state.pending.eventId) : null;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const lover = c.loverId ? state.npcs[c.loverId] : null;
  const stage = getLifeStageLabel(state);
  const hpPct = Math.max(0, Math.min(100, (c.health / c.maxHealth) * 100));

  return (
    <div className="scroll-shell scroll-shell--play ink-enter" key={`${state.year}-${state.pending?.eventId ?? 'idle'}`}>
      <InkScrollBackdrop variant="play" />
      {sealText && <InkSealStamp text={sealText} onDone={clearSeal} />}

      <header className="ink-status">
        <div>
          <h2 className="ink-name">{c.name}</h2>
          <p className="ink-meta">
            {c.age} 歲 · {stage} · {state.year}年
            {sect ? ` · ${sect.name}` : ''}
          </p>
        </div>
        <button
          type="button"
          className="ink-icon-btn"
          onClick={() => setDebugOpen(!debugOpen)}
          title="除錯"
        >
          墨
        </button>
      </header>

      {saveLabel && <p className="ink-save">已落筆 {saveLabel}</p>}

      <section className="ink-vitals" aria-label="氣血">
        <div className="ink-vitals-label">
          <span>氣血</span>
          <span>
            {Math.round(c.health)}/{c.maxHealth}
          </span>
        </div>
        <div className="ink-bar">
          <div className="ink-bar-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="ink-stat-row">
          <span>銀兩 {c.money}</span>
          <span>名望 {c.reputation}</span>
          <span>武學 {c.martial}</span>
        </div>
      </section>

      <section className="ink-panel ink-attrs">
        <h3>五維</h3>
        <div className="ink-attr-grid">
          {wuxiaAttributeKeys.map((k) => (
            <div key={k} className="ink-attr">
              <span className="ink-attr-label">{wuxiaAttributeLabels[k]}</span>
              <strong>{c.attributes[k]}</strong>
            </div>
          ))}
        </div>
        {lover && <p className="ink-note">眷屬 · {lover.name}</p>}
        {c.skills.length > 0 && <p className="ink-note">武功 · {c.skills.join('、')}</p>}
      </section>

      {flashLines.length > 0 && state.phase === 'playing' && !pendingEvent && (
        <section className="ink-flash" aria-live="polite">
          {flashLines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </section>
      )}

      {state.phase === 'summary' && (
        <section className="ink-panel ink-epitaph">
          <h3>掩卷</h3>
          <pre className="ink-epitaph-text">{state.summaryText}</pre>
          <div className="ink-seal-static ink-seal-static--end" aria-hidden>
            終
          </div>
          <button type="button" className="ink-btn ink-btn--primary" onClick={() => newLife()}>
            轉世再入江湖
          </button>
        </section>
      )}

      {state.phase === 'playing' && pendingEvent && (
        <section className="ink-panel ink-event">
          <p className="ink-event-year">
            {state.year}年 · {c.age}歲
          </p>
          <h3>{pendingEvent.title}</h3>
          {pendingEvent.body && <p className="ink-event-body">{pendingEvent.body}</p>}
          <div className="ink-choice-list">
            {pendingEvent.choices.map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                className="ink-choice"
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => choose(ch.id)}
              >
                <span className="ink-choice-mark">註</span>
                {ch.text}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.phase === 'playing' && !pendingEvent && c.alive && (
        <button type="button" className="ink-btn ink-btn--primary ink-btn--year" onClick={advanceYear}>
          翻過一頁 · 下一年
        </button>
      )}

      <section className="ink-panel ink-chronicle">
        <h3>年譜</h3>
        <ul className="ink-log">
          {state.lifeLog.slice(0, 14).map((line, i) => (
            <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
          ))}
        </ul>
      </section>

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
