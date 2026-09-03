/**
 * PLACEHOLDER ILLUSTRATION. Replace with original artwork before launch.
 * Inline SVG so it ships with zero layout shift and no image requests.
 */
export function BoatIllustration({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 520"
      className={className}
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax slice"
    >
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f5f2ec" />
          <stop offset="1" stopColor="#d9e2e8" />
        </linearGradient>
        <linearGradient id="water" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1f3b4d" />
          <stop offset="1" stopColor="#0f1b26" />
        </linearGradient>
      </defs>
      <rect width="1200" height="520" fill="url(#sky)" />
      {/* Marin headlands */}
      <path d="M0 250 C120 200 220 235 330 205 C440 175 520 215 640 200 C760 185 840 230 960 210 C1060 193 1130 215 1200 205 L1200 330 L0 330 Z" fill="#c9c2b3" />
      <path d="M0 290 C150 255 260 280 380 262 C520 240 600 275 720 258 C850 240 930 280 1060 262 C1120 254 1160 262 1200 258 L1200 330 L0 330 Z" fill="#a89e8c" />
      {/* Water */}
      <rect y="320" width="1200" height="200" fill="url(#water)" />
      <g stroke="#e6b98a" strokeOpacity="0.35" strokeWidth="2" fill="none">
        <path d="M0 360 Q60 350 120 360 T240 360 T360 360 T480 360 T600 360 T720 360 T840 360 T960 360 T1080 360 T1200 360" />
        <path d="M0 410 Q60 400 120 410 T240 410 T360 410 T480 410 T600 410 T720 410 T840 410 T960 410 T1080 410 T1200 410" />
        <path d="M0 460 Q60 450 120 460 T240 460 T360 460 T480 460 T600 460 T720 460 T840 460 T960 460 T1080 460 T1200 460" />
      </g>
      {/* Boat */}
      <g transform="translate(430 250)">
        <path d="M0 80 L340 80 L320 120 Q170 135 20 120 Z" fill="#14202b" />
        <rect x="40" y="70" width="260" height="12" fill="#b8683a" />
        <rect x="90" y="10" width="150" height="62" rx="4" fill="#b8683a" />
        <rect x="105" y="26" width="34" height="26" rx="2" fill="#e6b98a" />
        <rect x="150" y="26" width="34" height="26" rx="2" fill="#e6b98a" />
        <rect x="195" y="26" width="34" height="26" rx="2" fill="#e6b98a" />
        <rect x="215" y="-30" width="12" height="42" fill="#14202b" />
        <path d="M221 -34 C205 -60 240 -75 224 -100 C245 -110 230 -130 236 -145" stroke="#7a6f5f" strokeWidth="5" fill="none" strokeLinecap="round" strokeOpacity="0.7" />
        <rect x="250" y="40" width="70" height="32" rx="3" fill="#1f3b4d" />
        <rect x="258" y="46" width="22" height="14" rx="2" fill="#d9e2e8" />
      </g>
      {/* Swimmer */}
      <circle cx="380" cy="352" r="8" fill="#e6b98a" />
      <path d="M352 358 Q366 350 390 356" stroke="#e6b98a" strokeWidth="4" fill="none" strokeLinecap="round" />
    </svg>
  );
}
