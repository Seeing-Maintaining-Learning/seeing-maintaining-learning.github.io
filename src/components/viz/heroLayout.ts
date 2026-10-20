/** Target layouts for the hero field: each lens maps every system to an (x, y) position. */

export type Lens = 'representation' | 'management' | 'modality' | 'timeline';

export interface Pt {
  id: string;
  name: string;
  tier: string;
  modality: string;
  modalityLabel: string;
  category: string;
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

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const TIER_RANK: Record<string, number> = { T3: 0, T2: 1, T1: 2 };

/** Phyllotaxis packing; points sorted so tiers form rings (T3 at the centre). */
function sunflower(n: number, cx: number, cy: number, spacing: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const r = spacing * Math.sqrt(i + 0.5);
    const a = i * GOLDEN;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

interface Spec {
  key: (p: Pt) => string;
  order: string[];
  labels: Record<string, string>;
}

export const SPECS: Record<Exclude<Lens, 'timeline'>, Spec> = {
  representation: {
    key: (p) => p.category,
    order: ['native', 'cross', 'latent', 'hybrid'],
    labels: { native: 'Source & modality-specific', cross: 'Cross-represented explicit', latent: 'Latent & parametric', hybrid: 'Hybrid' },
  },
  management: {
    key: (p) => p.tier,
    order: ['T1', 'T2', 'T3'],
    labels: { T1: 'T1 Static', T2: 'T2 Dynamic', T3: 'T3 Self-evolving' },
  },
  modality: {
    key: (p) => p.modality,
    order: ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'],
    labels: { image: 'Image', video_streaming: 'Video', audio_speech: 'Audio', gui: 'GUI', embodied_3d: 'Embodied' },
  },
};

function clusters(spec: Spec, points: Pt[], W: number, H: number) {
  const pos: [number, number][] = new Array(points.length);
  const narrow = W < 640;
  const n = spec.order.length;
  const cols = narrow ? (n === 4 ? 2 : Math.min(3, n)) : n;
  const rows = Math.ceil(spec.order.length / cols);
  const cellW = W / cols;
  const cellH = (H - 20) / rows;
  const maxN = Math.max(...spec.order.map((k) => points.filter((p) => spec.key(p) === k).length));
  // Spacing so the largest cluster fits its cell.
  const spacing = (Math.min(cellW * 0.92, cellH - 70) / 2 / Math.sqrt(maxN + 1)) * 0.95;
  const groups: Group[] = [];
  spec.order.forEach((k, gi) => {
    const idx = points
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => spec.key(p) === k)
      .sort((a, b) => TIER_RANK[a.p.tier] - TIER_RANK[b.p.tier] || b.p.t - a.p.t);
    const cx = cellW * (gi % cols) + cellW / 2;
    const cy = 20 + cellH * Math.floor(gi / cols) + 40 + (cellH - 40) / 2;
    const spots = sunflower(idx.length, cx, cy, spacing);
    idx.forEach(({ i }, j) => (pos[i] = spots[j]));
    const r = spacing * Math.sqrt(idx.length + 0.5);
    const half = Math.min(90, cellW / 2);
    groups.push({ key: k, label: spec.labels[k], n: idx.length, x: Math.min(W - half, Math.max(half, cx)), y: Math.max(6, cy - r - (narrow ? 54 : 40)) });
  });
  return { pos, groups };
}

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

export function layoutFor(lens: Lens, points: Pt[], W: number, H: number) {
  return lens === 'timeline' ? timeline(points, W, H) : clusters(SPECS[lens], points, W, H);
}
