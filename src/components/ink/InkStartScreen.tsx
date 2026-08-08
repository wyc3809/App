import { useEffect } from 'react';
import { InkScrollBackdrop } from './InkDecor';
import { INK_SVG } from '../../ui/inkAssets';

type Props = {
  onStart: () => void;
  onContinue: () => void;
  resumeHint?: string;
  onSeedDebug?: () => void;
  onOpenEditor?: () => void;
};

function InkInlineSvg({ className, markup }: { className?: string; markup: string }) {
  return <span className={className} aria-hidden dangerouslySetInnerHTML={{ __html: markup }} />;
}

/**
 * 開卷首屏：印章 + 品牌 + 一句副句 + CTA + 遠山滿底。
 * 不放題簽框／十階 icon 列（易似輸入框與現代 App 圖示列）。
 */
export function InkStartScreen({ onStart, onContinue, resumeHint, onSeedDebug, onOpenEditor }: Props) {
  return (
    <div className="scroll-shell ink-enter ink-start">
      <InkScrollBackdrop variant="hero" />
      <header className="ink-hero">
        <span className="ink-seal-static" aria-hidden>
          生
        </span>
        <p className="ink-eyebrow">水墨江湖 · 一生一卷</p>
        <h1 className="ink-brand">江湖一生</h1>
        <InkInlineSvg className="ink-brush-divider" markup={INK_SVG.brushStroke} />
        <p className="ink-tagline">一筆成江湖，留白即命運</p>
      </header>

      <section className="ink-verse" aria-label="卷首">
        <p>千燈一別，歲月如刀</p>
        <p>奇遇路遇，皆在翻頁之間</p>
        <p>落筆為生，蓋印為定</p>
      </section>

      <div className="ink-cta-stack">
        {resumeHint && (
          <button
            type="button"
            className="ink-btn ink-btn--primary ink-btn--scroll"
            onClick={() => {
              onContinue();
            }}
          >
            續寫前緣
            <span className="ink-btn-sub">{resumeHint}</span>
          </button>
        )}
        <button
          type="button"
          className={
            resumeHint ? 'ink-btn ink-btn--ghost ink-btn--scroll' : 'ink-btn ink-btn--primary ink-btn--scroll'
          }
          onClick={() => {
            onStart();
          }}
        >
          {resumeHint ? '開卷新篇' : '開卷'}
        </button>
        <a className="ink-btn ink-btn--quiet" href={`${import.meta.env.BASE_URL}events.html`}>
          事件一覽 · 可分享下載
        </a>
        {onOpenEditor && (
          <button
            type="button"
            className="ink-btn ink-btn--quiet"
            onClick={() => {
              onOpenEditor();
            }}
          >
            手機改事件 · 奇遇／機率
          </button>
        )}
        {onSeedDebug && (
          <button
            type="button"
            className="ink-btn ink-btn--quiet"
            onClick={() => {
              onSeedDebug();
            }}
          >
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
