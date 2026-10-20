/** Paper metadata, vendored from the survey manuscript (main.tex, content/frontmatter/affiliations.json). */
import affiliations from '../../vendor/paper/raw/affiliations.json';

export const TITLE = 'Seeing, Maintaining, and Learning';
export const SUBTITLE = 'The Evolution of Multimodal Agent Memory';
export const FULL_TITLE = `${TITLE}: ${SUBTITLE}`;

export const LINKS = {
  openreview: 'https://openreview.net/forum?id=5u8ag6LBFH',
  corpus: 'https://github.com/Seeing-Maintaining-Learning/multimodal-agent-memory-evolution',
  arxiv: null as string | null,
};

export const ABSTRACT: string[] = [
  'Multimodal models and agents have emerged to enable AI systems to learn from and interact with the real world more like humans by integrating information across multiple modalities. However, enabling multimodal agents to continually acquire useful information from complex, heterogeneous multimodal data remains a significant challenge as they move toward long-horizon tasks and lifelong settings. Addressing this challenge requires effective memory mechanisms that can maintain continuity across sessions, adapt to changing users and environments, and refine memory-management policies through accumulated experience.',
  'We introduce a two-axis analytical framework for multimodal agent memory structured around two key questions: how multimodal information is formed and represented (Axis I, Formation and Representation), and how its management adapts with accumulated experience (Axis II, Memory Management). Axis I characterizes what information is retained and how it is encoded (e.g., modality-specific embeddings, textual and structured records, latent and parametric representations) to support subsequent reasoning and action. Axis II distinguishes three tiers: T1 Static Memory reuses fixed memory; T2 Dynamic Memory updates memory through a stable policy; and T3 Self-Evolving Memory updates memory through an evolving policy.',
  'Based on this framework, we synthesize recurring design patterns and derive principles for balancing source fidelity with abstraction, maintaining temporal validity and provenance, grounding memory use in recoverable evidence, and evolving memory policies over time. Furthermore, we discuss the challenges and potential future directions for the memory mechanism of multimodal agents.',
];

export const DESCRIPTION =
  'A survey of multimodal agent memory: how agents form and represent memory from images, video, audio, GUI and embodied experience, and how T1–T3 memory management evolves. 297 systems, 82 benchmarks.';

export const DEFINITION =
  'Agent memory is state derived from prior observation or experience that persists beyond the instant at which it is produced and later affects reasoning, generation, or action.';

const SYMBOL: Record<string, string> = { '*': '*', '\\textdagger': '†', '\\textdaggerdbl': '‡' };
const ORGANIZERS = new Set(['Minghao Guo', 'Qingyue Jiao', 'Ziyi Ye']);

export interface Author {
  name: string;
  affiliations: number[];
  marks: string[];
}

export const AUTHORS: Author[] = affiliations.authors.map((a) => {
  const marks: string[] = [];
  if (a.contribution_symbol) marks.push(SYMBOL[a.contribution_symbol] ?? '');
  if (ORGANIZERS.has(a.name)) marks.push('§');
  return { name: a.name, affiliations: a.affiliations, marks: marks.filter(Boolean) };
});

export const INSTITUTIONS = affiliations.affiliations.map((i) => ({
  id: i.id,
  key: i.key,
  name: i.name,
  display: i.display,
}));

export const MARK_LEGEND = [
  ['*', 'Equal first authors'],
  ['§', 'Project organizers'],
  ['†', 'Corresponding author'],
  ['‡', 'Core authors'],
] as const;

export const CONTACTS = ['minghao.guo@rutgers.edu', 'qjiao@nd.edu', 'zyye@fudan.edu.cn'];

const bibAuthors = AUTHORS.map((a) => {
  const parts = a.name.split(' ');
  const last = parts.pop();
  return `${last}, ${parts.join(' ')}`;
}).join(' and ');

export const BIBTEX = `@misc{guo2026seeing,
  title  = {${TITLE}: {${SUBTITLE}}},
  author = {${bibAuthors}},
  year   = {2026},
  howpublished = {OpenReview},
  url    = {${LINKS.openreview}}
}`;
