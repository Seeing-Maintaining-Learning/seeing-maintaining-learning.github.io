/** Deterministic hash of a string to [0, 1); used for stable jitter in visualizations. */
export const hash = (s: string, k = 0): number => {
  let h = 2166136261 ^ k;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};
