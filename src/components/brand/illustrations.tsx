import { cn } from "@/lib/utils";

/** Original hero illustration: a ribbon-tied donation box filled with neatly folded clothes. */
export function DonationBoxIllustration({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 480 440" className={cn("h-auto w-full", className)} role="img" aria-labelledby="hero-ill-title">
      <title id="hero-ill-title">صندوق تبرع مربوط بشريطة ومليء بملابس مطوية بعناية</title>
      <defs>
        <linearGradient id="boxFront" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#E8D3BF" />
          <stop offset="1" stopColor="#D9BCA3" />
        </linearGradient>
        <linearGradient id="boxSide" x1="0" x2="1">
          <stop offset="0" stopColor="#CFAE93" />
          <stop offset="1" stopColor="#C29E83" />
        </linearGradient>
        <linearGradient id="ribbon" x1="0" x2="1">
          <stop offset="0" stopColor="#C88F7C" />
          <stop offset="0.5" stopColor="#D7A693" />
          <stop offset="1" stopColor="#C18875" />
        </linearGradient>
        <pattern id="knit" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M2 2 L5 8 L8 2" fill="none" stroke="#B88F78" strokeWidth="1.1" strokeLinecap="round" opacity="0.55" />
        </pattern>
      </defs>

      {/* soft backdrop */}
      <ellipse cx="240" cy="236" rx="214" ry="190" fill="#FBF5EE" />
      <ellipse cx="240" cy="398" rx="178" ry="14" fill="#624533" opacity="0.08" />

      {/* hanger */}
      <g fill="none" stroke="#624533" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" className="origin-[240px_40px] animate-float">
        <path d="M232 64c0-14 10-22 20-22 11 0 19 8 19 18 0 9-6 14-12 17-5 2-7 6-7 11v10" />
        <path d="M252 98 L160 140 M252 98 L344 140" />
        <path d="M160 140 q-12 6 -2 10 L346 150 q10 -4 -2 -10" opacity="0.9" />
      </g>

      {/* hearts */}
      <g fill="none" stroke="#C18875" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M74 132c-9-6-14-11-14-18 0-5 4-9 9-9 3 0 5 2 5 4 0-2 2-4 5-4 5 0 9 4 9 9 0 7-5 12-14 18Z" />
        <path transform="translate(14 -58)" d="M410 214c-7-5-11-9-11-14 0-4 3-7 7-7 2 0 4 1 4 3 0-2 2-3 4-3 4 0 7 3 7 7 0 5-4 9-11 14Z" opacity="0.8" />
      </g>
      <path d="M402 104c-10-7-16-12-16-20 0-6 4-10 10-10 3 0 6 2 6 5 0-3 3-5 6-5 6 0 10 4 10 10 0 8-6 13-16 20Z" fill="#E2BFB0" />

      {/* folded clothes */}
      <g>
        <rect x="132" y="170" width="214" height="34" rx="15" fill="#F6EADF" stroke="#D5B79F" strokeWidth="2" />
        <path d="M318 172 q22 15 0 30" fill="none" stroke="#D5B79F" strokeWidth="2" />
        <path d="M150 187 h120" stroke="#E3CDB8" strokeWidth="2" strokeDasharray="4 6" strokeLinecap="round" />

        <rect x="120" y="196" width="232" height="38" rx="16" fill="#E2BFB0" />
        <rect x="120" y="196" width="232" height="38" rx="16" fill="url(#knit)" />
        <path d="M324 198 q24 17 0 34" fill="none" stroke="#C99A86" strokeWidth="2.2" />

        <rect x="128" y="226" width="224" height="34" rx="15" fill="#F2E2D2" stroke="#D5B79F" strokeWidth="2" />
        <path d="M326 228 q22 15 0 30" fill="none" stroke="#D5B79F" strokeWidth="2" />
      </g>

      {/* box */}
      <path d="M96 246 L384 246 L366 392 Q364 398 356 398 L124 398 Q116 398 114 392 Z" fill="url(#boxFront)" />
      <path d="M96 246 L384 246 L392 262 L88 262 Z" fill="#C9A88C" />
      <path d="M96 246 L50 214 Q46 211 51 209 L104 196 Q110 195 114 199 L136 246 Z" fill="url(#boxSide)" />
      <path d="M384 246 L430 214 Q434 211 429 209 L376 196 Q370 195 366 199 L344 246 Z" fill="url(#boxSide)" />
      <path d="M118 300 h244" stroke="#C9A88C" strokeWidth="1.5" opacity="0.5" />

      {/* ribbon around the box */}
      <path d="M226 262 L254 262 L250 398 L230 398 Z" fill="url(#ribbon)" />
      <g transform="translate(240 262)">
        <path d="M0 0 C-30 -40 -78 -22 -60 4 C-48 20 -18 10 0 0Z" fill="#D1A28E" stroke="#B57D6A" strokeWidth="2" />
        <path d="M0 0 C30 -40 78 -22 60 4 C48 20 18 10 0 0Z" fill="#D1A28E" stroke="#B57D6A" strokeWidth="2" />
        <path d="M-4 4 L-30 56 L-18 52 L-12 64 L4 8Z" fill="#C18875" />
        <path d="M4 4 L30 56 L18 52 L12 64 L-4 8Z" fill="#C18875" />
        <ellipse cx="0" cy="2" rx="11" ry="9" fill="#C18875" stroke="#B57D6A" strokeWidth="2" />
      </g>

      {/* tag */}
      <g transform="translate(142 318) rotate(-6)">
        <rect width="64" height="38" rx="9" fill="#FFFCF8" stroke="#D5B79F" strokeWidth="2" />
        <circle cx="12" cy="19" r="3.5" fill="#D5B79F" />
        <text x="40" y="26" textAnchor="middle" fontFamily="Cairo, sans-serif" fontWeight="800" fontSize="18" fill="#624533">
          دفء
        </text>
      </g>
    </svg>
  );
}

/** Small decorative icons for the three donation steps. */
export function StepIcon({ step }: { step: 1 | 2 | 3 }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  if (step === 1)
    return (
      <svg viewBox="0 0 48 48" className="size-9" aria-hidden="true">
        <rect x="11" y="7" width="26" height="34" rx="5" {...common} />
        <path d="M18 7v-1a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" {...common} />
        <path d="M17 19h14M17 26h14M17 33h8" {...common} />
      </svg>
    );
  if (step === 2)
    return (
      <svg viewBox="0 0 48 48" className="size-9" aria-hidden="true">
        <path d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-8 7v-7h-2a4 4 0 0 1-4-4Z" {...common} />
        <path d="M24 25c-4-2.6-6-4.6-6-7 0-1.9 1.4-3.3 3.2-3.3 1.2 0 2.2.6 2.8 1.6.6-1 1.6-1.6 2.8-1.6 1.8 0 3.2 1.4 3.2 3.3 0 2.4-2 4.4-6 7Z" fill="currentColor" stroke="none" />
      </svg>
    );
  return (
    <svg viewBox="0 0 48 48" className="size-9" aria-hidden="true">
      <path d="M8 20h32v20a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3Z" {...common} />
      <path d="M5 14h38v6H5z" {...common} />
      <path d="M24 14v29" {...common} />
      <path d="M24 14c-4-6-11-7-11-2 0 3 6 2 11 2Zm0 0c4-6 11-7 11-2 0 3-6 2-11 2Z" {...common} />
    </svg>
  );
}
