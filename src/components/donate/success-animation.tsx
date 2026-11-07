/** Heart with a ribbon bow that pops in, with soft sparkles (CSS only; respects reduced motion). */
export function SuccessAnimation() {
  return (
    <div className="relative mx-auto size-32" aria-hidden="true">
      <span className="absolute inset-0 animate-ping rounded-full bg-rose-300/40 [animation-iteration-count:2]" />
      <span className="absolute inset-3 rounded-full bg-rose-200" />
      <svg viewBox="0 0 120 120" className="relative size-full animate-heart">
        <path
          d="M60 100s-34-20.5-43-41C11 45 19 28 35 27c10-.6 18 5 25 14 7-9 15-14.6 25-14 16 1 24 18 18 32-9 20.5-43 41-43 41Z"
          fill="#624533"
        />
        <g transform="translate(60 44)">
          <path d="M0 0C-9-13-26-8-20 2-16 8-6 4 0 0Z" fill="#E2BFB0" />
          <path d="M0 0C9-13 26-8 20 2 16 8 6 4 0 0Z" fill="#E2BFB0" />
          <path d="M-2 2-11 20-6 18-3 23 2 3Z M2 2 11 20 6 18 3 23-2 3Z" fill="#D1A28E" />
          <circle r="4.5" fill="#D1A28E" />
        </g>
      </svg>
      {[
        "top-1 right-2 delay-300",
        "bottom-3 left-0 delay-500",
        "top-6 left-1 delay-700",
      ].map((pos) => (
        <svg key={pos} viewBox="0 0 24 24" className={`absolute size-5 animate-heart text-rose-500 ${pos}`} fill="currentColor">
          <path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8Z" />
        </svg>
      ))}
    </div>
  );
}
