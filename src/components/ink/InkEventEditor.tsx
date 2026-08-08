import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { rawCatalog, getRawEventById } from '@core/life/eventEngine';
import { filterEventsForEditor, isEventEditorExcluded } from '@core/life/eventEditorScope';
import {
  type ChoicePatch,
  type EventPatch,
  clearAllEventPatches,
  draftPatchFromEvent,
  exportEventOverrideStore,
  getEventOverrideStore,
  importEventOverrideStore,
  listPatchedEventIds,
  loadEventOverrides,
  removeEventPatch,
  saveEventPatch,
  subscribeEventOverrides,
} from '@core/life/eventOverrides';

type Props = {
  onClose: () => void;
};

type Filter = 'all' | 'patched' | 'special' | 'ordinary';

function useOverrideTick() {
  return useSyncExternalStore(
    subscribeEventOverrides,
    () => getEventOverrideStore().updatedAt,
    () => 0,
  );
}

function numOrEmpty(v: number | undefined): string {
  return v === undefined || Number.isNaN(v) ? '' : String(v);
}

function parseOptionalInt(raw: string): number | undefined {
  const t = raw.trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? Math.round(n) : undefined;
}

function isSpecialEvent(id: string, tags?: string[]): boolean {
  if (tags?.includes('special') || tags?.includes('secret') || tags?.includes('boss')) return true;
  return /^(secret_|boss_|jy_|jx_|pack_)/.test(id);
}

export function InkEventEditor({ onClose }: Props) {
  const tick = useOverrideTick();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EventPatch | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadEventOverrides();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const patchedSet = useMemo(() => new Set(listPatchedEventIds()), [tick]);

  const catalog = useMemo(() => filterEventsForEditor(rawCatalog()), []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return catalog.filter((ev) => {
      if (filter === 'patched' && !patchedSet.has(ev.id)) return false;
      if (filter === 'special' && !isSpecialEvent(ev.id, ev.tags)) return false;
      if (filter === 'ordinary' && isSpecialEvent(ev.id, ev.tags)) return false;
      if (!needle) return true;
      return (
        ev.id.toLowerCase().includes(needle) ||
        ev.title.toLowerCase().includes(needle) ||
        (ev.body ?? '').toLowerCase().includes(needle)
      );
    });
  }, [catalog, q, filter, patchedSet]);

  useEffect(() => {
    if (!selectedId) {
      setDraft(null);
      return;
    }
    const raw = getRawEventById(selectedId);
    if (!raw || isEventEditorExcluded(raw)) {
      setSelectedId(null);
      setDraft(null);
      return;
    }
    setDraft(draftPatchFromEvent(raw));
  }, [selectedId, tick]);

  const flash = (msg: string) => setToast(msg);

  const updateChoice = (choiceId: string, patch: Partial<ChoicePatch>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const cur = prev.choices?.[choiceId] ?? {};
      return {
        ...prev,
        choices: {
          ...(prev.choices ?? {}),
          [choiceId]: { ...cur, ...patch },
        },
      };
    });
  };

  const handleSave = () => {
    if (!selectedId || !draft) return;
    saveEventPatch(selectedId, draft);
    flash('已存本地 · 下月抽卡即生效');
  };

  const handleRevert = () => {
    if (!selectedId) return;
    removeEventPatch(selectedId);
    const raw = getRawEventById(selectedId);
    if (raw) setDraft(draftPatchFromEvent(raw));
    flash('已還原此事件');
  };

  const handleExport = async () => {
    const text = exportEventOverrideStore();
    try {
      if (navigator.share) {
        const file = new File([text], 'jianghu-event-overrides.json', { type: 'application/json' });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: '江湖事件覆寫' });
          flash('已分享覆寫檔');
          return;
        }
        await navigator.share({ text, title: '江湖事件覆寫' });
        flash('已分享文字');
        return;
      }
    } catch {
      /* fall through */
    }
    try {
      await navigator.clipboard.writeText(text);
      flash('已複製到剪貼簿');
    } catch {
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'jianghu-event-overrides.json';
      a.click();
      URL.revokeObjectURL(url);
      flash('已下載 JSON');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setBusy(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text) as unknown;
        const res = importEventOverrideStore(parsed);
        flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
      } catch (e) {
        flash(e instanceof Error ? e.message : '匯入失敗');
      } finally {
        setBusy(false);
      }
    };
    input.click();
  };

  const handlePasteImport = async () => {
    const text = window.prompt('貼上覆寫 JSON（version:1 + patches）');
    if (!text?.trim()) return;
    try {
      const res = importEventOverrideStore(JSON.parse(text));
      flash(res.ok ? `已匯入 ${res.count} 則` : res.error);
    } catch (e) {
      flash(e instanceof Error ? e.message : 'JSON 無效');
    }
  };

  const handleClearAll = () => {
    if (!window.confirm('清空全部本地覆寫？原版事件會恢復。')) return;
    clearAllEventPatches();
    if (selectedId) {
      const raw = getRawEventById(selectedId);
      if (raw) setDraft(draftPatchFromEvent(raw));
    }
    flash('已清空覆寫');
  };

  const rawSelected = selectedId ? getRawEventById(selectedId) : undefined;

  return (
    <div className="scroll-shell ink-enter ink-editor">
      <InkScrollBackdrop variant="play" />
      <header className="ink-editor-head">
        <button type="button" className="ink-btn ink-btn--quiet ink-editor-back" onClick={onClose}>
          回卷
        </button>
        <div>
          <h1 className="ink-editor-title">事件編修</h1>
          <p className="ink-editor-sub">
            改標題／正文／選項／數值 · 存手機本地 · 已改 {patchedSet.size} 則
          </p>
        </div>
      </header>

      {!selectedId ? (
        <>
          <label className="ink-field">
            <span>搜尋</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="標題、正文或 id"
              enterKeyHint="search"
            />
          </label>
          <div className="ink-editor-filters" role="tablist" aria-label="篩選">
            {(
              [
                ['all', '全部'],
                ['patched', '已改'],
                ['special', '奇遇'],
                ['ordinary', '日常'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={filter === id}
                className={`ink-tab${filter === id ? ' ink-tab--active' : ''}`}
                onClick={() => setFilter(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="ink-editor-toolbar">
            <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={() => void handleExport()}>
              匯出
            </button>
            <button type="button" className="ink-btn ink-btn--ghost" disabled={busy} onClick={handleImport}>
              匯入檔
            </button>
            <button type="button" className="ink-btn ink-btn--quiet" disabled={busy} onClick={() => void handlePasteImport()}>
              貼上
            </button>
            <button type="button" className="ink-btn ink-btn--quiet" onClick={handleClearAll}>
              清空
            </button>
          </div>
          <ul className="ink-editor-list">
            {filtered.slice(0, 200).map((ev) => (
              <li key={ev.id}>
                <button type="button" className="ink-editor-row" onClick={() => setSelectedId(ev.id)}>
                  <span className="ink-editor-row-title">
                    {ev.title}
                    {patchedSet.has(ev.id) ? <em className="ink-editor-badge">改</em> : null}
                  </span>
                  <span className="ink-editor-row-id">{ev.id}</span>
                </button>
              </li>
            ))}
          </ul>
          {filtered.length > 200 ? (
            <p className="ink-note">只顯示前 200 則，請再收窄搜尋。</p>
          ) : filtered.length === 0 ? (
            <p className="ink-note">無符合事件。</p>
          ) : null}
        </>
      ) : (
        <>
          <button type="button" className="ink-btn ink-btn--quiet" onClick={() => setSelectedId(null)}>
            ← 事件列表
          </button>
          <p className="ink-editor-id">{selectedId}</p>
          {draft && rawSelected ? (
            <div className="ink-editor-form">
              <label className="ink-field">
                <span>標題</span>
                <input
                  value={draft.title ?? ''}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </label>
              <label className="ink-field">
                <span>正文</span>
                <textarea
                  className="ink-editor-textarea"
                  rows={4}
                  value={draft.body ?? ''}
                  onChange={(e) => setDraft({ ...draft, body: e.target.value })}
                />
              </label>
              <label className="ink-field">
                <span>抽中權重（越大越易抽到；0＝停用）</span>
                <input
                  inputMode="numeric"
                  value={numOrEmpty(draft.weight)}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      weight: parseOptionalInt(e.target.value) ?? 0,
                    })
                  }
                />
              </label>
              <label className="ink-editor-check">
                <input
                  type="checkbox"
                  checked={Boolean(draft.disabled)}
                  onChange={(e) => setDraft({ ...draft, disabled: e.target.checked })}
                />
                <span>停用此事件</span>
              </label>

              {rawSelected.choices.map((ch) => {
                const cp = draft.choices?.[ch.id] ?? {};
                return (
                  <fieldset key={ch.id} className="ink-editor-choice">
                    <legend>選項 · {ch.id}</legend>
                    <label className="ink-field">
                      <span>按鈕文字</span>
                      <input
                        value={cp.text ?? ''}
                        onChange={(e) => updateChoice(ch.id, { text: e.target.value })}
                      />
                    </label>
                    <label className="ink-field">
                      <span>結果敘事</span>
                      <textarea
                        className="ink-editor-textarea"
                        rows={3}
                        value={cp.narrate ?? ''}
                        onChange={(e) => updateChoice(ch.id, { narrate: e.target.value })}
                      />
                    </label>
                    <div className="ink-editor-nums">
                      {(
                        [
                          ['money', '銀兩'],
                          ['health', '氣血'],
                          ['martial', '武學'],
                          ['reputation', '聲望'],
                          ['qi', '內力'],
                          ['maxQi', '內力上限'],
                          ['maxHealth', '氣血上限'],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key} className="ink-field">
                          <span>{label}</span>
                          <input
                            inputMode="numeric"
                            value={numOrEmpty(cp[key])}
                            onChange={(e) => updateChoice(ch.id, { [key]: parseOptionalInt(e.target.value) })}
                          />
                        </label>
                      ))}
                    </div>
                  </fieldset>
                );
              })}

              <div className="ink-cta-stack">
                <button type="button" className="ink-btn ink-btn--primary" onClick={handleSave}>
                  儲存此事件
                </button>
                <button type="button" className="ink-btn ink-btn--ghost" onClick={handleRevert}>
                  還原官方版
                </button>
              </div>
            </div>
          ) : (
            <p className="ink-note">找不到此事件。</p>
          )}
        </>
      )}

      {toast ? (
        <p className="ink-editor-toast" role="status">
          {toast}
        </p>
      ) : null}
    </div>
  );
}
