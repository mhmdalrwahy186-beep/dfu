/**
 * Picks a random index different from `current` and, when possible, not among `recent`
 * (so the same quote doesn't come back immediately).
 */
export function pickNextIndex(length: number, current: number, recent: number[] = [], rand: () => number = Math.random) {
  if (length <= 1) return 0;
  const blocked = new Set([current, ...recent]);
  let candidates = Array.from({ length }, (_, i) => i).filter((i) => !blocked.has(i));
  if (candidates.length === 0) candidates = Array.from({ length }, (_, i) => i).filter((i) => i !== current);
  return candidates[Math.floor(rand() * candidates.length)];
}
