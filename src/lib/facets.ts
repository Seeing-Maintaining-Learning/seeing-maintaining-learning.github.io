/** Explorer rows and facet definitions derived from the corpus. */
import type { System } from '../data/normalize.ts';
import {
  LEAF_LABEL, LEAVES, MODALITIES, MODALITY_LABEL, REP_CATEGORIES, REP_CATEGORY_LABEL, RETRIEVAL_LABEL,
  STORAGE_LABEL, T2_LEAF, T2_OPS, T2_OP_LABEL, T3_TARGET_LABEL, TIERS, TIER_LABEL,
} from '../data/vocab.ts';

export const toRow = (s: System) => ({
  id: s.id,
  name: s.name,
  title: s.title,
  year: s.year,
  period: s.year <= 2022 ? 'early' : String(s.year),
  modality: s.modality,
  tier: s.tier,
  category: s.category,
  leaves: [...new Set(s.paths.map((p) => p.leaf))],
  storage: [...new Set(s.paths.flatMap((p) => p.storage))],
  retrieval: [...new Set(s.paths.flatMap((p) => p.retrieval))],
  ops: [...new Set(s.t2.map((o) => T2_LEAF[o.leaf]?.op).filter(Boolean))] as string[],
  t3: [...new Set(s.t3.map((o) => o.leaf))],
  isNew: s.isNew,
});

const pick = (map: Record<string, string>) => Object.entries(map).filter(([k]) => k !== 'unclear');

export const FACETS = [
  { key: 'modality', label: 'Modality', options: MODALITIES.map((m) => [m, MODALITY_LABEL[m]]) },
  { key: 'tier', label: 'Management tier', options: TIERS.map((t) => [t, `${t} · ${TIER_LABEL[t]}`]) },
  { key: 'category', label: 'Representation', options: REP_CATEGORIES.map((c) => [c, REP_CATEGORY_LABEL[c]]) },
  { key: 'leaves', label: 'Representation leaf', options: LEAVES.map((l) => [l, LEAF_LABEL[l]]) },
  { key: 'storage', label: 'Storage & indexing', options: pick(STORAGE_LABEL) },
  { key: 'retrieval', label: 'Retrieval & activation', options: pick(RETRIEVAL_LABEL) },
  { key: 'ops', label: 'T2 operation', options: T2_OPS.map((o) => [o, T2_OP_LABEL[o]]) },
  { key: 't3', label: 'T3 policy target', options: Object.entries(T3_TARGET_LABEL) },
  { key: 'period', label: 'Year', options: [['2026', '2026'], ['2025', '2025'], ['2024', '2024'], ['2023', '2023'], ['early', '2022 and earlier']] },
] as { key: string; label: string; options: [string, string][] }[];
