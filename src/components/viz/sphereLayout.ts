/** 3D sphere layout for the hero: one spiral arm per modality, projected with a simple camera. */
import type { Pt } from './heroLayout.ts';

export interface P3 {
  x: number;
  y: number;
  z: number;
}

const ARMS = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'];

/** Unit-sphere positions: each modality is a spiral arm sweeping from pole to pole. */
export function spherePoints(points: Pt[]): { pts: P3[]; arms: number[][] } {
  const byArm = new Map<string, number[]>();
  points.forEach((p, i) => byArm.set(p.modality, [...(byArm.get(p.modality) ?? []), i]));
  const out: P3[] = new Array(points.length);
  const arms: number[][] = [];
  for (const [mod, idx] of byArm) {
    const arm = Math.max(0, ARMS.indexOf(mod));
    // Older systems near the south pole, newer toward the north: the arm grows over time.
    idx.sort((a, b) => points[a].t - points[b].t);
    idx.forEach((pi, k) => {
      const f = idx.length === 1 ? 0.5 : k / (idx.length - 1);
      const lat = (f - 0.5) * Math.PI * 0.86;
      const jitter = Math.sin(pi * 12.9898) * 0.32;
      const latJ = lat + Math.sin(pi * 4.1414) * 0.08;
      const lon = (arm / ARMS.length) * Math.PI * 2 + f * Math.PI * 1.15 + jitter;
      const r = 1 + Math.sin(pi * 78.233) * 0.05;
      out[pi] = { x: r * Math.cos(latJ) * Math.cos(lon), y: r * Math.sin(latJ), z: r * Math.cos(latJ) * Math.sin(lon) };
    });
    arms.push(idx);
  }
  return { pts: out, arms };
}

/** Rotate around Y (yaw) then X (pitch) and project; returns screen x, y and depth in [-1, 1]. */
export function project(p: P3, yaw: number, pitch: number, cx: number, cy: number, R: number) {
  const cyw = Math.cos(yaw);
  const syw = Math.sin(yaw);
  const x1 = p.x * cyw + p.z * syw;
  const z1 = -p.x * syw + p.z * cyw;
  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const y2 = p.y * cp - z1 * sp;
  const z2 = p.y * sp + z1 * cp;
  const persp = 1 / (1 + z2 * 0.25);
  return { x: cx + x1 * R * persp, y: cy - y2 * R * persp, depth: z2 };
}

/** Latitude rings and meridians for a faint wireframe. */
export function wireframe(): P3[][] {
  const lines: P3[][] = [];
  for (const lat of [-0.9, -0.45, 0, 0.45, 0.9]) {
    lines.push(Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return { x: Math.cos(lat) * Math.cos(a), y: Math.sin(lat), z: Math.cos(lat) * Math.sin(a) };
    }));
  }
  for (let m = 0; m < 6; m++) {
    const lon = (m / 6) * Math.PI;
    lines.push(Array.from({ length: 49 }, (_, i) => {
      const a = (i / 48) * Math.PI * 2;
      return { x: Math.cos(a) * Math.cos(lon), y: Math.sin(a), z: Math.cos(a) * Math.sin(lon) };
    }));
  }
  return lines;
}
