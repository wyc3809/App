/** 水墨山水裝飾（純 SVG，不影響互動） */
export function InkWashDecor() {
  return (
    <div className="ink-wash-decor" aria-hidden>
      <svg className="ink-mountains" viewBox="0 0 400 140" preserveAspectRatio="xMidYMax meet">
        <defs>
          <linearGradient id="inkFade1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="inkFade2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a1a1a" stopOpacity="0" />
            <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0.14" />
          </linearGradient>
          <filter id="inkBlur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>
        <path
          fill="url(#inkFade2)"
          filter="url(#inkBlur)"
          d="M-20,140 L-20,95 Q60,55 140,78 Q220,100 300,62 L420,88 L420,140 Z"
        />
        <path
          fill="url(#inkFade1)"
          filter="url(#inkBlur)"
          d="M0,140 L0,72 Q100,28 200,58 Q280,82 400,48 L400,140 Z"
        />
        <circle cx="320" cy="36" r="28" fill="#1a1a1a" fillOpacity="0.06" filter="url(#inkBlur)" />
      </svg>
      <div className="ink-splash ink-splash-a" />
      <div className="ink-splash ink-splash-b" />
    </div>
  );
}
