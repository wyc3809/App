import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  natureKeys,
  natureLabels,
  wuxiaAttributeKeys,
  wuxiaAttributeLabels,
} from '@interfaces/lifeEngine';
import { LIFE_CATALOG, useLifeStore } from '../../store/lifeStore';
import { getEventById } from '@core/life/eventEngine';
import { getLifeStageLabel } from '@core/life/stages';
import { seasonLabel } from '@core/life/monthly';
import { PRACTICE_ACTIONS, SECT_INNER_ACTIONS, SECT_DEFS } from '@core/life/actions';
import { getGearDef, WEAPON_KIND_LABEL } from '@data/equipment/catalog';
import { overallMartialLabel, skillDisplay } from '@core/life/flavor';
import { jianghuHints, playerEvasionPercent, practiceLearningHints } from '@core/life/jianghuHints';
import { meetsRequirements } from '@core/life/requirements';
import { GUARD_STANCE, CHARGE_STANCE, FLEE_MOVE } from '@data/skills/catalog';
import { playInkSeal, playInkTap, playInkWin, playInkLose } from '../../audio/inkAudio';
import { describeSectProgress } from '@core/life/sectStanding';
import { ensureNature, dominantNature, natureGateHint, natureSummary } from '@core/life/nature';
import { getPlayerMoves } from '@core/life/combat';
import { formatSkillEffects, getSkillDef } from '@data/skills/catalog';
import { rankPowerMult } from '@core/life/martialRanks';
import { displayChoiceText } from '@core/life/playerText';
import { InkScrollBackdrop, InkSealStamp, InkResultSeal } from './InkDecor';
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
  const combatMove = useLifeStore((s) => s.combatMove);
  const combatResolveFoe = useLifeStore((s) => s.combatResolveFoe);
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
    if (sealText === '勝') playInkWin();
    else if (sealText === '敗' || sealText === '終') playInkLose();
    else playInkSeal();
    const t = window.setTimeout(() => clearSeal(), 920);
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
  const gearIds = c.gear ?? [];
  const equipment = c.equipment ?? { weapon: null, armor: null, accessory: null };
  const showResult = Boolean(lastResult) && state.phase === 'playing' && !state.pendingCombat;
  const combat = state.pendingCombat ?? null;
  const practiceLeft = state.practiceActionsLeft ?? 3;
  const busy = Boolean(state.pending) || Boolean(combat) || showResult || !c.alive;
  const practiceBusy = busy || practiceLeft <= 0;
  const moves = combat ? getPlayerMoves(state) : [];
  const onPracticeTab = tab === 'practice';
  const onHomeTab = tab === 'home';
  const canAdvanceMonth =
    state.phase === 'playing' &&
    !pendingEvent &&
    !combat &&
    c.alive &&
    !showResult &&
    onHomeTab;
  const nature = ensureNature(c);
  const dominant = dominantNature(c);
  const showVitalsBars = tab === 'home' || tab === 'person' || Boolean(combat);
  const resultKind = lastResult?.title === '修煉' ? 'practice' : 'month';

  useEffect(() => {
    if (!showResult) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [showResult]);

  return (
    <div className="scroll-shell scroll-shell--play ink-enter">
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

      <div key={`${state.year}-${month}`} className="ink-scroll-flip ink-play-body">

      {onHomeTab && (
        <section className="ink-world" aria-label="近日傳聞">
          {jianghuHints(state).map((h) => (
            <p key={h} className="ink-note">
              {h}
            </p>
          ))}
        </section>
      )}

      {tab === 'jianghu' && (
        <section key="jianghu" className="ink-panel ink-world-panel ink-tab-pane" aria-label="心性">
          <h3>心性</h3>
          <p className="ink-note ink-nature-line">
            {natureKeys.map((k, i) => (
              <span
                key={k}
                className={`ink-nature-chip ink-nature--${k}${k === dominant ? ' ink-nature--dominant' : ''}`}
              >
                {i > 0 ? ' ' : ''}
                {natureLabels[k]}
                {nature[k]}
                {k === dominant ? '◆' : ''}
              </span>
            ))}
          </p>
          <p className="ink-note">{natureSummary(c)}</p>
        </section>
      )}

      <section className="ink-vitals" aria-label={showVitalsBars ? '氣血內力' : '江湖概況'}>
        {showVitalsBars && (
          <>
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
          </>
        )}
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
        <section key="person" className="ink-panel ink-attrs ink-tab-pane">
          <h3>五維</h3>
          <div className="ink-attr-grid">
            {wuxiaAttributeKeys.map((k) => (
              <div key={k} className="ink-attr">
                <span className="ink-attr-label">{wuxiaAttributeLabels[k]}</span>
                <strong>{c.attributes[k]}</strong>
              </div>
            ))}
          </div>
          <h3 className="ink-subhead">心性</h3>
          <div className="ink-attr-grid">
            {natureKeys.map((k) => (
              <div
                key={k}
                className={`ink-attr ink-nature-card ink-nature--${k}${k === dominant ? ' ink-nature--dominant' : ''}`}
              >
                <span className="ink-attr-label">
                  {natureLabels[k]}
                  {k === dominant ? ' · 獨顯' : ''}
                </span>
                <strong>{nature[k]}</strong>
              </div>
            ))}
          </div>
          <p className="ink-note">{natureSummary(c)}</p>
          <p className="ink-note">
            體力 {Math.round(c.stamina ?? 0)}/{c.maxStamina ?? 0} · 閃避約 {playerEvasionPercent(state)}%
          </p>
          <p className="ink-note">籍貫 · {c.birthplace || '千燈鎮'} · 所在 {c.location || '千燈鎮'}</p>
          {lover && <p className="ink-note">眷屬 · {lover.name}</p>}
          <p className="ink-note">
            子女 · {c.childrenCount ?? 0}/{c.childrenMax ?? 0}
            {c.family?.childrenNames?.length
              ? `（${c.family.childrenNames.join('、')}）`
              : ''}
          </p>
          {c.skills.length > 0 && (
            <ul className="ink-skill-list">
              {c.skills.map((id) => {
                const def = getSkillDef(id);
                return (
                  <li key={id}>
                    <strong>{skillDisplay(c, id)}</strong>
                    {def?.kind === 'internal' && def.passive ? (
                      <span className="ink-skill-passive"> · 內功被動</span>
                    ) : null}
                    {def?.kind === 'qinggong' && def.passive ? (
                      <span className="ink-skill-passive"> · 輕功身法</span>
                    ) : null}
                    {def?.kind === 'external' && def.move ? (
                      <span className="ink-skill-passive"> · 戰招「{def.move.name}」</span>
                    ) : null}
                    <span className="ink-gear-desc">{formatSkillEffects(id)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === 'practice' && (
        <section key="practice" className="ink-panel ink-practice ink-tab-pane">
          {practiceView === 'main' && (
            <>
              <h3>修煉</h3>
              <p className="ink-note">
                本月可修煉 {practiceLeft}/3 次。苦練、鑄兵、尋訪——階位靠實戰與修煉進境。
              </p>
              {practiceLearningHints(state).map((h) => (
                <p key={h} className="ink-note ink-hint-learn">
                  {h}
                </p>
              ))}
              <div className="ink-practice-grid">
                <button
                  type="button"
                  className="ink-practice-btn ink-practice-btn--sect"
                  disabled={practiceBusy}
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
                    disabled={practiceBusy}
                    onClick={() => practice(act.id)}
                  >
                    <strong>{act.label}</strong>
                    <span>{act.hint}</span>
                  </button>
                ))}
              </div>
              {practiceLeft <= 0 && (
                <p className="ink-note ink-note--warn">本月修煉已盡，請回「鎮居」翻過一頁。</p>
              )}
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
                        disabled={practiceBusy}
                        onClick={() => {
                          practice('join_sect', { sectId: s.id });
                          setPracticeView('main');
                        }}
                      >
                        <strong>{s.name}</strong>
                        <span>
                          {s.hint}
                          {natureGateHint(s.natureGate) ? ` · ${natureGateHint(s.natureGate)}` : ''}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className="ink-note">既入師門，差事、比武、靜修皆可磨礪身心；地位提升可傳四套門中武學。</p>
                  <ul className="ink-skill-list ink-sect-progress">
                    {describeSectProgress(state).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                  <div className="ink-practice-grid">
                    {SECT_INNER_ACTIONS.map((act) => (
                      <button
                        key={act.id}
                        type="button"
                        className="ink-practice-btn"
                        disabled={practiceBusy}
                        onClick={() => practice(act.id)}
                      >
                        <strong>{act.label}</strong>
                        <span>{act.hint}</span>
                      </button>
                    ))}
                    <button
                      type="button"
                      className="ink-practice-btn"
                      disabled={practiceBusy}
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
                  {def ? `${def.name}（${RARITY_ZH[def.rarity] ?? def.rarity}${def.weaponKind ? `·${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}）` : '空'}
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
                      <em>
                        {RARITY_ZH[def.rarity]}
                        {def.weaponKind ? ` · ${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}
                      </em>
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
                <li key={id}>
                  <strong>{skillDisplay(c, id)}</strong>
                  <span className="ink-gear-desc">{formatSkillEffects(id)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {combat && state.phase === 'playing' && (
        <section className="ink-panel ink-combat" aria-live="polite">
          <p className="ink-event-year">
            第 {combat.turn} 回合 · {combat.title}
          </p>
          <h3>交手 · {combat.foe.name}</h3>
          <div className="ink-combat-bars">
            <div>
              <div className="ink-vitals-label">
                <span>{combat.player.name}</span>
                <span>
                  氣血 {Math.round(combat.player.hp)}/{combat.player.maxHp} · 內息{' '}
                  {Math.round(combat.player.qi)}/{combat.player.maxQi}
                </span>
              </div>
              <div className="ink-bar">
                <div
                  className="ink-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.player.hp / combat.player.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="ink-vitals-label">
                <span>{combat.foe.name}</span>
                <span>
                  氣血 {Math.round(combat.foe.hp)}/{combat.foe.maxHp}
                </span>
              </div>
              <div className="ink-bar">
                <div
                  className="ink-bar-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.foe.hp / combat.foe.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>
          <p className="ink-note">
            {combat.phase === 'resolve'
              ? '勝負已分——如何處置落敗之人，亦會留在心性裡。'
              : '外功出招；守勢／蓄勢／抽身可調節奏。內功與輕功為被動。'}
          </p>
          {combat.phase === 'resolve' ? (
            <div className="ink-choice-list ink-combat-resolve">
              {(
                [
                  ['kill', '殺', '殺死', '永絕後患，戾氣難消', dominant === 'xia' ? '俠心較重，下手需自問' : ''],
                  ['release', '放', '放走', '留其一命，寬恕在胸', dominant === 'e' ? '惡念未消，放人亦是克制' : ''],
                  ['stun', '暈', '擊暈', '點穴制住，不傷性命', '戰利或略薄，心性較穩'],
                ] as const
              ).map(([id, mark, label, hint, extra], i) => (
                <button
                  key={id}
                  type="button"
                  className="ink-choice"
                  style={{ ['--i' as string]: i }}
                  onClick={() => {
                    playInkTap();
                    combatResolveFoe(id);
                  }}
                >
                  <span className="ink-choice-mark">{mark}</span>
                  <span className="ink-combat-move">
                    <strong>{label}</strong>
                    <em>
                      {hint}
                      {extra ? ` · ${extra}` : ''}
                    </em>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="ink-choice-list">
              {moves.map((mv, i) => {
                const short = combat.player.qi < mv.qiCost;
                const ownerSkill = c.skills.find((id) => getSkillDef(id)?.move?.id === mv.id);
                const rank = ownerSkill ? (c.skillRanks?.[ownerSkill] ?? 0) : 0;
                const effPower = mv.power * (ownerSkill ? rankPowerMult(rank) : 1);
                return (
                  <button
                    key={mv.id}
                    type="button"
                    className="ink-choice"
                    disabled={combat.phase !== 'player' || short}
                    style={{ ['--i' as string]: i }}
                    onClick={() => {
                      playInkTap();
                      combatMove(mv.id);
                    }}
                  >
                    <span className="ink-choice-mark">
                      {mv.id === GUARD_STANCE.id
                        ? '守'
                        : mv.id === CHARGE_STANCE.id
                          ? '蓄'
                          : mv.id === FLEE_MOVE.id
                            ? '遁'
                            : i === 0
                              ? '普'
                              : '功'}
                    </span>
                    <span className="ink-combat-move">
                      <strong>{mv.name}</strong>
                      <em>
                        {mv.qiCost > 0 ? `耗息 ${mv.qiCost}` : '無耗'} · 威能 {effPower.toFixed(2)} 倍
                        {ownerSkill && rank > 0 ? `（階位加持）` : ''}
                        {short ? ' · 內息不足' : ''}
                      </em>
                      <small>{mv.description}</small>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          <ul className="ink-combat-log">
            {combat.log.slice(-6).map((line, i) => (
              <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
            ))}
          </ul>
        </section>
      )}

      {showResult &&
        lastResult &&
        createPortal(
          <div className="ink-modal" role="dialog" aria-modal="true" aria-label="結果">
            <div className="ink-modal-card ink-result">
              <InkResultSeal text={resultKind === 'practice' ? '修' : '定'} />
              <p className="ink-event-year">
                {resultKind === 'practice' ? '修煉已定' : '本月際遇'}
              </p>
              <h3>{lastResult.title}</h3>
              <p className="ink-result-choice">你選擇：{lastResult.choiceText}</p>
              <div className="ink-result-story">
                {lastResult.feedback.split(/\n\n+/).map((para, i) => (
                  <p key={`${i}-${para.slice(0, 12)}`} className="ink-event-body">
                    {para}
                  </p>
                ))}
              </div>
              {lastResult.deltas.length > 0 && (
                <>
                  <p className="ink-result-delta-label">此局得失</p>
                  <ul className="ink-delta-list">
                    {lastResult.deltas.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </>
              )}
              <button
                type="button"
                className="ink-btn ink-btn--primary ink-btn--ack"
                onClick={() => clearResult()}
              >
                已知曉 · 掩卷
              </button>
            </div>
          </div>,
          document.body,
        )}

      {flashLines.length > 0 &&
        state.phase === 'playing' &&
        !pendingEvent &&
        !showResult &&
        !combat &&
        !onPracticeTab && (
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

      {state.phase === 'playing' && pendingEvent && !showResult && !combat && (
        <section className="ink-panel ink-event">
          <p className="ink-event-year">
            {state.year}年{month}月 · {c.age}歲
            {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
          </p>
          <h3>{displayTitle}</h3>
          {pendingEvent.body && <p className="ink-event-body">{pendingEvent.body}</p>}
          <div className="ink-choice-list">
            {pendingEvent.choices
              .filter((ch) => meetsRequirements(state, ch.requirements))
              .slice(0, 3)
              .map((ch, i) => (
              <button
                key={ch.id}
                type="button"
                className="ink-choice"
                style={{ ['--i' as string]: i }}
                onClick={() => {
                  playInkTap();
                  choose(ch.id);
                }}
              >
                <span className="ink-choice-mark">{['甲', '乙', '丙'][i] ?? '註'}</span>
                {displayChoiceText(ch.text, ch.id)}
              </button>
            ))}
          </div>
        </section>
      )}

      {canAdvanceMonth && (
        <button
          type="button"
          className="ink-btn ink-btn--primary ink-btn--year ink-btn--pulse"
          onClick={advanceMonth}
        >
          翻過一頁 · 過一月
        </button>
      )}

      {onPracticeTab && !combat && !showResult && (
        <p className="ink-note ink-note--center">修煉頁不推月曆——請回「鎮居」翻過一頁。</p>
      )}
      {(tab === 'person' || tab === 'jianghu') && !combat && !showResult && !pendingEvent && (
        <p className="ink-note ink-note--center">請回「鎮居」翻過一頁、查看年譜。</p>
      )}

      {onHomeTab && (
        <section className="ink-panel ink-chronicle">
          <h3>年譜</h3>
          <ul className="ink-log">
            {state.lifeLog.slice(0, 14).map((line, i) => (
              <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
            ))}
          </ul>
        </section>
      )}
      </div>

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
