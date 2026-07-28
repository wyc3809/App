import { useEffect } from 'react';
import { InkWashDecor } from './InkWashDecor';

type Props = {
  onStart: (seed?: number) => void;
  onContinue: () => void;
  resumeHint?: string;
};

export function LifeStartScreen({ onStart, onContinue, resumeHint }: Props) {
  return (
    <div className="phone ink-ui">
      <InkWashDecor />
      <header className="title-hero">
        <span className="ink-seal" aria-hidden>
          生
        </span>
        <p className="eyebrow">Jianghu Life Engine V1.0</p>
        <h1>江湖一生</h1>
        <p className="ink-divider" aria-hidden />
        <p className="tagline">武俠人生 · 墨筆記年</p>
      </header>
      <section className="panel intro-panel">
        <p>每年一事，選擇塑造命運</p>
        <ul>
          <li>五大屬性：根骨、悟性、福緣、魅力、膽識</li>
          <li>拜師、門派、武功、戀愛、決鬥</li>
          <li>50+ 資料化事件，可無限擴充</li>
          <li>IndexedDB 存檔 · 種子 RNG</li>
        </ul>
      </section>
      {resumeHint && (
        <button type="button" className="btn-primary" onClick={onContinue}>
          延續人生
          <span className="btn-sub">{resumeHint}</span>
        </button>
      )}
      <button
        type="button"
        className={resumeHint ? 'btn-ghost' : 'btn-primary'}
        onClick={() => onStart()}
      >
        {resumeHint ? '新開一生' : '踏入江湖'}
      </button>
      <button type="button" className="btn-ghost" onClick={() => onStart(42)}>
        固定種子（除錯）
      </button>
    </div>
  );
}

export function LifeStartGate({
  onReady,
}: {
  onReady: (hasResume: boolean, hint?: string) => void;
}) {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { loadLifeSave } = await import('@core/life/saveIndexedDb');
      const save = await loadLifeSave();
      if (cancelled) return;
      if (save?.state.character.alive && save.state.phase === 'playing') {
        const c = save.state.character;
        onReady(true, `${c.name} · ${c.age} 歲`);
      } else if (save?.state.phase === 'summary') {
        onReady(true, '可檢視總結或新開');
      } else {
        onReady(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onReady]);

  return null;
}
