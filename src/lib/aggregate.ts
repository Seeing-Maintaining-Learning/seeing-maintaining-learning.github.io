/** Pure aggregations over the normalized corpus, shared by pages and visualizations. */
import type { System } from '../data/normalize.ts';
import type { Modality, RepCategory, Tier } from '../data/vocab.ts';
import { LEAF_FAMILY, LEAVES, MODALITIES, REP_CATEGORIES, T2_LEAF, TIERS } from '../data/vocab.ts';

export const countBy = <T>(items: T[], key: (t: T) => string | string[]): Record<string, number> => {
  const out: Record<string, number> = {};
  for (const item of items) {
    const keys = key(item);
    for (const k of Array.isArray(keys) ? new Set(keys) : [keys]) out[k] = (out[k] ?? 0) + 1;
  }
  return out;
};

/** The paper's exclusive representation-category x highest-tier matrix. */
export function crossMatrix(systems: System[]): Record<RepCategory, Record<Tier, number>> {
  const m = Object.fromEntries(
    REP_CATEGORIES.map((c) => [c, Object.fromEntries(TIERS.map((t) => [t, 0]))]),
  ) as Record<RepCategory, Record<Tier, number>>;
  for (const s of systems) m[s.category][s.tier] += 1;
  return m;
}

/** Cumulative counts per year, keyed by the given grouping. */
export function cumulativeByYear<K extends string>(
  systems: System[],
  years: number[],
  groups: readonly K[],
  key: (s: System) => K,
): Record<K, number[]> {
  const out = Object.fromEntries(groups.map((g) => [g, years.map(() => 0)])) as Record<K, number[]>;
  for (const s of systems) {
    years.forEach((y, i) => {
      if (s.year <= y) out[key(s)][i] += 1;
    });
  }
  return out;
}

export const growthByModality = (systems: System[], years: number[]) =>
  cumulativeByYear<Modality>(systems, years, MODALITIES, (s) => s.modality);

export const growthByTier = (systems: System[], years: number[]) =>
  cumulativeByYear<Tier>(systems, years, TIERS, (s) => s.tier);

/** Number of systems with at least one path in each representation leaf. */
export const leafCounts = (systems: System[]) => countBy(systems, (s) => s.paths.map((p) => p.leaf));

export const t2OpCounts = (systems: System[]) =>
  countBy(systems, (s) => s.t2.map((o) => T2_LEAF[o.leaf]?.op ?? 'other'));

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  modality: string;
}

/**
 * Formation flow: modality -> leaf -> storage -> retrieval, with each band keeping its modality.
 * Each representation path contributes one unit, split evenly across its storage and
 * retrieval mechanisms so that flow is conserved at every stage.
 */
export function formationFlows(systems: System[]): SankeyLink[] {
  const acc = new Map<string, number>();
  const add = (a: string, b: string, m: string, v: number) => {
    const k = `${a}|${b}|${m}`;
    acc.set(k, (acc.get(k) ?? 0) + v);
  };
  for (const s of systems) {
    const m = s.modality;
    for (const p of s.paths) {
      const storage = p.storage.filter((x) => x !== 'unclear');
      const retrieval = p.retrieval.filter((x) => x !== 'unclear');
      if (!storage.length || !retrieval.length) continue;
      add(`m:${m}`, `l:${p.leaf}`, m, 1);
      for (const st of storage) {
        add(`l:${p.leaf}`, `s:${st}`, m, 1 / storage.length);
        for (const rt of retrieval) add(`s:${st}`, `r:${rt}`, m, 1 / storage.length / retrieval.length);
      }
    }
  }
  return [...acc].map(([k, value]) => {
    const [source, target, modality] = k.split('|');
    return { source, target, value, modality };
  });
}

/** Which families are combined by hybrid systems (unordered pairs). */
export function hybridPairs(systems: System[]): Record<string, number> {
  return countBy(
    systems.filter((s) => s.hybrid && s.families.length > 1),
    (s) => {
      const f = [...s.families].sort();
      return f.flatMap((a, i) => f.slice(i + 1).map((b) => `${a}|${b}`));
    },
  );
}

export const leavesByFamily = () =>
  LEAVES.reduce<Record<string, string[]>>((acc, l) => {
    (acc[LEAF_FAMILY[l]] ??= []).push(l);
    return acc;
  }, {});

/** Systems sharing a leaf with `s`, ranked by overlap; used for "related systems". */
export function related(s: System, all: System[], n = 6): System[] {
  const leaves = new Set(s.paths.map((p) => p.leaf));
  return all
    .filter((o) => o.id !== s.id)
    .map((o) => ({
      o,
      score:
        o.paths.filter((p) => leaves.has(p.leaf)).length * 2 +
        (o.modality === s.modality ? 1 : 0) +
        (o.tier === s.tier ? 1 : 0),
    }))
    .filter((x) => x.score > 2)
    .sort((a, b) => b.score - a.score || a.o.name.localeCompare(b.o.name))
    .slice(0, n)
    .map((x) => x.o);
}

export type Keyer = (s: System) => string | string[];

/**
 * Cross-tabulate systems by two keys. Multi-valued keys count a system once per distinct value,
 * so row totals equal `countBy` for the row key restricted to the given columns.
 */
export function crossTab(
  systems: System[],
  rowKey: Keyer,
  colKey: Keyer,
  rows: readonly string[],
  cols: readonly string[],
): number[][] {
  const ri = new Map(rows.map((r, i) => [r, i]));
  const ci = new Map(cols.map((c, i) => [c, i]));
  const m = rows.map(() => cols.map(() => 0));
  for (const s of systems) {
    const rk = rowKey(s);
    const ck = colKey(s);
    for (const r of new Set(Array.isArray(rk) ? rk : [rk])) {
      for (const c of new Set(Array.isArray(ck) ? ck : [ck])) {
        const i = ri.get(r);
        const j = ci.get(c);
        if (i !== undefined && j !== undefined) m[i][j] += 1;
      }
    }
  }
  return m;
}
