import type { LifeGameState } from '@interfaces/lifeEngine';
import {
  bracketProgressLabel,
  canEnterHuashan,
  getHuashanSeasonKey,
  getPendingHuashanMatch,
  huashanSeasonLabel,
} from '@core/life/huashan';

type Props = {
  state: LifeGameState;
  onStart: () => void;
  onFight: () => void;
  onDismissReport: () => void;
  onCloseTournament: () => void;
};

export function InkHuashanPanel({
  state,
  onStart,
  onFight,
  onDismissReport,
  onCloseTournament,
}: Props) {
  const bracket = state.huashan;
  const season = getHuashanSeasonKey();
  const gate = canEnterHuashan(state);
  const pending = bracket ? getPendingHuashanMatch(bracket) : null;
  const lastLog = bracket?.lastDuelLog;

  return (
    <section className="ink-panel ink-huashan-panel ink-tab-pane" aria-label="華山論劍">
      <h3>華山論劍</h3>
      <p className="ink-note">
        每週一次，八強單淘汰。非即時比武，依雙方武功與招式自動推演戰報；其餘名額為江湖名手幻象。
      </p>
      <p className="ink-note ink-huashan-season">
        本週賽季：{huashanSeasonLabel(season)}
      </p>

      {!bracket && (
        <button
          type="button"
          className="ink-btn ink-btn--primary"
          disabled={!gate.ok}
          onClick={onStart}
        >
          持帖報名
        </button>
      )}
      {!bracket && !gate.ok && <p className="ink-note ink-huashan-hint">{gate.reason}</p>}

      {bracket && (
        <>
          <p className="ink-note">
            <strong>{bracketProgressLabel(bracket)}</strong>
            {bracket.status === 'active' && pending && (
              <>
                {' '}
                · 對手「{pending.foe.name}」（武學 {pending.foe.martial}）
              </>
            )}
          </p>

          {bracket.status === 'active' && pending && (
            <button type="button" className="ink-btn ink-btn--primary" onClick={onFight}>
              赴戰
            </button>
          )}

          {lastLog && lastLog.length > 0 && (
            <div className="ink-huashan-log">
              <h4 className="ink-subhead">戰報</h4>
              <pre className="ink-epitaph-text ink-huashan-pre">{lastLog.join('\n')}</pre>
              <button type="button" className="ink-btn ink-btn--quiet" onClick={onDismissReport}>
                收起戰報
              </button>
            </div>
          )}

          {bracket.status === 'completed' && (
            <button type="button" className="ink-btn ink-btn--ghost" onClick={onCloseTournament}>
              離開論劍台
            </button>
          )}
        </>
      )}
    </section>
  );
}
