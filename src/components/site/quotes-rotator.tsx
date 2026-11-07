"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { pickNextIndex } from "@/lib/shuffle";
import { cn } from "@/lib/utils";

/**
 * Rotates motivational quotes in random order without immediate repetition.
 * Changes every 6–10 seconds (randomized), pauses on hover/focus and when the tab is hidden.
 */
export function QuotesRotator({ quotes, className, variant = "large" }: { quotes: string[]; className?: string; variant?: "large" | "compact" }) {
  const list = useMemo(() => quotes.filter(Boolean), [quotes]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const recent = useRef<number[]>([]);
  const reduce = useReducedMotion();

  // Random first quote after hydration (keeps server/client markup identical).
  useEffect(() => {
    if (list.length > 1) setIndex(Math.floor(Math.random() * list.length));
  }, [list.length]);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (list.length < 2 || paused || hidden) return;
    const delay = 6000 + Math.random() * 4000;
    const t = setTimeout(() => {
      setIndex((current) => {
        const next = pickNextIndex(list.length, current, recent.current);
        recent.current = [...recent.current, current].slice(-Math.min(8, Math.floor(list.length / 2)));
        return next;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [index, paused, hidden, list.length]);

  if (list.length === 0) return null;

  return (
    <figure
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      aria-roledescription="اقتباسات متغيرة"
    >
      <div className={cn("relative grid place-items-center", variant === "large" ? "min-h-[7.5rem] sm:min-h-[6rem]" : "min-h-[4.5rem]")}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.blockquote
            key={index}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10, filter: "blur(4px)" }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "text-balance text-center font-display font-bold text-brown-800",
              variant === "large" ? "text-2xl leading-[1.7] sm:text-[2rem]" : "text-lg leading-8",
            )}
            aria-live="polite"
          >
            «{list[index].replace(/[.。]$/, "")}»
          </motion.blockquote>
        </AnimatePresence>
      </div>
    </figure>
  );
}
