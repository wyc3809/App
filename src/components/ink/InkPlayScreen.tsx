import { useEffect, useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { wuxiaAttributeKeys, wuxiaAttributeLabels } from '@interfaces/lifeEngine';
import { LIFE_CATALOG, useLifeStore } from '../../store/lifeStore';
import { getEventById } from '@core/life/eventEngine';
import { getLifeStageLabel } from '@core/life/stages';
import { seasonLabel } from '@core/life/monthly';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS } from '@core/life/actions';
import { getGearDef } from '@data/equipment/catalog';
import { overallMartialLabel, skillDisplay } from '@core/life/flavor';
import { InkScrollBackdrop, InkSealStamp } from './InkDecor';
import { LifeDebugPanel } from '../LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

type PracticeView = 'main' | 'sect';

const RARITY_ZH: Record<string, string> = {
  common: '凡',
  fine: '良',
  rare: '珍',
  epic: '奇',
  divine: '神',
};

export function InkPlayScreen({ state }: Props) {
  const choose = useLifeStore((s) => s.choose);
  const advanceMonth = useLifeStore((s) => s.advanceMonth);
  const newLife = useLifeStore((s) => s.newLife);
  const practice = useLifeStore((s) => s.practice);
  const clearResult = useLifeStore((s) => s.clearResult);
  const lastResult = useLifeStore((s) => s.lastResult);
  const saveLabel = useLifeStore((s) => s.saveLabel);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);
  const setTab = useLifeStore((s) => s.setTab);
  const sealText = useLifeStore((s) => s.sealText);
  const flashLines = useLifeStore((s) => s.flashLines);
  const clearSeal = useLifeStore((s) => s.clearSeal);
  const [practiceView, setPracticeView] = useState<PracticeView>('main');

  useEffect(() => {
    if (!sealText) return;
    const t = window.setTimeout(() => clearSeal(), 900);
    return () => window.clearTimeout(t);
  }, [sealText, clearSeal]);

  useEffect(() => {
    if ((state.tab ?? 'home') !== 'practice') setPracticeView('main');
  }, [state.tab]);

  const c = state.character;
  const month = state.month ?? 1;
  const pendingEvent = state.pending ? getEventById(LIFE_CATALOG, state.pending.eventId) : null;
  const sect = c.sectId ? state.sects[c.sectId] : null;
  const lover = c.loverId ? state.npcs[c.loverId] : null;
  const stage = getLifeStageLabel(state);
  const hpPct = Math.max(0, Math.min(100, (c.health / Math.max(1, c.maxHealth)) * 100));
  const qiPct = Math.max(0, Math.min(100, ((c.qi ?? 0) / Math.max(1, c.maxQi ?? 1)) * 100));
  const tab = state.tab ?? 'home';
  const isPack = (pendingEvent?.tags ?? []).includes('pack');
  const displayTitle = isPack ? '江湖偶遇' : pendingEvent?.title;
  const world = state.world;
  const story = state.story;
  const gearIds = c.gear ?? [];
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const showResult = Boolean(lastResult) && state.phase === 'playing';
  const busy = Boolean(state.pending) || showResult || !c.alive;

  return (
    <div
      className="scroll-shell scroll-shell--play ink-enter"
      key={`${state.year}-${month}-${state.pending?.eventId ?? 'idle'}-${lastResult?.feedback ?? ''}`}
    >
      <InkScrollBackdrop variant="play" />
      {sealText && <InkSealStamp text={sealText} onDone={clearSeal} />}

      <header className="ink-status">
        <div>
          <h2 className="ink-name">{c.name}</h2>
          <p className="ink-meta">
            {c.age} 歲 · {stage} · {state.year}年{month}月（{seasonLabel(month)}）
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

      <nav className="ink-tabs" aria-label="分卷">
        {(
          [
            ['home', '鎮居'],
            ['person', '人物'],
            ['jianghu', '江湖'],
            ['practice', '修煉'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={tab === id ? 'ink-tab ink-tab--active' : 'ink-tab'}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </nav>

      {(tab === 'home' || tab === 'jianghu') && (
        <section className="ink-world" aria-label="天下風聲">
          <p>
            秩序 {world?.order ?? '—'} · 險惡 {world?.danger ?? '—'} · 市面 {world?.economy ?? '—'} · 傳聞{' '}
            {world?.rumors ?? '—'}
          </p>
          <p className="ink-note">{world?.seasonMood} · {world?.lastWorldShift}</p>
          {story && (
            <p className="ink-note">
              第{story.chapter}章「{story.title}」· {story.goal}（{story.progress}/{story.nextMilestone}）
            </p>
          )}
        </section>
      )}

      <section className="ink-vitals" aria-label="氣血內力">
        <div className="ink-vitals-label">
          <span>氣血</span>
          <span>
            {Math.round(c.health)}/{c.maxHealth}
          </span>
        </div>
        <div className="ink-bar">
          <div className="ink-bar-fill" style={{ width: `${hpPct}%` }} />
        </div>
        <div className="ink-vitals-label">
          <span>內力</span>
          <span>
            {Math.round(c.qi ?? 0)}/{c.maxQi ?? 0}
          </span>
        </div>
        <div className="ink-bar ink-bar--qi">
          <div className="ink-bar-fill ink-bar-fill--qi" style={{ width: `${qiPct}%` }} />
        </div>
        <div className="ink-stat-row">
          <span>銀兩 {c.money}</span>
          <span>名望 {c.reputation}</span>
          <span>武學 {c.martial}·{overallMartialLabel(c)}</span>
          <span>疲勞 {c.fatigue ?? 0}</span>
        </div>
        {(c.conditions?.length ?? 0) > 0 && (
          <div className="ink-chips">
            {c.conditions.map((cond) => (
              <span key={cond.id} className="ink-chip">
                {cond.name}·{cond.monthsLeft}月
              </span>
            ))}
          </div>
        )}
      </section>

      {tab === 'person' && (
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
          <p className="ink-note">
            體力 {Math.round(c.stamina ?? 0)}/{c.maxStamina ?? 0}
          </p>
          <p className="ink-note">籍貫 · {c.birthplace || '千燈鎮'} · 所在 {c.location || '千燈鎮'}</p>
          {lover && <p className="ink-note">眷屬 · {lover.name}</p>}
          {c.skills.length > 0 && (
            <ul className="ink-skill-list">
              {c.skills.map((id) => (
                <li key={id}>{skillDisplay(c, id)}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'practice' && (
        <section className="ink-panel ink-practice">
          {practiceView === 'main' && (
            <>
              <h3>修煉</h3>
              <p className="ink-note">苦練、鑄兵、尋訪——武學階位靠修煉與實戰機率進階。</p>
              <div className="ink-practice-grid">
                <button
                  type="button"
                  className="ink-practice-btn ink-practice-btn--sect"
                  disabled={busy}
                  onClick={() => setPracticeView('sect')}
                >
                  <strong>門派</strong>
                  <span>{sect ? `${sect.name} · 進入門中` : '尚未入派 · 擇門拜師'}</span>
                </button>
                {PRACTICE_ACTIONS.map((act) => (
                  <button
                    key={act.id}
                    type="button"
                    className="ink-practice-btn"
                    disabled={busy}
                    onClick={() => practice(act.id)}
                  >
                    <strong>{act.label}</strong>
                    <span>{act.hint}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {practiceView === 'sect' && (
            <>
              <div className="ink-sect-head">
                <h3>{sect ? sect.name : '擇門拜師'}</h3>
                <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setPracticeView('main')}>
                  返回
                </button>
              </div>
              {!sect ? (
                <>
                  <p className="ink-note">各派門風不同，拜入與否，全看當下機緣。</p>
                  <div className="ink-practice-grid">
                    {SECT_DEFS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="ink-practice-btn"
                        disabled={busy}
                        onClick={() => {
                          practice('join_sect', { sectId: s.id });
                          setPracticeView('main');
                        }}
                      >
                        <strong>{s.name}</strong>
                        <span>{s.hint}</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="ink-note">既入師門，差事、比武、靜修皆可磨礪身心。</p>
                  <div className="ink-practice-grid">
                    {SECT_INNER_ACTIONS.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        className="ink-practice-btn"
                        disabled={busy}
                        onClick={() => practice(act.id)}
                      >
                        <strong>{act.label}</strong>
                        <span>{act.hint}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ink-practice-btn"
                      disabled={busy}
                      onClick={() => {
                        practice('sect_leave');
                        setPracticeView('main');
                      }}
                    >
                      <strong>離開門派</strong>
                      <span>割席而去，山門內外兩不相干</span>
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          <h3 className="ink-subhead">行囊裝備</h3>
          <div className="ink-gear-equipped">
            {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
              const id = equipment[slot];
              const def = id ? getGearDef(id) : null;
              return (
                <p key={slot} className="ink-note">
                  {slot === 'weapon' ? '兵刃' : slot === 'armor' ? '護體' : '佩飾'} ·{' '}
                  {def ? `${def.name}（${RARITY_ZH[def.rarity] ?? def.rarity}）` : '空'}
                </p>
              );
            })}
          </div>
          {gearIds.length > 0 && (
            <ul className="ink-gear-list">
              {gearIds.map((id) => {
                const def = getGearDef(id);
                if (!def) return null;
                return (
                  <li key={id}>
                    <span>
                      {def.name}
                      <em>{RARITY_ZH[def.rarity]}</em>
                    </span>
                    <span className="ink-gear-desc">{def.description}</span>
                  </li>
                );
              })}
            </ul>
          )}
          {c.skills.length > 0 && (
            <ul className="ink-skill-list">
              {c.skills.map((id) => (
                <li key={id}>{skillDisplay(c, id)}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {showResult && lastResult && (
        <section className="ink-panel ink-result" aria-live="polite">
          <p className="ink-event-year">抉擇已定</p>
          <h3>{lastResult.title}</h3>
          <p className="ink-result-choice">你選擇：{lastResult.choiceText}</p>
          <p className="ink-event-body">{lastResult.feedback}</p>
          {lastResult.deltas.length > 0 && (
            <ul className="ink-delta-list">
              {lastResult.deltas.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <button type="button" className="ink-btn ink-btn--primary" onClick={() => clearResult()}>
            已知曉 · 掩卷
          </button>
        </section>
      )}

      {flashLines.length > 0 && state.phase === 'playing' && !pendingEvent && !showResult && (
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

      {state.phase === 'playing' && pendingEvent && !showResult && (
        <section className="ink-panel ink-event">
          <p className="ink-event-year">
            {state.year}年{month}月 · {c.age}歲
            {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
          </p>
          <h3>{displayTitle}</h3>
          {pendingEvent.body && <p className="ink-event-body">{pendingEvent.body}</p>}
          <div className="ink-choice-list">
            {pendingEvent.choices.slice(0, 3).map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                className="ink-choice"
                style={{ animationDelay: `${0.05 * i}s` }}
                onClick={() => choose(ch.id)}
              >
                <span className="ink-choice-mark">{['甲', '乙', '丙'][i] ?? '註'}</span>
                {ch.text}
              </button>
            ))}
          </div>
        </section>
      )}

      {state.phase === 'playing' && !pendingEvent && c.alive && !showResult && (
        <button type="button" className="ink-btn ink-btn--primary ink-btn--year" onClick={advanceMonth}>
          翻過一頁 · 過一月
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
