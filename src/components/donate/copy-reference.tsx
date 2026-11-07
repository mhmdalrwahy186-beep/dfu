"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyReference({ reference }: { reference: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(reference);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          /* clipboard unavailable — the number stays visible */
        }
      }}
      className="group mt-1 inline-flex items-center gap-2 rounded-xl px-2 py-1 transition hover:bg-cream-200"
      aria-label={`نسخ رقم الطلب ${reference}`}
    >
      <span className="ltr-nums whitespace-nowrap font-display text-2xl font-extrabold tracking-wide text-brown-800 min-[400px]:text-3xl">{reference}</span>
      {copied ? <Check className="size-5 text-[#3f6b4e]" /> : <Copy className="size-5 text-brown-500 group-hover:text-rose-600" />}
      <span className="sr-only" aria-live="polite">{copied ? "تم النسخ" : ""}</span>
    </button>
  );
}
