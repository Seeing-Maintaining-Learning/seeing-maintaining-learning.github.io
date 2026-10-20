/** Ready-to-render props for BarChart, built from the corpus with crossTab. */
import type { System } from '../data/normalize.ts';
import {
  LEAF_LABEL, LEAVES, MODALITIES, MODALITY_LABEL, RETRIEVAL_LABEL, STORAGE_LABEL, T2_LEAF, T2_OPS, T2_OP_LABEL, TIERS,
  TIER_LABEL,
} from '../data/vocab.ts';
import { crossTab, type Keyer } from './aggregate.ts';

interface Cat { key: string; label: string }

const MOD_SERIES = MODALITIES.map((m) => ({ key: m, label: MODALITY_LABEL[m], cls: `mod-${m}` }));
const TIER_SERIES = TIERS.map((t) => ({ key: t, label: `${t} ${TIER_LABEL[t]}`, cls: `tier-${t}` }));
const cats = (map: Record<string, string>, keys?: readonly string[]): Cat[] =>
  (keys ?? Object.keys(map).filter((k) => k !== 'unclear')).map((k) => ({ key: k, label: map[k] }));

function chart(systems: System[], rows: Cat[], rowKey: Keyer, by: 'modality' | 'tier', href: string) {
  const series = by === 'modality' ? MOD_SERIES : TIER_SERIES;
  const values = crossTab(systems, rowKey, (s: System) => (by === 'modality' ? s.modality : s.tier), rows.map((r) => r.key), series.map((s) => s.key));
  return { rows, series, values, href };
}

export const leafByModality = (systems: System[]) =>
  chart(systems, cats(LEAF_LABEL, LEAVES), (s) => s.paths.map((p) => p.leaf), 'modality', '/systems/?leaves={row}&modality={series}');

export const leafByTier = (systems: System[]) =>
  chart(systems, cats(LEAF_LABEL, LEAVES), (s) => s.paths.map((p) => p.leaf), 'tier', '/systems/?leaves={row}&tier={series}');

export const tierByModality = (systems: System[]) => {
  const rows = MODALITIES.map((m) => ({ key: m, label: MODALITY_LABEL[m] }));
  const values = crossTab(systems, (s) => s.modality, (s) => s.tier, MODALITIES, TIERS);
  return { rows, series: TIER_SERIES, values, href: '/systems/?modality={row}&tier={series}' };
};

export const storageByModality = (systems: System[]) =>
  chart(systems, cats(STORAGE_LABEL), (s) => s.paths.flatMap((p) => p.storage), 'modality', '/systems/?storage={row}&modality={series}');

export const retrievalByModality = (systems: System[]) =>
  chart(systems, cats(RETRIEVAL_LABEL), (s) => s.paths.flatMap((p) => p.retrieval), 'modality', '/systems/?retrieval={row}&modality={series}');

export const opsByModality = (systems: System[]) =>
  chart(
    systems,
    T2_OPS.map((o) => ({ key: o, label: T2_OP_LABEL[o] })),
    (s) => s.t2.map((o) => T2_LEAF[o.leaf]?.op).filter(Boolean) as string[],
    'modality',
    '/systems/?ops={row}&modality={series}',
  );
