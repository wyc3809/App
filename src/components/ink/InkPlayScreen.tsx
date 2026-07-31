import { useEffect, useRef, useState } from 'react';
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
import { getGearDef, WEAPON_KIND_LABEL, formatGearCombatLine, formatGearStatLine } from '@data/equipment/catalog';
import { gearTotals, sumGearCombatBonuses, previewEquipDelta, combatPowerScore } from '@core/life/equipment';
import { overallMartialLabel, skillDisplay } from '@core/life/flavor';
import { jianghuHints, playerEvasionPercent, practiceLearningHints } from '@core/life/jianghuHints';
import { meetsRequirements } from '@core/life/requirements';
import { GUARD_STANCE, CHARGE_STANCE } from '@data/skills/catalog';
import { playInkSeal, playInkWin, playInkLose, isInkAudioMuted, toggleInkAudioMuted } from '../../audio/inkAudio';
import { describeSectProgress } from '@core/life/sectStanding';
import { ensureNature, dominantNature, natureGateHint, natureSummary } from '@core/life/nature';
import { getPlayerMoves } from '@core/life/combat';
import {
  COMBAT_TECHNIQUE_ROLES,
  combatMoveRole,
  formatCombatMoveCompact,
  formatSkillEffects,
  getSkillDef,
  isCombatActionMove,
  type CombatMoveRole,
} from '@data/skills/catalog';
import { rankPowerMult } from '@core/life/martialRanks';
import { displayChoiceText } from '@core/life/playerText';
import { coachCopy, nextCoachStep } from '@core/life/tutorial';
import { track } from '../../telemetry/events';
import { InkScrollBackdrop, InkSealStamp, InkResultSeal } from './InkDecor';
import { InkHuashanPanel } from './InkHuashanPanel';
import { LifeDebugPanel } from '../LifeDebugPanel';

type Props = {
  state: LifeGameState;
};

/** 血條下「最新戰況」：取自己／敵人各最近一條主動作（最多兩條） */
function recentExchangeBeats(log: string[], playerName: string, foeName: string): string[] {
  let playerIdx = -1;
  let foeIdx = -1;
  for (let i = log.length - 1; i >= 0; i -= 1) {
    const line = log[i]!;
    if (line.startsWith('【')) continue;
    const isAction =
      line.includes('「') ||
      /收招守中|蓄勢待發|抽身|使不出來|截住去路|動作遲滯|氣息陡變/.test(line);
    if (!isAction) continue;
    if (playerIdx < 0 && (line.startsWith(playerName) || line.startsWith('你'))) {
      playerIdx = i;
    } else if (foeIdx < 0 && line.startsWith(foeName)) {
      foeIdx = i;
    }
    if (playerIdx >= 0 && foeIdx >= 0) break;
  }
  const idxs = [playerIdx, foeIdx].filter((i) => i >= 0).sort((a, b) => a - b);
  if (idxs.length) return idxs.map((i) => log[i]!);
  return log.filter((l) => !l.startsWith('【')).slice(-2);
}


type PracticeView = 'main' | 'sect';
type CombatRoleFilter = 'all' | CombatMoveRole;

const RARITY_ZH: Record<string, string> = {
  common: '凡',
  fine: '良',
  rare: '珍',
  epic: '奇',
  divine: '神',
};

export function InkPlayScreen({ state }: Props) {
  const choose = useLifeStore((s) => s.choose);
  const dismissEvent = useLifeStore((s) => s.dismissEvent);
  const dismissCoach = useLifeStore((s) => s.dismissCoach);
  const advanceMonth = useLifeStore((s) => s.advanceMonth);
  const reincarnate = useLifeStore((s) => s.reincarnate);
  const practice = useLifeStore((s) => s.practice);
  const combatMove = useLifeStore((s) => s.combatMove);
  const combatResolveFoe = useLifeStore((s) => s.combatResolveFoe);
  const clearResult = useLifeStore((s) => s.clearResult);
  const lastResult = useLifeStore((s) => s.lastResult);
  const saveLabel = useLifeStore((s) => s.saveLabel);
  const debugOpen = useLifeStore((s) => s.debugOpen);
  const setDebugOpen = useLifeStore((s) => s.setDebugOpen);
  const setTab = useLifeStore((s) => s.setTab);
  const huashanStart = useLifeStore((s) => s.huashanStart);
  const huashanFight = useLifeStore((s) => s.huashanFight);
  const huashanDismissReport = useLifeStore((s) => s.huashanDismissReport);
  const huashanClose = useLifeStore((s) => s.huashanClose);
  const equipOwned = useLifeStore((s) => s.equipOwned);
  const sealText = useLifeStore((s) => s.sealText);
  const flashLines = useLifeStore((s) => s.flashLines);
  const clearSeal = useLifeStore((s) => s.clearSeal);
  const [practiceView, setPracticeView] = useState<PracticeView>('main');
  const [combatRoleFilter, setCombatRoleFilter] = useState<CombatRoleFilter>('all');
  const [combatLogOpen, setCombatLogOpen] = useState(false);
  const [combatFiltersOpen, setCombatFiltersOpen] = useState(false);
  const [chronicleOpen, setChronicleOpen] = useState(() => (state.character.stats.monthsLived ?? 0) < 3);
  const [hintsOpen, setHintsOpen] = useState(false);
  const [expandedMoveId, setExpandedMoveId] = useState<string | null>(null);
  const [previewGearId, setPreviewGearId] = useState<string | null>(null);
  const [audioMuted, setAudioMuted] = useState(() => isInkAudioMuted());
  const combatBeatRef = useRef<HTMLDivElement | null>(null);
  const resultAckRef = useRef<HTMLButtonElement | null>(null);

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

  useEffect(() => {
    setCombatRoleFilter('all');
    setCombatLogOpen(false);
    setCombatFiltersOpen(false);
    setExpandedMoveId(null);
  }, [state.pendingCombat?.id]);

  useEffect(() => {
    if (!state.pendingCombat?.log?.length) return;
    window.requestAnimationFrame(() => {
      combatBeatRef.current?.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    });
  }, [state.pendingCombat?.log?.length]);

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
  const techniqueMoves = moves.filter((mv) => !isCombatActionMove(mv.id));
  const actionMoves = moves.filter((mv) => isCombatActionMove(mv.id));
  const equippedWeapon = equipment.weapon ? getGearDef(equipment.weapon) : undefined;
  const gearStatTotals = gearTotals(c);
  const gearFxTotals = sumGearCombatBonuses(c);
  const sortedTechniques = [...techniqueMoves].sort((a, b) => {
    const skillOf = (moveId: string) => c.skills.find((id) => getSkillDef(id)?.move?.id === moveId);
    const score = (mv: (typeof techniqueMoves)[number]) => {
      const short = combat ? combat.player.qi < mv.qiCost : true;
      const sid = skillOf(mv.id);
      const def = sid ? getSkillDef(sid) : undefined;
      const match = Boolean(def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind);
      let s = 0;
      if (!short) s += 100;
      if (match) s += 40;
      if (mv.id === 'basic_strike') s += 10;
      s += (mv.power ?? 0) * 5;
      return s;
    };
    return score(b) - score(a);
  });
  const visibleTechniques =
    combatRoleFilter === 'all'
      ? sortedTechniques
      : sortedTechniques.filter((mv) => combatMoveRole(mv) === combatRoleFilter);
  const roleCounts = COMBAT_TECHNIQUE_ROLES.reduce(
    (acc, role) => {
      acc[role] = techniqueMoves.filter((mv) => combatMoveRole(mv) === role).length;
      return acc;
    },
    {} as Record<CombatMoveRole, number>,
  );
  const latestBeats =
    combat?.log?.length
      ? recentExchangeBeats(combat.log, combat.player.name, combat.foe.name)
      : [];
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
  /** 交手中隱藏全局氣血條，避免與戰鬥血條重複 */
  const showVitalsBars = !combat && (tab === 'home' || tab === 'person');
  const showStatStrip = !combat;
  const homeHints = onHomeTab ? jianghuHints(state) : [];
  const resultKind = lastResult?.title === '修煉' ? 'practice' : 'month';

  useEffect(() => {
    if (!showResult) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearResult();
    };
    window.addEventListener('keydown', onKey);
    window.requestAnimationFrame(() => resultAckRef.current?.focus());
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [showResult, clearResult]);

  const eligibleChoices =
    pendingEvent?.choices.filter((ch) => meetsRequirements(state, ch.requirements)).slice(0, 3) ?? [];
  const coachStep = nextCoachStep(c.flags);
  const coach = coachCopy(coachStep);
  const showCoach =
    onHomeTab &&
    !combat &&
    !showResult &&
    state.phase === 'playing' &&
    Boolean(coach) &&
    !c.flags.coach_done;

  return (
    <div className={`scroll-shell scroll-shell--play ink-enter${combat ? ' scroll-shell--combat' : ''}`}>
      <InkScrollBackdrop variant="play" quiet={Boolean(combat)} />
      {sealText && <InkSealStamp text={sealText} onDone={clearSeal} />}

      <header className="ink-status">
        <div>
          <h2 className="ink-name">{c.name}</h2>
          <p className="ink-meta">
            {c.age} 歲 · {stage} · {state.year}年{month}月（{seasonLabel(month)}）
            {sect ? ` · ${sect.name}` : ''}
          </p>
        </div>
        <div className="ink-status-actions">
          <button
            type="button"
            className="ink-icon-btn"
            onClick={() => {
              const next = toggleInkAudioMuted();
              setAudioMuted(next);
              track('audio_mute_toggle', { muted: next });
            }}
            title={audioMuted ? '開聲' : '靜音'}
            aria-pressed={audioMuted}
            aria-label={audioMuted ? '開聲' : '靜音'}
          >
            {audioMuted ? '默' : '聲'}
          </button>
          {import.meta.env.DEV && (
            <button
              type="button"
              className="ink-icon-btn"
              onClick={() => {
                setDebugOpen(!debugOpen);
              }}
              title="除錯"
            >
              墨
            </button>
          )}
        </div>
      </header>

      {saveLabel && <p className="ink-save">已落筆 {saveLabel}</p>}

      {!combat && (
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
              onClick={() => {
                setTab(id);
              }}
            >
              {label}
            </button>
          ))}
        </nav>
      )}

      <div className="ink-play-body">

      {/* 鎮居首屏：事件／翻頁優先於儀表與年譜 */}
      {onHomeTab && !combat && (
        <div key={`${state.year}-${month}`} className="ink-home-focus ink-scroll-flip">
          {showCoach && coach && (
            <section className="ink-coach" aria-live="polite">
              <h3>{coach.title}</h3>
              <p>{coach.body}</p>
              <button type="button" className="ink-btn ink-btn--ghost" onClick={() => dismissCoach()}>
                已知曉
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

          {state.phase === 'playing' && pendingEvent && !showResult && (
            <section className="ink-panel ink-event">
              <p className="ink-event-year">
                {state.year}年{month}月 · {c.age}歲
                {state.pending?.kind === 'special' ? ' · 奇遇' : ''}
              </p>
              <h3>{displayTitle}</h3>
              {pendingEvent.body && <p className="ink-event-body">{pendingEvent.body}</p>}
              <div className="ink-choice-list">
                {eligibleChoices.map((ch, i) => (
                  <button
                    key={ch.id}
                    type="button"
                    className="ink-choice"
                    style={{ ['--i' as string]: i }}
                    onClick={() => {
                      choose(ch.id);
                    }}
                  >
                    <span className="ink-choice-mark">{['甲', '乙', '丙'][i] ?? '註'}</span>
                    {displayChoiceText(ch.text, ch.id)}
                  </button>
                ))}
                {eligibleChoices.length === 0 && (
                  <button type="button" className="ink-choice" onClick={() => dismissEvent()}>
                    <span className="ink-choice-mark">避</span>
                    暫避鋒芒（此刻無可行之選）
                  </button>
                )}
              </div>
            </section>
          )}

          {canAdvanceMonth && (
            <button
              type="button"
              className="ink-btn ink-btn--primary ink-btn--year ink-btn--pulse"
              onClick={() => {
                advanceMonth();
              }}
            >
              翻過一頁 · 過一月
            </button>
          )}

          {homeHints.length > 0 && (
            <section className="ink-world" aria-label="近日傳聞">
              <p className="ink-note">{homeHints[0]}</p>
              {homeHints.length > 1 && (
                <button
                  type="button"
                  className="ink-btn ink-btn--quiet ink-toggle-quiet"
                  onClick={() => {
                    setHintsOpen((v) => !v);
                  }}
                >
                  {hintsOpen ? '收起傳聞' : `更多傳聞（${homeHints.length - 1}）`}
                </button>
              )}
              {hintsOpen &&
                homeHints.slice(1).map((h) => (
                  <p key={h} className="ink-note">
                    {h}
                  </p>
                ))}
            </section>
          )}
        </div>
      )}

      {showStatStrip && (
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
                <div className="ink-bar-fill ink-bar-fill--live" style={{ width: `${hpPct}%` }} />
              </div>
              <div className="ink-vitals-label">
                <span>內力</span>
                <span>
                  {Math.round(c.qi ?? 0)}/{c.maxQi ?? 0}
                </span>
              </div>
              <div className="ink-bar ink-bar--qi">
                <div className="ink-bar-fill ink-bar-fill--qi ink-bar-fill--live" style={{ width: `${qiPct}%` }} />
              </div>
            </>
          )}
          <div className="ink-stat-row">
            <span>銀兩 {c.money}</span>
            <span>名望 {c.reputation}</span>
            <span>
              武學 {c.martial}·{overallMartialLabel(c)}
            </span>
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
      )}

      {tab === 'jianghu' && !combat && (
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

      {tab === 'jianghu' && !combat && (
        <InkHuashanPanel
          state={state}
          onStart={huashanStart}
          onFight={huashanFight}
          onDismissReport={huashanDismissReport}
          onCloseTournament={huashanClose}
        />
      )}

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
                本月可修煉 {practiceLeft}/3 次。打聽傳聞可提高翻頁遇首領／奇遇的機率；苦練、鑄兵、尋訪會在翻頁時隨機遇上。
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
                  onClick={() => {
                    setPracticeView('sect');
                  }}
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
                    onClick={() => {
                      practice(act.id);
                    }}
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
                        onClick={() => {
                          practice(act.id);
                        }}
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
          <p className="ink-note ink-gear-totals">
            披掛合計：戰力 {combatPowerScore(c)} ·{' '}
            {[
              gearStatTotals.attack ? `攻+${gearStatTotals.attack}` : '',
              gearStatTotals.defense ? `防+${gearStatTotals.defense}` : '',
              gearStatTotals.maxHpBonus ? `氣血上限+${gearStatTotals.maxHpBonus}` : '',
              gearStatTotals.maxQiBonus ? `內力上限+${gearStatTotals.maxQiBonus}` : '',
              gearStatTotals.martialBonus ? `武學+${gearStatTotals.martialBonus}` : '',
              gearFxTotals.hitBonus ? `命中+${Math.round(gearFxTotals.hitBonus * 100)}%` : '',
              gearFxTotals.evasion ? `閃避+${Math.round(gearFxTotals.evasion * 100)}%` : '',
              gearFxTotals.reflect ? `反震${Math.round(gearFxTotals.reflect * 100)}%` : '',
              gearFxTotals.pierce ? `破防${Math.round(gearFxTotals.pierce * 100)}%` : '',
              gearFxTotals.lifesteal ? `吸血${Math.round(gearFxTotals.lifesteal * 100)}%` : '',
              gearFxTotals.bleedChance ? `流血${Math.round(gearFxTotals.bleedChance * 100)}%` : '',
            ]
              .filter(Boolean)
              .join(' · ') || '無加成'}
          </p>
          <div className="ink-gear-equipped">
            {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
              const id = equipment[slot];
              const def = id ? getGearDef(id) : null;
              const stats = def ? formatGearStatLine(def) : '';
              const fx = def ? formatGearCombatLine(def) : '';
              return (
                <p key={slot} className="ink-note">
                  {slot === 'weapon' ? '兵刃' : slot === 'armor' ? '護體' : '佩飾'} ·{' '}
                  {def
                    ? `${def.name}（${RARITY_ZH[def.rarity] ?? def.rarity}${def.weaponKind ? `·${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}）`
                    : '空'}
                  {stats && <span className="ink-gear-stat"> — {stats}</span>}
                  {fx && <span className="ink-gear-fx"> {fx}</span>}
                </p>
              );
            })}
          </div>
          {gearIds.length > 0 && (
            <ul className="ink-gear-list">
              {gearIds.map((id) => {
                const def = getGearDef(id);
                if (!def) return null;
                const equipped = equipment[def.slot] === id;
                const preview = previewGearId === id ? previewEquipDelta(c, id) : null;
                return (
                  <li key={id} className={equipped ? 'ink-gear-item ink-gear-item--on' : 'ink-gear-item'}>
                    <span>
                      {def.name}
                      <em>
                        {RARITY_ZH[def.rarity]}
                        {def.weaponKind ? ` · ${WEAPON_KIND_LABEL[def.weaponKind]}` : ''}
                        {equipped ? ' · 已披' : ''}
                      </em>
                    </span>
                    {formatGearStatLine(def) && (
                      <span className="ink-gear-stat">{formatGearStatLine(def)}</span>
                    )}
                    {formatGearCombatLine(def) && (
                      <span className="ink-gear-fx">{formatGearCombatLine(def)}</span>
                    )}
                    <span className="ink-gear-desc">{def.description}</span>
                    <div className="ink-gear-actions">
                      {!equipped && (
                        <button
                          type="button"
                          className="ink-btn ink-btn--quiet"
                          disabled={busy}
                          onClick={() => {
                            setPreviewGearId(previewGearId === id ? null : id);
                          }}
                        >
                          {previewGearId === id ? '收起對照' : '預覽'}
                        </button>
                      )}
                      <button
                        type="button"
                        className="ink-btn ink-btn--quiet"
                        disabled={busy || equipped}
                        onClick={() => {
                          setPreviewGearId(null);
                          equipOwned(id);
                        }}
                      >
                        {equipped ? '已裝備' : '裝備'}
                      </button>
                    </div>
                    {preview && !preview.alreadyEquipped && (
                      <p className={`ink-gear-preview${preview.powerDelta >= 0 ? ' ink-gear-preview--up' : ' ink-gear-preview--down'}`}>
                        換上後：{preview.summary}
                      </p>
                    )}
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
                <span>{combat.foe.name}</span>
                <span>
                  氣血 {Math.round(combat.foe.hp)}/{combat.foe.maxHp}
                </span>
              </div>
              <div className="ink-bar">
                <div
                  className="ink-bar-fill ink-bar-fill--foe ink-bar-fill--live"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.foe.hp / combat.foe.maxHp) * 100))}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="ink-vitals-label">
                <span>{combat.player.name}</span>
                <span>
                  氣血 {Math.round(combat.player.hp)}/{combat.player.maxHp} · 內力{' '}
                  {Math.round(combat.player.qi)}/{combat.player.maxQi}
                </span>
              </div>
              <div className="ink-bar">
                <div
                  className="ink-bar-fill ink-bar-fill--live"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.player.hp / combat.player.maxHp) * 100))}%`,
                  }}
                />
              </div>
              <div className="ink-bar ink-bar--qi">
                <div
                  className="ink-bar-fill ink-bar-fill--qi ink-bar-fill--live"
                  style={{
                    width: `${Math.max(0, Math.min(100, (combat.player.qi / Math.max(1, combat.player.maxQi)) * 100))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {latestBeats.length > 0 && (
            <div
              ref={combatBeatRef}
              key={`${combat.turn}-${latestBeats.map((b) => b.slice(0, 12)).join('|')}`}
              className="ink-combat-beat"
            >
              {latestBeats.map((beat, i) => (
                <p key={`${i}-${beat.slice(0, 16)}`} className="ink-combat-beat-line">
                  {beat}
                </p>
              ))}
            </div>
          )}

          <button
            type="button"
            className="ink-combat-log-toggle"
            onClick={() => {
              setCombatLogOpen((v) => !v);
            }}
          >
            {combatLogOpen ? '收起戰報' : `戰報（${combat.log.length}）`}
          </button>
          {combatLogOpen && (
            <ul className="ink-combat-log">
              {combat.log.slice(-10).map((line, i) => (
                <li key={`${i}-${line.slice(0, 12)}`}>{line}</li>
              ))}
            </ul>
          )}

          {combat.phase === 'resolve' ? (
            <>
              <p className="ink-note">勝負已分——如何處置落敗之人，亦會留在心性裡。</p>
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
            </>
          ) : (
            <>
              <button
                type="button"
                className="ink-combat-log-toggle"
                onClick={() => {
                  setCombatFiltersOpen((v) => !v);
                }}
              >
                {combatFiltersOpen ? '收起篩選' : '招式篩選'}
              </button>
              {combatFiltersOpen && (
                <>
                  <p className="ink-note">
                    以角色篩選招式；兵刃契合與內力足夠者排前。行動在下方。
                  </p>
                  <div className="ink-combat-filters" role="tablist" aria-label="招式篩選">
                    <button
                      type="button"
                      className={`ink-combat-filter${combatRoleFilter === 'all' ? ' ink-combat-filter--on' : ''}`}
                      onClick={() => {
                        setCombatRoleFilter('all');
                      }}
                    >
                      全部 {techniqueMoves.length}
                    </button>
                    {COMBAT_TECHNIQUE_ROLES.filter((role) => (roleCounts[role] ?? 0) > 0).map((role) => (
                      <button
                        key={role}
                        type="button"
                        className={`ink-combat-filter${combatRoleFilter === role ? ' ink-combat-filter--on' : ''}`}
                        onClick={() => {
                          setCombatRoleFilter(role);
                        }}
                      >
                        {role} {roleCounts[role]}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <div className="ink-choice-list ink-combat-moves">
                {visibleTechniques.map((mv, i) => {
                  const short = combat.player.qi < mv.qiCost;
                  const ownerSkill = c.skills.find((id) => getSkillDef(id)?.move?.id === mv.id);
                  const rank = ownerSkill ? (c.skillRanks?.[ownerSkill] ?? 0) : 0;
                  const effPower = mv.power * (ownerSkill ? rankPowerMult(rank) : 1);
                  const role = combatMoveRole(mv);
                  const def = ownerSkill ? getSkillDef(ownerSkill) : undefined;
                  const matched = Boolean(
                    def?.weaponKind && equippedWeapon?.weaponKind === def.weaponKind,
                  );
                  const expanded = expandedMoveId === mv.id;
                  return (
                    <div key={mv.id} className="ink-combat-move-row">
                      <button
                        type="button"
                        className={`ink-choice ink-choice--compact${matched ? ' ink-choice--match' : ''}`}
                        disabled={combat.phase !== 'player' || short}
                        style={{ ['--i' as string]: i }}
                        onClick={() => {
                          combatMove(mv.id);
                        }}
                      >
                        <span className="ink-choice-mark">{role}</span>
                        <span className="ink-combat-move">
                          <strong>
                            {mv.name}
                            {matched ? ' · 契' : ''}
                            {short ? ' · 不足' : ''}
                          </strong>
                          <em>{formatCombatMoveCompact(mv, effPower)}</em>
                        </span>
                      </button>
                      <button
                        type="button"
                        className="ink-combat-detail-btn"
                        aria-expanded={expanded}
                        onClick={() => {
                          setExpandedMoveId(expanded ? null : mv.id);
                        }}
                      >
                        {expanded ? '收' : '詳'}
                      </button>
                      {expanded && (
                        <p className="ink-combat-move-detail">
                          {mv.description}
                          {ownerSkill && rank > 0 ? ' · 階位加持' : ''}
                          {def?.weaponKind
                            ? ` · 宜${WEAPON_KIND_LABEL[def.weaponKind] ?? def.weaponKind}`
                            : ''}
                        </p>
                      )}
                    </div>
                  );
                })}
                {visibleTechniques.length === 0 && (
                  <p className="ink-note">此類暫無招式，可切回「全部」。</p>
                )}
              </div>

              <div className="ink-combat-actions">
                <p className="ink-combat-group-label">行動</p>
                <div className="ink-combat-action-bar">
                  {actionMoves.map((mv) => {
                    const short = combat.player.qi < mv.qiCost;
                    const mark =
                      mv.id === GUARD_STANCE.id ? '守' : mv.id === CHARGE_STANCE.id ? '蓄' : '遁';
                    return (
                      <button
                        key={mv.id}
                        type="button"
                        className="ink-combat-action"
                        disabled={combat.phase !== 'player' || short}
                        title={mv.description}
                        onClick={() => {
                          combatMove(mv.id);
                        }}
                      >
                        <strong>
                          {mark} {mv.name}
                        </strong>
                        <span>
                          {mv.id === GUARD_STANCE.id
                            ? '回息守中'
                            : mv.id === CHARGE_STANCE.id
                              ? `耗${mv.qiCost} · 下一擊加威`
                              : '伺機離場'}
                          {short ? ' · 不足' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {showResult &&
        lastResult &&
        createPortal(
          <div className="ink-modal" role="dialog" aria-modal="true" aria-label="結果">
            <div className="ink-modal-card ink-result">
              <InkResultSeal text={resultKind === 'practice' ? '修' : lastResult.title === '整裝' ? '裝' : '定'} />
              <p className="ink-event-year">
                {resultKind === 'practice'
                  ? '修煉已定'
                  : lastResult.title === '整裝'
                    ? '披掛已定'
                    : '本月際遇'}
              </p>
              <h3>{lastResult.title}</h3>
              <p className="ink-result-choice">你選擇：{lastResult.choiceText}</p>
              <div className="ink-result-story">
                <p className="ink-result-story-label">經過</p>
                {lastResult.feedback.split(/\n\n+/).map((para, i) => (
                  <p key={`${i}-${para.slice(0, 12)}`} className="ink-event-body">
                    {para}
                  </p>
                ))}
              </div>
              {lastResult.deltas.length > 0 && (
                <div className="ink-result-deltas">
                  <p className="ink-result-delta-label">此局得失</p>
                  <ul className="ink-delta-list">
                    {lastResult.deltas.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button
                type="button"
                className="ink-btn ink-btn--primary ink-btn--ack"
                ref={resultAckRef}
                onClick={() => {
                  clearResult();
                }}
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
        !onHomeTab &&
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
          <button type="button" className="ink-btn ink-btn--primary" onClick={() => reincarnate()}>
            轉世再入江湖
          </button>
          <p className="ink-note ink-note--center">
            前世武學餘韻
            {c.flags.family_legacy || c.flags.legacy_teacher
              ? `與${[c.flags.family_legacy ? '族規' : '', c.flags.legacy_teacher ? '傳功' : ''].filter(Boolean).join('、')}`
              : ''}
            將淡淡帶入來世。
          </p>
        </section>
      )}

      {onPracticeTab && !combat && !showResult && (
        <p className="ink-note ink-note--center">修煉頁不推月曆——請回「鎮居」翻過一頁。</p>
      )}
      {(tab === 'person' || tab === 'jianghu') && !combat && !showResult && !pendingEvent && (
        <p className="ink-note ink-note--center">請回「鎮居」翻過一頁、查看年譜。</p>
      )}

      {onHomeTab && !combat && (
        <section className="ink-panel ink-chronicle">
          <button
            type="button"
            className="ink-chronicle-toggle"
            onClick={() => {
              setChronicleOpen((v) => !v);
            }}
            aria-expanded={chronicleOpen}
          >
            <h3>年譜</h3>
            <span>{chronicleOpen ? '收起' : `展開（${Math.min(14, state.lifeLog.length)}）`}</span>
          </button>
          {chronicleOpen && (
            <ul className="ink-log">
              {state.lifeLog.slice(0, 14).map((line, i) => (
                <li key={`${i}-${line.slice(0, 16)}`}>{line}</li>
              ))}
            </ul>
          )}
        </section>
      )}
      </div>

      {debugOpen && <LifeDebugPanel state={state} />}
    </div>
  );
}
