/** In-app brand mark — clean maneki-neko head (matches header preview). */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-hidden
    >
      {/* Ears */}
      <path
        d="M28 38 22 18 40 32Z"
        fill="#F7F7F5"
        stroke="#E8B4B4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M28 38 24 26 34 34Z" fill="#DC2626" />
      <path
        d="M72 38 78 18 60 32Z"
        fill="#F7F7F5"
        stroke="#E8B4B4"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M72 38 76 26 66 34Z" fill="#DC2626" />

      {/* Face */}
      <circle cx="50" cy="54" r="30" fill="#F7F7F5" />

      {/* Eyes */}
      <path
        d="M38 50c4-6 10-6 14 0"
        stroke="#2D2D2D"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        d="M62 50c-4-6-10-6-14 0"
        stroke="#2D2D2D"
        strokeWidth="2.8"
        strokeLinecap="round"
      />

      {/* Nose + mouth */}
      <path d="M50 56l-3 4h6l-3-4z" fill="#DC2626" />
      <path
        d="M50 60c-4 4-8 4-12 0M50 60c4 4 8 4 12 0"
        stroke="#2D2D2D"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      {/* Whiskers */}
      <path d="M22 52h14M20 58h16M22 64h14" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M78 52H64M80 58H64M78 64H64" stroke="#888" strokeWidth="1.2" strokeLinecap="round" />

      {/* Collar + bell */}
      <path d="M32 78h36c0 0 4 6-2 9H34c-6-3-2-9-2-9z" fill="#DC2626" />
      <circle cx="50" cy="86" r="5.5" fill="#F0C832" stroke="#C8941A" strokeWidth="1" />
      <path d="M50 83v6" stroke="#C8941A" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}
