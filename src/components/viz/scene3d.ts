/**
 * 3D scenes for the hero lenses (prototype designs A/B/C). Every scene lives in the same unit space
 * as the sphere (roughly [-1, 1]^3) so the camera, dragging and morphing are shared.
 */
import type { Pt } from './heroLayout.ts';
import type { P3 } from './sphereLayout.ts';

export type Design = 'A' | 'B' | 'C';
export type LensKey = 'representation' | 'management' | 'modality';

export type Decor3 =
  | { kind: 'line'; pts: P3[]; c: string; alpha: number; dash?: number[]; width?: number }
  | { kind: 'orb'; c3: P3; r: number; c: string }
  | { kind: 'glow'; c3: P3; r: number; c: string };

export interface Label3 {
  p: P3;
  text: string;
  n: number;
  icon?: string;
  c?: string;
}

export interface Scene {
  /** Point positions at accumulated time t (ms). */
  at: (t: number) => P3[];
  decor: (t: number) => Decor3[];
  labels: (t: number) => Label3[];
  /** Preferred camera pitch for this scene. */
  pitch: number;
  spin: boolean;
}

export const MODS = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'];
const MOD_NAME: Record<string, string> = { image: 'Image', video_streaming: 'Video', audio_speech: 'Audio', gui: 'GUI', embodied_3d: 'Embodied' };
export const MOD_VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied' };
const FAM = ['source_preserving_and_modality_native_memory', 'cross_represented_explicit_memory', 'internalized_latent_and_parametric_memory'];
const FAM_NAME = ['Source & modality-specific', 'Cross-represented explicit', 'Latent & parametric'];
const FAM_VAR = ['--m-video', '--m-audio', '--t1'];
const TIERS = ['T1', 'T2', 'T3'];
const TIER_NAME: Record<string, string> = { T1: 'T1 Static', T2: 'T2 Dynamic', T3: 'T3 Self-evolving' };

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const hash = (s: string, k = 0) => {
  let h = 2166136261 ^ k;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};
const add = (a: P3, b: P3): P3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const scale = (a: P3, k: number): P3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const group = (points: Pt[], key: (p: Pt) => string) => {
  const m = new Map<string, number[]>();
  points.forEach((p, i) => m.set(key(p), [...(m.get(key(p)) ?? []), i]));
  return m;
};

/** n points filling a ball of radius r (Fibonacci shells). */
function ball(n: number, r: number): P3[] {
  return Array.from({ length: n }, (_, i) => {
    const rr = r * Math.cbrt((i + 0.5) / n);
    const y = 1 - (2 * (i + 0.5)) / n;
    const rad = Math.sqrt(1 - y * y);
    const th = i * GOLDEN * 7.3;
    return { x: rr * rad * Math.cos(th), y: rr * y, z: rr * rad * Math.sin(th) };
  });
}

/** Circle polyline in 3D: centre c, radius r, tilted by (rx about x, rz about z). */
function ring(c: P3, r: number, rx: number, rz: number, seg = 72): P3[] {
  return Array.from({ length: seg + 1 }, (_, i) => tilt({ x: r * Math.cos((i / seg) * Math.PI * 2), y: 0, z: r * Math.sin((i / seg) * Math.PI * 2) }, rx, rz, c));
}
function tilt(p: P3, rx: number, rz: number, c: P3 = { x: 0, y: 0, z: 0 }): P3 {
  const y1 = p.y * Math.cos(rx) - p.z * Math.sin(rx);
  const z1 = p.y * Math.sin(rx) + p.z * Math.cos(rx);
  const x2 = p.x * Math.cos(rz) - y1 * Math.sin(rz);
  const y2 = p.x * Math.sin(rz) + y1 * Math.cos(rz);
  return { x: c.x + x2, y: c.y + y2, z: c.z + z1 };
}
const still = (pos: P3[]) => () => pos;

// ---------- Representation: glass orbs (3D Venn), shared by A and B ----------
function orbs(points: Pt[]): Scene {
  const R = 0.58;
  const d = 0.42;
  const C: P3[] = [150, 30, 270].map((a) => ({ x: d * Math.cos((a * Math.PI) / 180), y: -d * Math.sin((a * Math.PI) / 180), z: 0 }));
  const keyOf = (p: Pt) => FAM.map((f, i) => (p.families.includes(f) ? i : -1)).filter((i) => i >= 0).join('');
  const centre = (k: string): P3 => {
    const idx = k.split('').filter(Boolean).map(Number);
    if (!idx.length) return { x: 0, y: -1, z: 0 };
    const m = idx.reduce((acc, i) => add(acc, C[i]), { x: 0, y: 0, z: 0 });
    const avg = scale(m, 1 / idx.length);
    return idx.length === 1 ? scale(avg, 1.55) : idx.length === 2 ? scale(avg, 1.1) : avg;
  };
  const pos: P3[] = points.map(() => ({ x: 0, y: 0, z: 0 }));
  for (const [k, idx] of group(points, keyOf)) {
    const c = centre(k);
    const b = ball(idx.length, 0.06 + 0.026 * Math.sqrt(idx.length));
    idx.forEach((pi, j) => (pos[pi] = add(c, b[j])));
  }
  const counts = FAM.map((f) => points.filter((p) => p.families.includes(f)).length);
  return {
    at: still(pos),
    decor: () => C.map((c, i) => ({ kind: 'orb', c3: c, r: R, c: FAM_VAR[i] })),
    labels: () => C.map((c, i) => ({ p: add(scale(c, 2.35), { x: 0, y: i === 2 ? 0.12 : -0.1, z: 0 }), text: FAM_NAME[i], n: counts[i], c: FAM_VAR[i] })),
    pitch: -0.15,
    spin: true,
  };
}

// ---------- Tiers A: atom / gyroscope ----------
const ATOM: Record<string, { r: number; rx: number; rz: number; w: number }> = {
  T1: { r: 0.32, rx: 0.15, rz: 0, w: 0 },
  T2: { r: 0.66, rx: 1.05, rz: 0.35, w: 0.00012 },
  T3: { r: 0.98, rx: 0.55, rz: -0.9, w: 0.0005 },
};
function atom(points: Pt[]): Scene {
  const by = group(points, (p) => p.tier);
  const slot = points.map((p, i) => {
    const idx = by.get(p.tier)!;
    const j = idx.indexOf(i);
    return { a: (j / idx.length) * Math.PI * 2, dr: (hash(p.id) - 0.5) * 0.07, dy: (hash(p.id, 3) - 0.5) * 0.05 };
  });
  return {
    at: (t) =>
      points.map((p, i) => {
        const o = ATOM[p.tier] ?? ATOM.T2;
        const a = slot[i].a + o.w * t;
        const r = o.r + slot[i].dr;
        return tilt({ x: r * Math.cos(a), y: slot[i].dy, z: r * Math.sin(a) }, o.rx, o.rz);
      }),
    decor: () => [
      { kind: 'glow', c3: { x: 0, y: 0, z: 0 }, r: 0.18, c: '--t1' },
      ...TIERS.map((t) => ({ kind: 'line' as const, pts: ring({ x: 0, y: 0, z: 0 }, ATOM[t].r, ATOM[t].rx, ATOM[t].rz), c: `--t${t[1]}`, alpha: 0.45, dash: [3, 5] })),
    ],
    labels: () => TIERS.map((t) => ({ p: tilt({ x: ATOM[t].r, y: 0.1, z: 0 }, ATOM[t].rx, ATOM[t].rz), text: TIER_NAME[t], n: by.get(t)?.length ?? 0, c: `--t${t[1]}` })),
    pitch: -0.35,
    spin: true,
  };
}

// ---------- Modality A: planets on a tilted orbit ----------
function planets(points: Pt[]): Scene {
  const by = group(points, (p) => p.modality);
  const nMax = Math.max(...MODS.map((m) => by.get(m)?.length ?? 1));
  const RX = 0;
  const W = 0.00006;
  const local: P3[] = points.map(() => ({ x: 0, y: 0, z: 0 }));
  const size: Record<string, number> = {};
  for (const m of MODS) {
    const idx = by.get(m) ?? [];
    size[m] = 0.1 + 0.2 * Math.cbrt(idx.length / nMax);
    const b = ball(idx.length, size[m]);
    idx.forEach((pi, j) => (local[pi] = b[j]));
  }
  const centreOf = (m: string, t: number): P3 => {
    const a = (MODS.indexOf(m) / MODS.length) * Math.PI * 2 + W * t;
    return tilt({ x: 0.82 * Math.cos(a), y: 0, z: 0.82 * Math.sin(a) }, RX, 0);
  };
  return {
    at: (t) => points.map((p, i) => add(centreOf(p.modality, t), local[i])),
    decor: () => [
      { kind: 'line', pts: ring({ x: 0, y: 0, z: 0 }, 0.82, RX, 0), c: '--ink', alpha: 0.18, dash: [2, 6] },
      { kind: 'glow', c3: { x: 0, y: 0, z: 0 }, r: 0.16, c: '--m-gui' },
    ],
    labels: (t) => MODS.map((m) => ({ p: add(centreOf(m, t), { x: 0, y: size[m] + 0.14, z: 0 }), text: MOD_NAME[m], n: by.get(m)?.length ?? 0, icon: m, c: MOD_VAR[m] })),
    pitch: -0.62,
    spin: false,
  };
}

// ---------- Tiers B: tilted spiral galaxy (T3 on the bright rim) ----------
function galaxy(points: Pt[]): Scene {
  const band: Record<string, [number, number]> = { T1: [0.08, 0.36], T2: [0.38, 0.78], T3: [0.84, 0.98] };
  const base = points.map((p) => {
    const [a, b] = band[p.tier] ?? band.T2;
    const r = a + (b - a) * hash(p.id);
    const arm = MODS.indexOf(p.modality);
    const th = (arm / MODS.length) * Math.PI * 2 + r * 3.2 + (hash(p.id, 9) - 0.5) * 0.5;
    return { r, th, y: (hash(p.id, 5) - 0.5) * 0.06 * (1 - r) };
  });
  const W = 0.00008;
  return {
    at: (t) => base.map((b) => ({ x: b.r * Math.cos(b.th + W * t), y: b.y, z: b.r * Math.sin(b.th + W * t) })),
    decor: () => [
      { kind: 'glow', c3: { x: 0, y: 0, z: 0 }, r: 0.22, c: '--t1' },
      ...TIERS.map((t) => ({ kind: 'line' as const, pts: ring({ x: 0, y: 0, z: 0 }, band[t][1], 0, 0), c: `--t${t[1]}`, alpha: 0.3, dash: [2, 6] })),
    ],
    labels: () => TIERS.map((t, k) => ({ p: { x: 0, y: 0.05, z: -(band[t][1] + 0.04) - k * 0.02 }, text: TIER_NAME[t], n: points.filter((p) => p.tier === t).length, c: `--t${t[1]}` })),
    pitch: -0.85,
    spin: true,
  };
}

// ---------- Modality B: five-strand helix rising through time ----------
function helix(points: Pt[]): Scene {
  const by = group(points, (p) => p.modality);
  const tMin = Math.min(...points.map((p) => p.t));
  const tMax = Math.max(...points.map((p) => p.t));
  const yOf = (t: number) => -0.95 + 1.9 * Math.pow((t - tMin) / (tMax - tMin || 1), 2.2);
  const turn = (y: number) => (y + 1) * Math.PI * 1.1;
  const pos = points.map((p) => {
    const k = MODS.indexOf(p.modality);
    const y = yOf(p.t);
    const a = (k / MODS.length) * Math.PI * 2 + turn(y) + (hash(p.id) - 0.5) * 0.18;
    const r = 0.5 + (hash(p.id, 2) - 0.5) * 0.08;
    return { x: r * Math.cos(a), y, z: r * Math.sin(a) };
  });
  const strands: Decor3[] = MODS.map((m, k) => ({
    kind: 'line',
    pts: Array.from({ length: 60 }, (_, i) => {
      const y = -0.95 + (1.9 * i) / 59;
      const a = (k / MODS.length) * Math.PI * 2 + turn(y);
      return { x: 0.5 * Math.cos(a), y, z: 0.5 * Math.sin(a) };
    }),
    c: MOD_VAR[m],
    alpha: 0.35,
  }));
  const years = [2023, 2024, 2025, 2026].filter((y) => y >= Math.floor(tMin) && y <= tMax);
  return {
    at: still(pos),
    decor: () => [...strands, { kind: 'line', pts: [{ x: 0, y: -1, z: 0 }, { x: 0, y: 1, z: 0 }], c: '--ink', alpha: 0.25 }],
    labels: () => [
      ...MODS.map((m, k) => {
        const a = (k / MODS.length) * Math.PI * 2 + turn(0.95);
        return { p: { x: 0.62 * Math.cos(a), y: 1.02, z: 0.62 * Math.sin(a) }, text: MOD_NAME[m], n: by.get(m)?.length ?? 0, icon: m, c: MOD_VAR[m] };
      }),
      ...years.map((y) => ({ p: { x: 0.05, y: yOf(y), z: 0 }, text: String(y), n: -1 })),
    ],
    pitch: -0.12,
    spin: true,
  };
}

// ---------- Design C: isometric dot skyline (one scene per lens) ----------
function skyline(points: Pt[], lens: LensKey): Scene {
  const cols =
    lens === 'representation'
      ? { keys: ['native', 'cross', 'latent', 'hybrid'], of: (p: Pt) => p.category, names: ['Source', 'Explicit', 'Latent', 'Hybrid'] }
      : lens === 'management'
        ? { keys: TIERS, of: (p: Pt) => p.tier, names: TIERS.map((t) => TIER_NAME[t]) }
        : { keys: ['2023', '2024', '2025', '2026'], of: (p: Pt) => String(Math.max(2023, p.year)), names: ['≤2023', '2024', '2025', '2026'] };
  const nx = cols.keys.length;
  const nz = MODS.length;
  const gx = (i: number) => -0.8 + (1.6 * i) / Math.max(1, nx - 1);
  const gz = (k: number) => -0.8 + (1.6 * k) / (nz - 1);
  const pos: P3[] = points.map(() => ({ x: 0, y: 0, z: 0 }));
  const step = 0.028;
  const stacks = new Map<string, number[]>();
  points.forEach((p, i) => {
    const key = `${cols.of(p)}|${p.modality}`;
    stacks.set(key, [...(stacks.get(key) ?? []), i]);
  });
  let maxH = 0;
  for (const [key, idx] of stacks) {
    const [c, m] = key.split('|');
    const xi = cols.keys.indexOf(c);
    const zi = MODS.indexOf(m);
    if (xi < 0 || zi < 0) continue;
    idx.forEach((pi, j) => {
      const layer = Math.floor(j / 4);
      const q = j % 4;
      pos[pi] = { x: gx(xi) + (q % 2 ? 0.035 : -0.035), y: -0.2 + layer * step * 1.25, z: gz(zi) + (q < 2 ? 0.035 : -0.035) };
      maxH = Math.max(maxH, layer);
    });
  }
  const grid: Decor3[] = [
    ...cols.keys.map((_, i) => ({ kind: 'line' as const, pts: [{ x: gx(i), y: -0.23, z: -0.95 }, { x: gx(i), y: -0.23, z: 0.95 }], c: '--ink', alpha: 0.12 })),
    ...MODS.map((_, k) => ({ kind: 'line' as const, pts: [{ x: -0.95, y: -0.23, z: gz(k) }, { x: 0.95, y: -0.23, z: gz(k) }], c: '--ink', alpha: 0.12 })),
  ];
  return {
    at: still(pos),
    decor: () => grid,
    labels: () => [
      ...cols.keys.map((k, i) => ({ p: { x: gx(i), y: -0.3, z: 1.12 }, text: cols.names[i], n: points.filter((p) => cols.of(p) === k).length })),
      ...MODS.map((m, k) => ({ p: { x: -1.15, y: -0.25, z: gz(k) }, text: MOD_NAME[m], n: -1, icon: m, c: MOD_VAR[m] })),
    ],
    pitch: -0.5,
    spin: false,
  };
}

export function sceneFor(design: Design, lens: LensKey, points: Pt[]): Scene {
  if (design === 'C') return skyline(points, lens);
  if (lens === 'representation') return orbs(points);
  if (lens === 'management') return design === 'A' ? atom(points) : galaxy(points);
  return design === 'A' ? planets(points) : helix(points);
}
