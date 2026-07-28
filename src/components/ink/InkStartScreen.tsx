import { useEffect } from 'react';
import { InkScrollBackdrop } from './InkDecor';

type Props = {
  onStart: (seed?: number) => void;
  onContinue: () => void;
  resumeHint?: string;
};

export function InkStartScreen({ onStart, onContinue, resumeHint }: Props) {
  return (
    <div className="scroll-shell ink-enter">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <span className="ink-seal-static" aria-hidden>
          生
        </span>
        <p className="ink-eyebrow">Jianghu Life · V1</p>
        <h1 className="ink-brand">江湖一生</h1>
        <p className="ink-rule" aria-hidden />
        <p className="ink-tagline">一筆成江湖，留白即命運</p>
      </header>

      <section className="ink-verse">
        <p>每年一事，批註抉擇。</p>
        <p>根骨 · 悟性 · 福緣 · 魅力 · 膽識</p>
        <p>門派、武功、戀愛、決鬥，皆入年譜。</p>
      </section>

      <div className="ink-cta-stack">
        {resumeHint && (
          <button type="button" className="ink-btn ink-btn--primary" onClick={onContinue}>
            續寫前緣
            <span className="ink-btn-sub">{resumeHint}</span>
          </button>
        )}
        <button
          type="button"
          className={resumeHint ? 'ink-btn ink-btn--ghost' : 'ink-btn ink-btn--primary'}
          onClick={() => onStart()}
        >
          {resumeHint ? '開卷新篇' : '開卷'}
        </button>
        <button type="button" className="ink-btn ink-btn--quiet" onClick={() => onStart(42)}>
          定種子 · 除錯
        </button>
      </div>
    </div>
  );
}

export function InkStartGate({
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
        onReady(true, '前緣已盡 · 可掩卷或新開');
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
