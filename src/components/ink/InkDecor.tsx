/** 宣紙遠山 + 墨漬（純裝飾） */
export function InkScrollBackdrop({ variant = 'play' }: { variant?: 'hero' | 'play' }) {
  return (
    <div className={`ink-backdrop ink-backdrop--${variant}`} aria-hidden>
      <svg className="ink-mountains" viewBox="0 0 420 180" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="washA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id="washB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.1" />
          </linearGradient>
          <filter id="softInk">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
        </defs>
        <circle cx="340" cy="42" r="36" fill="#1a1a1a" fillOpacity="0.05" filter="url(#softInk)" />
        <path
          fill="url(#washB)"
          filter="url(#softInk)"
          d="M-30,180 L-30,110 Q70,58 150,88 Q240,118 330,70 L450,100 L450,180 Z"
        />
        <path
          fill="url(#washA)"
          filter="url(#softInk)"
          d="M0,180 L0,95 Q90,40 200,72 Q290,98 420,55 L420,180 Z"
        />
      </svg>
      <div className="ink-blot ink-blot--tr" />
      <div className="ink-blot ink-blot--bl" />
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
    <div
      className="ink-seal-overlay"
      onAnimationEnd={() => onDone?.()}
      aria-live="polite"
    >
      <span className="ink-seal-stamp">{text}</span>
    </div>
  );
}
