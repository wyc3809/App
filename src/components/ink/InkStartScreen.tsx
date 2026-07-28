import { useEffect } from 'react';
import { InkScrollBackdrop } from './InkDecor';

type Props = {
  onStart: () => void;
  onContinue: () => void;
  resumeHint?: string;
  onSeedDebug?: () => void;
};

export function InkStartScreen({ onStart, onContinue, resumeHint, onSeedDebug }: Props) {
  return (
    <div className="scroll-shell ink-enter">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <span className="ink-seal-static" aria-hidden>
          生
        </span>
        <p className="ink-eyebrow">Jianghu Life · 整合版</p>
        <h1 className="ink-brand">江湖一生</h1>
        <p className="ink-rule" aria-hidden />
        <p className="ink-tagline">一筆成江湖，留白即命運</p>
      </header>

      <section className="ink-verse">
        <p>千燈鎮起步 · 按月推演</p>
        <p>百則江湖奇遇 · 日常與特殊交織</p>
        <p>水墨手卷 · 印章定奪</p>
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
          onClick={onStart}
        >
          {resumeHint ? '開卷新篇' : '開卷'}
        </button>
        {onSeedDebug && (
          <button type="button" className="ink-btn ink-btn--quiet" onClick={onSeedDebug}>
            定種子 · 除錯
          </button>
        )}
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
