/** Meaningful shapes for the hero lenses: Venn (representation), orbits (tiers), bloom (modality). */
import type { Group, Pt } from './heroLayout.ts';

export type Decor =
  | { kind: 'circle'; x: number; y: number; r: number; c: string }
  | { kind: 'ring'; x: number; y: number; r: number; c: string }
  | { kind: 'petal'; x: number; y: number; angle: number; len: number; width: number; c: string };

export interface Orbit {
  cx: number;
  cy: number;
  r: number;
  a0: number;
  /** radians per millisecond */
  speed: number;
}

export interface Shape {
  pos: [number, number][];
  groups: Group[];
  decor: Decor[];
  dot: number;
  orbit?: Orbit[];
}

const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const hash = (s: string) => {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 10000) / 10000;
};

function pack(n: number, cx: number, cy: number, spacing: number): [number, number][] {
  return Array.from({ length: n }, (_, i) => {
    const r = spacing * Math.sqrt(i + 0.5);
    const a = i * GOLDEN;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}

const FAM = ['source_preserving_and_modality_native_memory', 'cross_represented_explicit_memory', 'internalized_latent_and_parametric_memory'];
const FAM_SHORT = ['Source & modality-specific', 'Cross-represented explicit', 'Latent & parametric'];
const FAM_COLOR = ['--m-video', '--m-audio', '--t1'];

/** Three overlapping family circles; each system sits in the region of its exact family set. */
export function venn(points: Pt[], W: number, H: number): Shape {
  // Fit the three circles inside the canvas: width spans 2(d·cos30° + R), height spans d·1.5 + 2R.
  const R = Math.min(W * 0.2, (W - 24) / 3.4, (H - 90) / 3.2);
  const d = R * 0.78;
  const cx = W / 2;
  const cy = H / 2 + R * 0.12;
  const narrow = W < 640;
  const LBL = narrow ? ['Source', 'Explicit', 'Latent'] : FAM_SHORT;
  // Native bottom-left, Cross bottom-right, Latent top.
  const ang = [150, 30, 270].map((a) => (a * Math.PI) / 180);
  const C = ang.map((a) => [cx + d * Math.cos(a), cy + d * Math.sin(a)] as [number, number]);

  const keyOf = (p: Pt) => FAM.map((f, i) => (p.families.includes(f) ? i : -1)).filter((i) => i >= 0).join('');
  const region = (k: string): [number, number] => {
    if (!k) return [cx, cy + R * 1.05]; // no family recorded: park below the diagram
    const idx = k.split('').map(Number);
    if (idx.length === 3) return [cx, cy];
    if (idx.length === 2) {
      const [a, b] = idx;
      const mx = (C[a][0] + C[b][0]) / 2;
      const my = (C[a][1] + C[b][1]) / 2;
      const other = 3 - a - b;
      const vx = mx - C[other][0];
      const vy = my - C[other][1];
      const L = Math.hypot(vx, vy) || 1;
      return [mx + (vx / L) * R * 0.12, my + (vy / L) * R * 0.12];
    }
    const i = idx[0];
    const vx = C[i][0] - cx;
    const vy = C[i][1] - cy;
    const L = Math.hypot(vx, vy) || 1;
    return [C[i][0] + (vx / L) * R * 0.38, C[i][1] + (vy / L) * R * 0.38];
  };

  const byKey = new Map<string, number[]>();
  points.forEach((p, i) => byKey.set(keyOf(p), [...(byKey.get(keyOf(p)) ?? []), i]));
  const maxN = Math.max(...[...byKey.values()].map((l) => l.length));
  const spacing = (R * 0.5) / Math.sqrt(maxN + 1);
  const pos: [number, number][] = new Array(points.length);
  for (const [k, idx] of byKey) {
    const [rx, ry] = region(k);
    const spots = pack(idx.length, rx, ry, spacing);
    idx.sort((a, b) => points[b].t - points[a].t).forEach((pi, j) => (pos[pi] = spots[j]));
  }
  const famCount = FAM.map((f) => points.filter((p) => p.families.includes(f)).length);
  // Family labels sit outside their circle: lower-left, lower-right, and above the top circle.
  const groups: Group[] = [
    { key: FAM[0], label: LBL[0], n: famCount[0], x: C[0][0] - R * 0.62, y: C[0][1] + R * 0.86 },
    { key: FAM[1], label: LBL[1], n: famCount[1], x: C[1][0] + R * 0.62, y: C[1][1] + R * 0.86 },
    { key: FAM[2], label: LBL[2], n: famCount[2], x: C[2][0], y: C[2][1] - R - 36 },
  ];
  const nc = byKey.get('01')?.length ?? 0;
  if (nc) groups.push({ key: 'nc', label: narrow ? 'Hybrid' : 'Hybrid: source + explicit', n: nc, x: cx, y: C[0][1] + R + 6 });
  return {
    pos,
    groups,
    decor: C.map(([x, y], i) => ({ kind: 'circle', x, y, r: R, c: FAM_COLOR[i] })),
    dot: Math.max(2.2, Math.min(4, spacing * 0.42)),
  };
}

const TIER_R: Record<string, number> = { T1: 0.17, T2: 0.3, T3: 0.42 };
const TIER_SPEED: Record<string, number> = { T1: 0, T2: 0.00008, T3: 0.00028 };
const TIER_LABEL: Record<string, string> = { T1: 'T1 Static', T2: 'T2 Dynamic', T3: 'T3 Self-evolving' };

/** Concentric orbits: T1 still, T2 slow, T3 fast. Positions are computed per frame from `orbit`. */
export function orbits(points: Pt[], W: number, H: number): Shape {
  const cx = W / 2;
  const cy = H / 2 + 8;
  const S = Math.min(W, H);
  const orbit: Orbit[] = new Array(points.length);
  const byTier = new Map<string, number[]>();
  points.forEach((p, i) => byTier.set(p.tier, [...(byTier.get(p.tier) ?? []), i]));
  for (const [t, idx] of byTier) {
    const base = S * (TIER_R[t] ?? 0.3);
    const lanes = idx.length > 120 ? 3 : idx.length > 40 ? 2 : 1;
    idx.forEach((pi, j) => {
      const lane = j % lanes;
      orbit[pi] = {
        cx,
        cy,
        r: base + (lane - (lanes - 1) / 2) * 9 + (hash(points[pi].id) - 0.5) * 3,
        a0: (j / idx.length) * Math.PI * 2 + lane * 0.7,
        speed: TIER_SPEED[t] ?? 0,
      };
    });
  }
  const pos = orbit.map((o) => [o.cx + o.r * Math.cos(o.a0), o.cy + o.r * Math.sin(o.a0)] as [number, number]);
  const groups: Group[] = ['T1', 'T2', 'T3'].map((t) => ({
    key: t,
    label: TIER_LABEL[t],
    n: byTier.get(t)?.length ?? 0,
    x: cx,
    y: cy - S * TIER_R[t] - 36,
  }));
  return {
    pos,
    groups,
    decor: ['T1', 'T2', 'T3'].map((t) => ({ kind: 'ring', x: cx, y: cy, r: S * TIER_R[t], c: `--t${t[1]}` })),
    dot: S < 400 ? 2.4 : 3.2,
    orbit,
  };
}

export const orbitPos = (o: Orbit, now: number): [number, number] => {
  const a = o.a0 + o.speed * now;
  return [o.cx + o.r * Math.cos(a), o.cy + o.r * Math.sin(a)];
};

const MODS = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'];
const MOD_SHORT: Record<string, string> = { image: 'Image', video_streaming: 'Video', audio_speech: 'Audio', gui: 'GUI', embodied_3d: 'Embodied' };
const MOD_COLOR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied' };

/** Five petals; length grows with count, distance from the core encodes publication date. */
export function bloom(points: Pt[], W: number, H: number): Shape {
  const cx = W / 2;
  const cy = H / 2 + 14;
  const S = Math.min(W, H) * (W < 640 ? 0.82 : 1);
  const byMod = new Map<string, number[]>();
  points.forEach((p, i) => byMod.set(p.modality, [...(byMod.get(p.modality) ?? []), i]));
  const nMax = Math.max(1, ...MODS.map((m) => byMod.get(m)?.length ?? 0));
  // Unknown modalities stay at the core so every point has a position.
  const pos: [number, number][] = points.map(() => [cx, cy]);
  const decor: Decor[] = [];
  const groups: Group[] = [];
  MODS.forEach((m, k) => {
    const idx = (byMod.get(m) ?? []).sort((a, b) => points[a].t - points[b].t);
    const angle = -Math.PI / 2 + (k / MODS.length) * Math.PI * 2;
    const len = S * (0.2 + 0.26 * Math.sqrt(idx.length / nMax));
    const width = len * 0.42;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    idx.forEach((pi, j) => {
      const u = 0.16 + 0.8 * (idx.length === 1 ? 0.5 : j / (idx.length - 1));
      const w = width * Math.sin(Math.PI * u) * 0.5;
      const off = (hash(points[pi].id) * 2 - 1) * w;
      pos[pi] = [cx + dx * u * len - dy * off, cy + dy * u * len + dx * off];
    });
    decor.push({ kind: 'petal', x: cx, y: cy, angle, len, width, c: MOD_COLOR[m] });
    groups.push({ key: m, label: MOD_SHORT[m], n: idx.length, x: cx + dx * (len + 22), y: cy + dy * (len + 22) - 14 });
  });
  return { pos, groups, decor, dot: S < 400 ? 2.4 : 3.2 };
}
