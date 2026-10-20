/** Target layouts for the hero field: each lens maps every system to an (x, y) position. */
import { bloom, orbits, venn, type Shape } from './heroShapes.ts';

export type Lens = 'representation' | 'management' | 'modality' | 'timeline';

export interface Pt {
  id: string;
  name: string;
  tier: string;
  modality: string;
  modalityLabel: string;
  category: string;
  families: string[];
  year: number;
  t: number; // fractional year for the timeline
}

export interface Group {
  key: string;
  label: string;
  n: number;
  x: number;
  y: number;
  align?: string;
}

const TIER_RANK: Record<string, number> = { T3: 0, T2: 1, T1: 2 };

/** Timeline: x by publication date, stacked into a beeswarm-like column per month bin. */
function timeline(points: Pt[], W: number, H: number) {
  const pos: [number, number][] = new Array(points.length);
  const t0 = 2023;
  const t1 = 2026.9;
  const m = { l: 40, r: 24, b: 44 };
  const x = (t: number) => m.l + ((Math.max(t0, Math.min(t1, t)) - t0) / (t1 - t0)) * (W - m.l - m.r);
  // Bin width and vertical step adapt so the tallest stack fits inside the canvas.
  const avail = H - m.b - 24;
  let bw = 9;
  let bins = new Map<number, number[]>();
  for (;;) {
    bins = new Map();
    points.forEach((p, i) => {
      const b = Math.round(x(p.t) / bw);
      bins.set(b, [...(bins.get(b) ?? []), i]);
    });
    const tallest = Math.max(...[...bins.values()].map((l) => l.length));
    if (tallest * Math.min(9, bw) <= avail || bw >= 24) break;
    bw += 1;
  }
  const tallest = Math.max(...[...bins.values()].map((l) => l.length));
  const step = Math.min(9, avail / tallest);
  for (const [b, list] of bins) {
    list.sort((a, c) => TIER_RANK[points[c].tier] - TIER_RANK[points[a].tier]);
    list.forEach((i, j) => (pos[i] = [b * bw, H - m.b - j * step]));
  }
  const groups: Group[] = [2023, 2024, 2025, 2026].map((y) => ({
    key: String(y),
    label: y === 2023 ? '≤2023' : String(y),
    n: points.filter((p) => (y === 2023 ? p.year <= 2023 : p.year === y)).length,
    x: x(y + 0.45),
    y: H - 38,
  }));
  return { pos, groups };
}

export function layoutFor(lens: Lens, points: Pt[], W: number, H: number): Shape {
  if (lens === 'representation') return venn(points, W, H);
  if (lens === 'management') return orbits(points, W, H);
  if (lens === 'modality') return bloom(points, W, H);
  return { ...timeline(points, W, H), decor: [], dot: 4 };
}
