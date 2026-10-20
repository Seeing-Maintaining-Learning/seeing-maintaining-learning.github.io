/** Data for the home-page memory observatory panels. */
import type { System } from '../data/normalize.ts';
import {
  LEAF_SHORT, LEAVES, MODALITIES, MODALITY_LABEL, RETRIEVAL_LABEL, STORAGE_LABEL, T3_TARGET_LABEL, TIERS, TIER_LABEL, label,
} from '../data/vocab.ts';
import { hash } from './hash.ts';

const byDate = (a: System, b: System) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name);

export const scanItem = (s: System) => {
  const p = s.paths[0];
  return {
    id: s.id,
    name: s.name,
    title: s.title,
    modality: s.modality,
    modalityLabel: MODALITY_LABEL[s.modality],
    tier: s.tier,
    tierLabel: TIER_LABEL[s.tier],
    date: s.date,
    flow: p
      ? [LEAF_SHORT[p.leaf], label(STORAGE_LABEL, p.storage[0] ?? 'unclear'), label(RETRIEVAL_LABEL, p.retrieval[0] ?? 'unclear')]
      : [],
  };
};

/** Rotation for the scan card: the newest system of each modality × tier, newest first. */
export function scanItems(systems: System[]) {
  const seen = new Set<string>();
  return [...systems]
    .sort(byDate)
    .filter((s) => {
      const k = `${s.modality}|${s.tier}`;
      if (seen.has(k) || !s.paths.length) return false;
      seen.add(k);
      return true;
    })
    .map(scanItem);
}

export const latest = (systems: System[], n = 8) => [...systems].sort(byDate).slice(0, n).map(scanItem);

export const spectrum = (systems: System[]) =>
  LEAVES.map((l) => ({
    key: l,
    label: LEAF_SHORT[l].split(/[ &]/)[0],
    values: MODALITIES.map((m) => systems.filter((s) => s.modality === m && s.paths.some((p) => p.leaf === l)).length),
  }));

const HINT: Record<string, string> = {
  T1: 'Built once, then reused',
  T2: 'Memory changes; rules stay fixed',
  T3: 'Feedback rewrites the rules',
};
export const ladder = (systems: System[]) =>
  TIERS.map((t) => ({ tier: t, label: TIER_LABEL[t], hint: HINT[t], values: MODALITIES.map((m) => systems.filter((s) => s.tier === t && s.modality === m).length) }));

/** Spotlight: the five newest self-evolving (T3) systems. */
export const spotlight = (systems: System[]) =>
  systems
    .filter((s) => s.tier === 'T3')
    .sort(byDate)
    .slice(0, 5)
    .map((s) => ({
      id: s.id,
      name: s.name,
      title: s.title,
      modality: s.modality,
      modalityLabel: MODALITY_LABEL[s.modality],
      date: s.date,
      evolves: s.t3.map((o) => label(T3_TARGET_LABEL, o.leaf).toLowerCase()),
      forms: [...new Set(s.paths.map((p) => LEAF_SHORT[p.leaf].toLowerCase()))],
    }));

export const ringDots = (systems: System[]) =>
  systems.map((s) => ({ id: s.id, tier: s.tier, modality: s.modality, a: hash(s.id) * Math.PI * 2 }));

/** Call-out cards for the sphere: newest systems, T3 systems and the largest hybrids. */
export function callouts(systems: System[]) {
  const newest = [...systems].sort(byDate).slice(0, 3).map((s) => ({ id: s.id, kicker: `Newest · ${s.date}`, title: s.name, sub: s.title }));
  const t3 = systems.filter((s) => s.tier === 'T3').sort(byDate).slice(0, 3)
    .map((s) => ({ id: s.id, kicker: 'Self-evolving · T3', title: s.name, sub: s.title }));
  const hybrid = systems.filter((s) => s.hybrid).sort((a, b) => b.paths.length - a.paths.length || byDate(a, b)).slice(0, 3)
    .map((s) => ({ id: s.id, kicker: `Hybrid · ${s.paths.length} memory paths`, title: s.name, sub: s.title }));
  // Interleave so each group of three shows one of each.
  return [0, 1, 2].flatMap((i) => [newest[i], t3[i], hybrid[i]].filter(Boolean));
}
