/** Normalize raw corpus / paper records into the compact shapes the site renders. */
import type { Family, Leaf, Modality, RepCategory, Tier } from './vocab.ts';
import { FAMILY_TO_CATEGORY, LEAVES, MODALITIES, TIERS } from './vocab.ts';

export interface Evidence {
  section: string;
  page: string;
  figure: string;
  text: string;
}

export interface RepPath {
  component: string;
  leaf: Leaf;
  storage: string[];
  retrieval: string[];
  sourceAccess: string;
  evidence: Evidence[];
}

export interface System {
  id: string;
  name: string;
  title: string;
  authors: string[];
  date: string;
  year: number;
  url: string;
  pdf: string | null;
  modality: Modality;
  secondary: string[];
  tier: Tier;
  families: Family[];
  hybrid: boolean;
  hybridRelation: string;
  category: RepCategory;
  paths: RepPath[];
  t2: { leaf: string; evidence: Evidence[] }[];
  t3: { leaf: string; evidence: Evidence[] }[];
  /** Added to the corpus after the survey's snapshot. */
  isNew: boolean;
  reviewStatus: string;
}

/** A record merged into the corpus but not yet fully classified (no tier or representation). */
export interface PendingSystem {
  id: string;
  name: string;
  title: string;
  authors: string[];
  date: string;
  year: number;
  url: string;
  pdf: string | null;
  modality: Modality;
  leaves: string[];
  tier: string;
  isNew: boolean;
  reviewStatus: string;
  notes: string[];
}

export type Coverage = 'direct' | 'partial' | 'none';

export interface Benchmark {
  id: string;
  name: string;
  title: string;
  cite: string;
  modality: Modality;
  source: string;
  task: string;
  groundTruth: string;
  /** Table 2 coverage; null for benchmarks added to the corpus after the survey. */
  coverage: Coverage[] | null;
  role: string;
  /** Marked ‡ in Table 2: cross-domain benchmark listed under its dominant setting. */
  crossDomain: boolean;
  isNew: boolean;
  url: string | null;
  rationale: string;
  authors: string[];
  date: string | null;
}

type Raw = Record<string, any>;

/** Keep only http(s) URLs; anything else (e.g. javascript:) becomes null. */
export const safeUrl = (u: unknown): string | null =>
  typeof u === 'string' && /^https?:\/\//i.test(u) ? u : null;

const evidence = (list: Raw[] | undefined): Evidence[] =>
  (list ?? []).map((e) => ({
    section: e.section ?? '',
    page: e.page ?? '',
    figure: e.figure_or_table ?? '',
    text: e.paraphrase ?? '',
  }));

/** True when the record carries enough classification to enter the survey's charts. */
export function isClassified(input: unknown): boolean {
  const r = input as Raw;
  const paths = (r.representation_paths ?? []) as Raw[];
  return (
    MODALITIES.includes(r.primary_modality) &&
    TIERS.includes(r.derived?.highest_management_tier) &&
    paths.length > 0 &&
    paths.every((p) => LEAVES.includes(p.leaf)) &&
    (r.derived?.representation_parent_families ?? []).length > 0
  );
}

export function normalizePending(input: unknown, isNew: boolean): PendingSystem | null {
  const r = input as Raw;
  if (!MODALITIES.includes(r.primary_modality)) return null;
  const v = r.provenance?.latest_version ?? {};
  const date: string = v.published_date ?? '';
  return {
    id: r.architecture_id,
    name: r.architecture_name,
    title: r.provenance?.paper_title || r.architecture_name,
    authors: r.provenance?.authors ?? [],
    date,
    year: Number(date.slice(0, 4)) || 0,
    url: safeUrl(v.source_url) ?? '',
    pdf: safeUrl(v.pdf_url),
    modality: r.primary_modality,
    leaves: ((r.representation_paths ?? []) as Raw[]).map((p) => p.leaf).filter((l) => LEAVES.includes(l)),
    tier: r.derived?.highest_management_tier ?? 'unclear',
    isNew,
    reviewStatus: r.review_status ?? '',
    notes: r.adjudication_notes ?? [],
  };
}

/** A corpus benchmark record that is not part of the survey's Table 2. */
export function normalizeCorpusBenchmark(input: unknown, isNew: boolean): Benchmark | null {
  const r = input as Raw;
  if (!MODALITIES.includes(r.primary_modality)) return null;
  const v = r.paper?.latest_version ?? {};
  return {
    id: r.benchmark_id,
    name: r.benchmark_name,
    title: r.paper?.title || r.benchmark_name,
    cite: '',
    modality: r.primary_modality,
    source: '',
    task: '',
    groundTruth: '',
    coverage: null,
    role: r.scope_status ?? '',
    crossDomain: false,
    isNew,
    url: safeUrl(v.source_url),
    rationale: '',
    authors: r.paper?.authors ?? [],
    date: v.published_date || null,
  };
}

export function normalizeSystem(input: unknown, isNew = false): System {
  const r = input as Raw;
  const v = r.provenance?.latest_version ?? {};
  const families = (r.derived?.representation_parent_families ?? []) as Family[];
  const hybrid = Boolean(r.derived?.cross_representation_hybrid);
  if (!MODALITIES.includes(r.primary_modality)) throw new Error(`Unknown modality in ${r.architecture_id}`);
  const date: string = v.published_date ?? '';
  return {
    id: r.architecture_id,
    name: r.architecture_name,
    title: r.provenance?.paper_title ?? r.architecture_name,
    authors: r.provenance?.authors ?? [],
    date,
    year: Number(date.slice(0, 4)),
    url: safeUrl(v.source_url) ?? '',
    pdf: safeUrl(v.pdf_url),
    modality: r.primary_modality,
    secondary: r.secondary_modalities ?? [],
    tier: r.derived?.highest_management_tier,
    families,
    hybrid,
    hybridRelation: r.derived?.hybrid_relation ?? '',
    category: hybrid ? 'hybrid' : FAMILY_TO_CATEGORY[families[0]],
    paths: (r.representation_paths ?? []).map((p: Raw) => ({
      component: p.memory_component ?? '',
      leaf: p.leaf,
      storage: p.storage_indexing ?? [],
      retrieval: p.retrieval_activation ?? [],
      sourceAccess: p.source_accessibility ?? 'unclear',
      evidence: evidence(p.evidence),
    })),
    t2: (r.t2_operations ?? []).map((o: Raw) => ({ leaf: o.leaf, evidence: evidence(o.evidence) })),
    t3: (r.t3_policy_evolution_targets ?? []).map((o: Raw) => ({ leaf: o.leaf, evidence: evidence(o.evidence) })),
    isNew,
    reviewStatus: r.review_status ?? '',
  };
}

const FAMILY_TO_MODALITY: Record<string, Modality> = {
  Image: 'image',
  Video: 'video_streaming',
  Audio: 'audio_speech',
  GUI: 'gui',
  Embodied: 'embodied_3d',
};

/** Strip LaTeX markup from Table 2 cells (e.g. "LoCoMo~\citep{x}"). */
export const stripTex = (s: string): string =>
  s
    .replace(/\\mmSlash\s*/g, '/')
    .replace(/\\mmPlus\s*/g, '+')
    .replace(/\$\^\{?([^}$]*)\}?\$/g, '$1')
    .replace(/\$([^$]*)\$/g, '$1')
    .replace(/~?\\cite[pt]?\{[^}]*\}/g, '')
    .replace(/\\textsuperscript\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .replace(/\\&/g, '&')
    .replace(/~/g, ' ')
    .trim();

export const slugify = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export function normalizeBenchmark(row: Raw, review: Raw | undefined, record: unknown): Benchmark {
  const rec = (record ?? {}) as Raw;
  const crossDomain = /\\mmCrossDomain/.test(row.name);
  const name = stripTex(row.name.replace(/\\mmCrossDomain/g, ''));
  const v = rec.paper?.latest_version ?? {};
  return {
    id: review?.id ?? slugify(name),
    name,
    title: rec.paper?.title ?? review?.title ?? name,
    cite: row.citation,
    modality: FAMILY_TO_MODALITY[row.family],
    source: row.source,
    task: stripTex(row.task),
    groundTruth: stripTex(row.ground_truth),
    coverage: row.coverage,
    role: row.evaluation_role,
    crossDomain,
    isNew: false,
    url: safeUrl(v.source_url) ?? safeUrl(review?.source),
    rationale: review?.rationale ?? '',
    authors: rec.paper?.authors ?? [],
    date: v.published_date ?? null,
  };
}
