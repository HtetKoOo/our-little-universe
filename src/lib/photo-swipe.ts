export type SwipePoint = { x: number; y: number; time: number };

/** A deliberate horizontal swipe; scrolling, taps and long presses do not navigate. */
export function photoSwipe(start: SwipePoint, end: SwipePoint): -1 | 1 | null {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const elapsed = end.time - start.time;
  if (elapsed < 0 || elapsed > 800 || Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return null;
  return dx < 0 ? 1 : -1;
}
