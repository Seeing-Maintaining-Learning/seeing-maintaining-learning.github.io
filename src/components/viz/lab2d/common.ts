/** Shared helpers for the 2D lens prototypes. */
import type { Pt } from '../heroLayout.ts';

export type { Pt };
export type ColorBy = 'modality' | 'tier';

export const MODS = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'] as const;
export const MOD_NAME: Record<string, string> = { image: 'Image', video_streaming: 'Video', audio_speech: 'Audio', gui: 'GUI', embodied_3d: 'Embodied' };
export const MOD_VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied' };
export const TIERS = ['T1', 'T2', 'T3'] as const;
export const TIER_NAME: Record<string, string> = { T1: 'T1 Static', T2: 'T2 Dynamic', T3: 'T3 Self-evolving' };
export const FAM = ['source_preserving_and_modality_native_memory', 'cross_represented_explicit_memory', 'internalized_latent_and_parametric_memory'] as const;
export const FAM_NAME = ['Source & modality-specific', 'Cross-represented explicit', 'Latent & parametric'];
export const FAM_SHORT = ['Source', 'Explicit', 'Latent'];
export const FAM_VAR = ['--m-video', '--m-audio', '--t1'];
export const CAT = ['native', 'cross', 'latent', 'hybrid'] as const;
export const CAT_NAME: Record<string, string> = { native: 'Source & modality-specific', cross: 'Cross-represented explicit', latent: 'Latent & parametric', hybrid: 'Hybrid' };
export const CAT_VAR: Record<string, string> = { native: '--m-video', cross: '--m-audio', latent: '--t1', hybrid: '--accent' };
export const CAT_ICON: Record<string, string> = {
  native: 'source_preserving_and_modality_native_memory',
  cross: 'cross_represented_explicit_memory',
  latent: 'internalized_latent_and_parametric_memory',
  hybrid: 'hybrid',
};

/** CSS custom property used to colour a point. */
export const fill = (p: Pt, by: ColorBy) => `var(${by === 'modality' ? MOD_VAR[p.modality] : `--t${p.tier[1]}`})`;

export const polar = (cx: number, cy: number, r: number, a: number): [number, number] => [cx + r * Math.cos(a), cy + r * Math.sin(a)];

export const hash = (s: string, k = 0) => {
  let h = 2166136261 ^ k;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return ((h >>> 0) % 100000) / 100000;
};

/** Stable family-set key: indices of FAM joined, e.g. "01" for source + explicit. */
export const famKey = (p: Pt) => FAM.map((f, i) => (p.families.includes(f) ? String(i) : '')).join('');

export function groupBy<T>(xs: T[], key: (x: T) => string): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) ?? []), x]);
  return m;
}
