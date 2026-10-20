import { describe, expect, it } from 'vitest';
import systemsJson from '../src/data/generated/systems.json';
import benchmarksJson from '../src/data/generated/benchmarks.json';
import lineCounts from '../vendor/paper/raw/line_graph_counts.json';
import snapshot from '../vendor/paper/raw/snapshot.json';
import type { Benchmark, System } from '../src/data/normalize.ts';
import { crossMatrix, formationFlows, growthByModality, growthByTier } from '../src/lib/aggregate.ts';
import { stripTex } from '../src/data/normalize.ts';
import { LEAVES, T2_LEAF } from '../src/data/vocab.ts';

const systems = systemsJson as System[];
const benchmarks = benchmarksJson as Benchmark[];

// Exact paper numbers are checked on the systems that existed when the survey was published,
// so they keep holding as the corpus grows.
const snapIds = new Set(snapshot.systems);
const paperSystems = systems.filter((s) => snapIds.has(s.id));

describe('corpus matches the paper (snapshot)', () => {
  it('has 297 architectures split T1 76 / T2 204 / T3 17', () => {
    expect(paperSystems).toHaveLength(297);
    const tiers = { T1: 0, T2: 0, T3: 0 };
    for (const s of paperSystems) tiers[s.tier] += 1;
    expect(tiers).toEqual({ T1: 76, T2: 204, T3: 17 });
  });

  it('reproduces the 4x3 representation x tier matrix (fig_cross_matrix.tex)', () => {
    expect(crossMatrix(paperSystems)).toEqual({
      native: { T1: 23, T2: 26, T3: 0 },
      cross: { T1: 18, T2: 49, T3: 13 },
      latent: { T1: 7, T2: 22, T3: 0 },
      hybrid: { T1: 28, T2: 107, T3: 4 },
    });
  });

  it('marks only post-survey records as new', () => {
    for (const s of systems) expect(s.isNew).toBe(!snapIds.has(s.id));
  });

  it('reproduces the cumulative growth counts', () => {
    expect(growthByModality(paperSystems, lineCounts.years)).toEqual(lineCounts.primary_modality);
    expect(growthByTier(paperSystems, lineCounts.years)).toEqual(lineCounts.tier);
  });

});

describe('benchmarks (vendored Table 2)', () => {
  it('has 82 Table 2 benchmarks with nine coverage cells each', () => {
    const scored = benchmarks.filter((b) => b.coverage !== null);
    expect(scored).toHaveLength(82);
    for (const b of scored) expect(b.coverage).toHaveLength(9);
    for (const b of benchmarks.filter((x) => x.coverage === null)) expect(b.isNew).toBe(true);
  });
});

describe('record integrity', () => {
  it('keeps every snapshot system in the corpus', () => {
    expect(paperSystems.length).toBe(snapshot.systems.length);
  });

  it('gives every system a unique id, source URL, and known leaves', () => {
    expect(new Set(systems.map((s) => s.id)).size).toBe(systems.length);
    for (const s of systems) {
      expect(s.url).toMatch(/^https?:\/\//);
      if (s.pdf) expect(s.pdf).toMatch(/^https?:\/\//);
      for (const p of s.paths) expect(LEAVES).toContain(p.leaf);
      for (const o of s.t2) expect(Object.keys(T2_LEAF)).toContain(o.leaf);
    }
  });

  it('gives every benchmark a unique id and URL', () => {
    expect(new Set(benchmarks.map((b) => b.id)).size).toBe(benchmarks.length);
    for (const b of benchmarks) expect(b.url).toMatch(/^https?:\/\//);
  });

  it('conserves flow through the formation Sankey', () => {
    const links = formationFlows(systems);
    const sum = (prefix: string, side: 'source' | 'target') =>
      links.filter((l) => l[side].startsWith(prefix)).reduce((a, l) => a + l.value, 0);
    expect(sum('m:', 'source')).toBeCloseTo(sum('l:', 'source'), 6);
    expect(sum('s:', 'source')).toBeCloseTo(sum('r:', 'target'), 6);
  });
});

describe('stripTex', () => {
  it('removes citations and macros', () => {
    expect(stripTex('LoCoMo~\\citep{maharana2024evaluating}')).toBe('LoCoMo');
    expect(stripTex('\\textbf{ATM}-Bench')).toBe('ATM-Bench');
    expect(stripTex('M$^3$Exam')).toBe('M3Exam');
  });
});

describe('crossTab', () => {
  it('row totals match countBy for single-valued columns', async () => {
    const { crossTab, countBy } = await import('../src/lib/aggregate.ts');
    const { MODALITIES, TIERS } = await import('../src/data/vocab.ts');
    const m = crossTab(systems, (s) => s.tier, (s) => s.modality, TIERS, MODALITIES);
    const byTier = countBy(systems, (s) => s.tier);
    TIERS.forEach((t, i) => expect(m[i].reduce((a, b) => a + b, 0)).toBe(byTier[t]));
  });

  it('counts a system once per distinct multi-valued key', async () => {
    const { crossTab, leafCounts } = await import('../src/lib/aggregate.ts');
    const { LEAVES } = await import('../src/data/vocab.ts');
    const m = crossTab(systems, (s) => s.paths.map((p) => p.leaf), () => 'all', LEAVES, ['all']);
    const lc = leafCounts(systems);
    LEAVES.forEach((l, i) => expect(m[i][0]).toBe(lc[l] ?? 0));
  });
});

describe('benchmark text cleanup', () => {
  it('has no LaTeX left in task or ground-truth fields', () => {
    for (const b of benchmarks) {
      expect(b.name).not.toMatch(/[\\$]/);
      expect(b.task).not.toMatch(/\\/);
      expect(b.groundTruth).not.toMatch(/\\/);
    }
  });
});
