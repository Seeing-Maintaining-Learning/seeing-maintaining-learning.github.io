// Contract between the corpus's accept-submission bot (draft records) and the site's normalizer.
import { describe, expect, it } from 'vitest';
import { isClassified, normalizePending, normalizeSystem } from '../src/data/normalize.ts';

const base = {
  schema_version: '1.0.0',
  record_type: 'architecture',
  architecture_id: 'testmem-2026',
  architecture_name: 'TestMem',
  primary_modality: 'video_streaming',
  secondary_modalities: [],
  provenance: {
    paper_title: 'TestMem: a paper',
    authors: ['A. Author'],
    latest_version: {
      version_label: 'latest arXiv version fetched 2026-10-20',
      published_date: '2026-10-14',
      source_url: 'https://arxiv.org/abs/2610.19366',
      pdf_url: 'https://arxiv.org/pdf/2610.19366',
      doi: '10.48550/arXiv.2610.19366',
    },
    reviewed_on: '2026-10-20',
    supersedes_or_extends: [],
  },
  t2_operations: [],
  t3_policy_evolution_targets: [],
  review_status: 'community_submitted',
  adjudication_notes: ['Draft generated from submission issue #12'],
};

const minimal = {
  ...base,
  representation_paths: [],
  derived: { representation_parent_families: [], cross_representation_hybrid: false, hybrid_relation: '', highest_management_tier: 'unclear' },
};

const full = {
  ...base,
  representation_paths: [
    {
      path_id: 'path_1',
      memory_component: 'to be described by maintainers',
      leaf: 'perception_to_text_records_and_summaries',
      storage_indexing: ['vector_indexed_collection'],
      retrieval_activation: ['similarity_based_retrieval'],
      source_accessibility: 'unclear',
      evidence: [],
    },
  ],
  derived: {
    representation_parent_families: ['cross_represented_explicit_memory'],
    cross_representation_hybrid: false,
    hybrid_relation: '',
    highest_management_tier: 'T2',
  },
};

describe('community draft records', () => {
  it('treats a minimal draft (arXiv + modality only) as pending', () => {
    expect(isClassified(minimal)).toBe(false);
    const p = normalizePending(minimal, true)!;
    expect(p).toMatchObject({ id: 'testmem-2026', modality: 'video_streaming', isNew: true, reviewStatus: 'community_submitted', year: 2026 });
    expect(p.url).toBe('https://arxiv.org/abs/2610.19366');
  });

  it('treats a classified draft as a full system', () => {
    expect(isClassified(full)).toBe(true);
    const s = normalizeSystem(full, true);
    expect(s).toMatchObject({ tier: 'T2', category: 'cross', isNew: true, reviewStatus: 'community_submitted' });
  });

  it('drops records with an unknown modality', () => {
    expect(normalizePending({ ...minimal, primary_modality: 'smell' }, true)).toBeNull();
  });
});
