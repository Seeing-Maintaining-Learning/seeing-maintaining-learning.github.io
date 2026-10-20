/** Helpers for the "Submit a paper" wizard: arXiv parsing, duplicate lookup, issue URL building. */

export const CORPUS_REPO = 'Seeing-Maintaining-Learning/multimodal-agent-memory-evolution';
export const ISSUE_TEMPLATE = 'paper-submission.yml';
/** GitHub rejects very long URLs; stay well under common limits. */
export const MAX_URL = 7000;

export interface Draft {
  arxiv: string;
  title: string;
  authors: string;
  name: string;
  kind: 'architecture' | 'benchmark';
  modality: string;
  secondary: string[];
  leaves: string[];
  storage: string[];
  retrieval: string[];
  memoryChanges: boolean | null;
  policyEvolves: boolean | null;
  ops: string[];
  t3: string[];
  evidence: string;
  relation: 'author' | 'reader' | '';
  github: string;
}

export const emptyDraft = (): Draft => ({
  arxiv: '',
  title: '',
  authors: '',
  name: '',
  kind: 'architecture',
  modality: '',
  secondary: [],
  leaves: [],
  storage: [],
  retrieval: [],
  memoryChanges: null,
  policyEvolves: null,
  ops: [],
  t3: [],
  evidence: '',
  relation: '',
  github: '',
});

/** Extract a new-style arXiv ID (e.g. 2610.19366) from an ID, abs/pdf/html URL, or Hugging Face paper URL. */
export function parseArxivId(input: string): string | null {
  const m = input.trim().match(/(?:^|[/:\s])(\d{4}\.\d{4,5})(?:v\d+)?(?:\.pdf)?(?:[/?#\s]|$)/);
  return m ? m[1] : null;
}

/** Map arXiv ID -> page path for every corpus record whose source URL is on arXiv. */
export function arxivIndex(records: { url: string | null; path: string }[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of records) {
    const id = r.url ? parseArxivId(r.url) : null;
    if (id) out[id] = r.path;
  }
  return out;
}

export const tierOf = (d: Draft): 'T1' | 'T2' | 'T3' | null =>
  d.memoryChanges === null ? null : !d.memoryChanges ? 'T1' : d.policyEvolves === null ? null : d.policyEvolves ? 'T3' : 'T2';

type Labels = Record<string, Record<string, string>>;

/** Structured summary placed in the issue's classification field and the Markdown fallback. */
export function classification(d: Draft, L: Labels): string {
  const NS = 'not specified';
  const list = (keys: string[], map: Record<string, string>) => (keys.length ? keys.map((k) => map[k] ?? k).join(', ') : NS);
  const tier = tierOf(d);
  const lines = [
    `- Authors: ${d.authors ? (d.authors.length > 300 ? `${d.authors.slice(0, 297)}…` : d.authors) : NS}`,
    `- Submitted by: ${d.github ? `@${d.github.replace(/^@/, '')}` : NS}`,
    `- Record type: ${d.kind === 'architecture' ? 'Architecture (memory system)' : 'Benchmark / evaluation resource'}`,
    `- Primary modality: ${L.modality[d.modality] ?? NS}`,
    `- Secondary modalities: ${list(d.secondary, L.modality)}`,
    `- Representation: ${list(d.leaves, L.leaf)}`,
    `- Storage / indexing: ${list(d.storage, L.storage)}`,
    `- Retrieval / activation: ${list(d.retrieval, L.retrieval)}`,
    `- Suggested tier: ${tier ? `${tier} ${L.tier[tier]}` : NS}`,
  ];
  if (tier === 'T2' || tier === 'T3') lines.push(`- T2 operations: ${list(d.ops, L.op)}`);
  if (tier === 'T3') lines.push(`- T3 policy targets: ${list(d.t3, L.t3)}`);
  return lines.join('\n');
}

export function issueTitle(d: Draft): string {
  const t = d.title.length > 90 ? `${d.title.slice(0, 87)}…` : d.title;
  if (d.name && t) return `[Paper] ${d.name}: ${t}`;
  return `[Paper] ${d.name || t || (d.arxiv ? `arXiv:${d.arxiv}` : 'New submission')}`;
}

/** Build the pre-filled issue form URL. Long free text is trimmed so the URL stays under MAX_URL. */
export function issueUrl(d: Draft, L: Labels): string {
  const base = `https://github.com/${CORPUS_REPO}/issues/new`;
  const make = (evidence: string) => {
    const q = new URLSearchParams({
      template: ISSUE_TEMPLATE,
      title: issueTitle(d),
      arxiv: d.arxiv ? `https://arxiv.org/abs/${d.arxiv}` : '',
      paper_title: d.title.length > 300 ? `${d.title.slice(0, 297)}…` : d.title,
      system_name: d.name,
      kind: d.kind === 'architecture' ? 'Architecture (memory system)' : 'Benchmark / evaluation resource',
      modality: L.modality[d.modality] ?? '',
      classification: classification(d, L),
      evidence,
      relation: d.relation === 'author' ? 'I am an author of this paper' : d.relation === 'reader' ? 'I am not an author' : '',
    });
    return `${base}?${q.toString()}`;
  };
  let ev = d.evidence;
  let url = make(ev);
  while (url.length > MAX_URL && ev.length > 0) {
    ev = ev.slice(0, Math.max(0, ev.length - 200));
    url = make(ev ? `${ev}…` : '');
  }
  return url;
}

export function markdown(d: Draft, L: Labels): string {
  return [
    `### ${issueTitle(d)}`,
    '',
    `**arXiv:** ${d.arxiv ? `https://arxiv.org/abs/${d.arxiv}` : '—'}`,
    `**Authors:** ${d.authors || '—'}`,
    '',
    '**Classification**',
    classification(d, L),
    '',
    '**Evidence in the paper**',
    d.evidence || '—',
    '',
    `**Submitted by:** ${d.github ? `@${d.github.replace(/^@/, '')}` : 'anonymous'} (${d.relation || 'relation not given'})`,
  ].join('\n');
}
