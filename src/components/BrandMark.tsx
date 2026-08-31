/** In-app brand mark — maneki-neko head only (matches app icon mascot). */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="150 95 212 165"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden
    >
      <ellipse cx="256" cy="168" rx="78" ry="72" fill="#F7F7F5" />
      <path
        d="M196 148 178 108 212 126Z"
        fill="#F7F7F5"
        stroke="#E7C4C4"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M316 148 334 108 300 126Z"
        fill="#F7F7F5"
        stroke="#E7C4C4"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path d="M202 118 194 102 208 110Z" fill="#DC2626" />
      <path d="M310 118 318 102 304 110Z" fill="#DC2626" />
      <path
        d="M224 158c0-10 8-16 18-16"
        stroke="#333"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <path
        d="M288 158c0-10-8-16-18-16"
        stroke="#333"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <ellipse cx="256" cy="178" rx="8" ry="10" fill="#DC2626" />
      <path
        d="M244 188c8 10 24 10 32 0"
        stroke="#333"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M188 168h-36M188 182h-40M188 196h-36"
        stroke="#555"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M324 168h36M324 182h40M324 196h36"
        stroke="#555"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path d="M204 228h104c0 0 6 10-2 16H206c-8-6-2-16-2-16z" fill="#DC2626" />
      <circle cx="256" cy="244" r="13" fill="#F0C832" stroke="#C8941A" strokeWidth="2" />
      <path d="M256 236v16" stroke="#C8941A" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
