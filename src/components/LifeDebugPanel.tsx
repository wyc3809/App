import { useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { lifeGameStateSchema } from '@interfaces/lifeEngine';
import { fullCatalog, listEligibleEvents } from '@core/life/eventEngine';
import { RANDOM_PACK_EVENTS } from '@core/life/packAdapter';
import { useLifeStore } from '../store/lifeStore';

type Props = {
  state: LifeGameState;
};

export function LifeDebugPanel({ state }: Props) {
  const importState = useLifeStore((s) => s.importState);
  const [json, setJson] = useState('');
  const catalog = fullCatalog();
  const eligible = listEligibleEvents(catalog, state);

  return (
    <section className="panel debug-panel">
      <h3>除錯面板</h3>
      <p className="muted">
        種子 {state.seed} · 月曆 {state.year}/{state.month ?? 1} · 包事件 {RANDOM_PACK_EVENTS.length} · 總庫{' '}
        {catalog.length}
      </p>
      <p className="muted">
        特殊倒數 {state.specialEventCountdown ?? '—'} · 符合條件 {eligible.length}
      </p>
      <details>
        <summary>符合事件 ID</summary>
        <code className="debug-ids">{eligible.map((e) => e.id).join(', ')}</code>
      </details>
      <details>
        <summary>匯出狀態 JSON</summary>
        <textarea
          readOnly
          className="debug-json"
          value={JSON.stringify(state, null, 2)}
          rows={6}
        />
      </details>
      <label className="debug-import">
        匯入狀態
        <textarea
          className="debug-json"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={4}
          placeholder="貼上 LifeGameState JSON"
        />
        <button
          type="button"
          className="btn-ghost"
          onClick={() => {
            try {
              const parsed = lifeGameStateSchema.parse(JSON.parse(json));
              importState(parsed as LifeGameState);
            } catch {
              alert('JSON 無效');
            }
          }}
        >
          套用
        </button>
      </label>
    </section>
  );
}
