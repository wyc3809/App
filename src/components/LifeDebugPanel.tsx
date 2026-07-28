import { useState } from 'react';
import type { LifeGameState } from '@interfaces/lifeEngine';
import { lifeGameStateSchema } from '@interfaces/lifeEngine';
import { EVENT_CATALOG, EVENT_COUNT } from '@data/events/catalog';
import { listEligibleEvents } from '@core/life/eventEngine';
import { useLifeStore } from '../store/lifeStore';

type Props = {
  state: LifeGameState;
};

export function LifeDebugPanel({ state }: Props) {
  const importState = useLifeStore((s) => s.importState);
  const [json, setJson] = useState('');
  const eligible = listEligibleEvents(EVENT_CATALOG, state);

  return (
    <section className="panel debug-panel">
      <h3>除錯面板</h3>
      <p className="muted">
        種子 {state.seed} · RNG {state.rngState.slice(0, 12)}… · 事件庫 {EVENT_COUNT}
      </p>
      <p className="muted">當前符合條件事件：{eligible.length}</p>
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
              importState(parsed);
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
