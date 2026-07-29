/** 宣紙遠山 + 墨漬 + 水墨微動（純裝飾） */
export function InkScrollBackdrop({ variant = 'play' }: { variant?: 'hero' | 'play' }) {
  return (
    <div className={`ink-backdrop ink-backdrop--${variant}`} aria-hidden>
      <svg className="ink-mountains" viewBox="0 0 420 200" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="washFar" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.08" />
          </linearGradient>
          <linearGradient id="washMid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.14" />
          </linearGradient>
          <linearGradient id="washNear" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.22" />
          </linearGradient>
          <filter id="softInk">
            <feGaussianBlur stdDeviation="1.6" />
          </filter>
          <filter id="softMist">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
        </defs>
        <circle
          className="ink-mist-orb ink-mist-orb--a"
          cx="338"
          cy="38"
          r="40"
          fill="#1a1a1a"
          fillOpacity="0.045"
          filter="url(#softMist)"
        />
        <circle
          className="ink-mist-orb ink-mist-orb--b"
          cx="72"
          cy="58"
          r="28"
          fill="#1a1a1a"
          fillOpacity="0.035"
          filter="url(#softMist)"
        />
        <path
          className="ink-ridge ink-ridge--far"
          fill="url(#washFar)"
          filter="url(#softInk)"
          d="M-40,200 L-40,128 Q60,78 140,108 Q230,138 320,86 L460,118 L460,200 Z"
        />
        <path
          className="ink-ridge ink-ridge--mid"
          fill="url(#washMid)"
          filter="url(#softInk)"
          d="M-20,200 L-20,118 Q80,62 170,94 Q270,128 380,72 L440,98 L440,200 Z"
        />
        <path
          className="ink-ridge ink-ridge--near"
          fill="url(#washNear)"
          filter="url(#softInk)"
          d="M0,200 L0,108 Q95,48 205,82 Q300,110 420,64 L420,200 Z"
        />
        {/* 飛白墨點 */}
        <g className="ink-sparks" fill="#1a1a1a" fillOpacity="0.12">
          <circle className="ink-spark ink-spark--1" cx="48" cy="132" r="1.6" />
          <circle className="ink-spark ink-spark--2" cx="190" cy="118" r="1.2" />
          <circle className="ink-spark ink-spark--3" cx="286" cy="142" r="1.8" />
          <circle className="ink-spark ink-spark--4" cx="360" cy="126" r="1.1" />
        </g>
      </svg>
      <div className="ink-mist-layer" />
      <div className="ink-mist-layer ink-mist-layer--soft" />
      <div className="ink-brush-sweep" />
      <div className="ink-brush-sweep ink-brush-sweep--late" />
      <div className="ink-blot ink-blot--tr" />
      <div className="ink-blot ink-blot--bl" />
      <div className="ink-blot ink-blot--drift" />
      <div className="ink-paper-edge" />
    </div>
  );
}

export function InkSealStamp({
  text,
  onDone,
}: {
  text: string;
  onDone?: () => void;
}) {
  return (
    <div className="ink-seal-overlay" onAnimationEnd={() => onDone?.()} aria-live="polite">
      <span className="ink-seal-stamp">{text}</span>
    </div>
  );
}

/** 結果匣角印／題簽裝飾 */
export function InkResultSeal({ text = '定' }: { text?: string }) {
  return (
    <span className="ink-result-seal" aria-hidden>
      {text}
    </span>
  );
}
