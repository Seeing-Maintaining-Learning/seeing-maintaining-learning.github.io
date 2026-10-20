import { describe, expect, it } from 'vitest';
import { MAX_URL, arxivIndex, emptyDraft, issueUrl, parseArxivId, tierOf } from '../src/lib/contribute.ts';

const L = {
  modality: { image: 'Image' },
  leaf: { perception_to_text_records_and_summaries: 'Perception-to-text records & summaries' },
  storage: {},
  retrieval: {},
  tier: { T1: 'Static memory', T2: 'Dynamic memory', T3: 'Self-evolving memory' },
  op: { update: 'Update' },
  t3: {},
};

describe('parseArxivId', () => {
  it.each([
    ['2610.19366', '2610.19366'],
    ['arXiv:2610.19366', '2610.19366'],
    ['https://arxiv.org/abs/2610.19366v2', '2610.19366'],
    ['https://arxiv.org/pdf/2403.07952', '2403.07952'],
    ['https://arxiv.org/pdf/2403.07952v1.pdf', '2403.07952'],
    ['https://huggingface.co/papers/2610.19366', '2610.19366'],
    ['https://arxiv.org/html/2505.18079v3', '2505.18079'],
  ])('%s -> %s', (input, id) => expect(parseArxivId(input)).toBe(id));

  it('rejects non-arXiv input', () => {
    expect(parseArxivId('https://doi.org/10.1609/aaai.v40i8.37523')).toBeNull();
    expect(parseArxivId('hello')).toBeNull();
  });
});

describe('arxivIndex', () => {
  it('indexes arXiv-hosted records only', () => {
    const idx = arxivIndex([
      { url: 'https://arxiv.org/abs/2403.07952', path: '/systems/a/' },
      { url: 'https://doi.org/10.1/x', path: '/systems/b/' },
      { url: null, path: '/systems/c/' },
    ]);
    expect(idx).toEqual({ '2403.07952': '/systems/a/' });
  });
});

describe('tierOf', () => {
  it('derives the tier from the two questions', () => {
    const d = emptyDraft();
    expect(tierOf(d)).toBeNull();
    expect(tierOf({ ...d, memoryChanges: false })).toBe('T1');
    expect(tierOf({ ...d, memoryChanges: true })).toBeNull();
    expect(tierOf({ ...d, memoryChanges: true, policyEvolves: false })).toBe('T2');
    expect(tierOf({ ...d, memoryChanges: true, policyEvolves: true })).toBe('T3');
  });
});

describe('issueUrl', () => {
  it('targets the corpus issue form and encodes fields', () => {
    const d = { ...emptyDraft(), arxiv: '2610.19366', name: 'Test & Mem', title: 'A paper', modality: 'image', memoryChanges: false };
    const u = new URL(issueUrl(d, L));
    expect(u.pathname).toBe('/Seeing-Maintaining-Learning/multimodal-agent-memory-evolution/issues/new');
    expect(u.searchParams.get('template')).toBe('paper-submission.yml');
    expect(u.searchParams.get('system_name')).toBe('Test & Mem');
    expect(u.searchParams.get('classification')).toContain('Suggested tier: T1 Static memory');
  });

  it('trims long evidence to stay under the URL limit', () => {
    const d = { ...emptyDraft(), arxiv: '2610.19366', evidence: 'x'.repeat(20000) };
    const url = issueUrl(d, L);
    expect(url.length).toBeLessThanOrEqual(MAX_URL);
    expect(new URL(url).searchParams.get('evidence')).toMatch(/…$/);
  });
});
