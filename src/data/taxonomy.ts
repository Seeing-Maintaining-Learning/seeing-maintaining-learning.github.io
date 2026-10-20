/**
 * Curated taxonomy text from the survey (Sections 3–4), plus the representative systems the
 * paper names for each leaf / operation (multimodal_memory_lifecycle_tree.tex).
 */
import type { Family, Leaf, T2Op, Tier } from './vocab.ts';
import { systems } from './index.ts';

export const FAMILY_TEXT: Record<Family, { short: string; tradeoff: string }> = {
  source_preserving_and_modality_native_memory: {
    short: 'Keep experience close to how it was perceived: raw observations, or features that preserve their structure.',
    tradeoff: 'Rich detail and re-encodable, but costly to store and process; encodings are lossy and tied to one model.',
  },
  cross_represented_explicit_memory: {
    short: 'Translate perception into explicit text, records, or graphs a language model can read and edit.',
    tradeoff: 'Interpretable and editable, but perceptual detail is discarded.',
  },
  internalized_latent_and_parametric_memory: {
    short: 'Carry experience as hidden state or write it into weights and adapters.',
    tradeoff: 'Tightly integrated with inference, but harder to access, trace, and control.',
  },
};

export const LEAF_TEXT: Record<Leaf, { definition: string; units: string; examples: string[] }> = {
  retained_perceptual_source_evidence: {
    definition:
      'Observations are kept in their native modality as addressable entries and handed back to the model as evidence, not only through a derived caption or embedding.',
    units: 'images, crops, document screenshots, video frames, audiovisual segments, RGB-D observations',
    examples: ['PIXELRAG', 'AGMem', 'ToolMerge', 'M3-Agent', 'VisRAG'],
  },
  modality_specific_encodings_and_geometric_state: {
    definition:
      'Past observations persist as learned features, modality tokens, or world-centered geometry that keep spatial layout, temporal order, acoustic dynamics, or metric structure.',
    units: 'visual tokens, acoustic features, temporal video features, 3D maps',
    examples: ['MemoryVLA', 'Flash-VStream', 'DynaMem', 'MovieChat'],
  },
  perception_to_text_records_and_summaries: {
    definition:
      'Observations become natural-language memory units such as captions, event descriptions, facts, profiles, summaries, or procedures, supplied to an LLM as text.',
    units: 'captions, event logs, facts, user profiles, procedures',
    examples: ['Video-EM', 'MIRIX', 'VideoAgent'],
  },
  spatial_temporal_and_cross_modal_structured_memory: {
    definition:
      'Experience is stored as schema-defined records or graphs of entities, attributes, relations, and spatial, temporal, or cross-modal links that can be queried and traversed.',
    units: 'scene graphs, temporal knowledge graphs, entity–attribute tables',
    examples: ['PyraVid', 'WorldMM', 'TAME', 'PolarMem'],
  },
  persistent_multimodal_latent_state: {
    definition:
      'Information from past observations is held as continuous hidden states outside the backbone weights, carried forward recurrently or shared across components.',
    units: 'hidden states, memory tokens, retained KV caches',
    examples: ['TRAM', 'Light-Omni', 'L²-VMAS', 'Mem-W'],
  },
  experience_conditioned_parametric_memory: {
    definition:
      'Past experience is written into learned weights or parameter-efficient modules such as LoRA adapters that shape later inference.',
    units: 'fine-tuned weights, per-task or per-instance adapters',
    examples: ['Frames2LoRA', 'SE-GA', 'VLA-Pro', 'MemEIC'],
  },
};

export const HYBRID_EXAMPLES = ['VimRAG', 'FOLIO', 'MementoGUI', 'ObsGraph', 'HiMe'];

export const TIER_TEXT: Record<Tier, { title: string; question: string; definition: string; change: string; examples: string[] }> = {
  T1: {
    title: 'Static Memory',
    question: 'Memory is built, then reused.',
    definition:
      'Memory is constructed before downstream reasoning or action and then stored and reused without modification. Each query may retrieve a different subset, but content, organization, indices, and metadata stay fixed.',
    change: 'Nothing changes after formation.',
    examples: ['VideoAgent', 'PIXELRAG', 'VisRAG', 'AutoDroid', 'Memory-QA'],
  },
  T2: {
    title: 'Dynamic Memory',
    question: 'Memory updates; the management policy stays stable.',
    definition:
      'New observations update memory content, organization, indices, or metadata through a stable management policy, hard-coded or learned before deployment, that does not change during inference.',
    change: 'Memory state M changes; policy π stays stable.',
    examples: ['M2A', 'M3-Agent', 'DynaMem', 'MovieChat', 'StreamChat'],
  },
  T3: {
    title: 'Self-Evolving Memory',
    question: 'Feedback evolves the management policy.',
    definition:
      'Feedback from interactions or task outcomes persistently changes the policy that governs how memory is written, maintained, or retrieved.',
    change: 'Both memory M and policy π change.',
    examples: ['TaskMem', 'ABot-AgentOS', 'H²-EMV', 'RRM', 'SkeMex'],
  },
};

export const OP_TEXT: Record<T2Op, { definition: string; examples: string[] }> = {
  update: { definition: 'Adds new observations or integrates them into existing records.', examples: ['M2A', 'M3-Agent', 'DynaMem', 'RoboEXP'] },
  consolidation: { definition: 'Merges related records or abstracts repeated experience into compact knowledge.', examples: ['MovieChat', 'StreamChat', 'NS-Mem', 'ReMA', 'FluxMem'] },
  revision: { definition: 'Corrects or replaces stored information that has become inconsistent or outdated.', examples: ['RoboEXP', 'ReflectWorld-MM', 'DovSG', 'M2A'] },
  reorganization: { definition: 'Changes how records are grouped, linked, indexed, or moved across memory levels.', examples: ['MovieChat', 'M3-Agent', 'NS-Mem', 'TAME'] },
  forgetting: { definition: 'Removes records or lowers their retention or retrieval priority.', examples: ['EventMemAgent', 'StreamChat', 'KARMA', 'OCR-Memory'] },
};

export const T3_TEXT: Record<string, { definition: string; examples: string[] }> = {
  write_policy_evolution: {
    definition: 'Feedback changes what raw experience is selected and how it is transformed into memory.',
    examples: ['TaskMem', 'ABot-AgentOS'],
  },
  maintenance_policy_evolution: {
    definition: 'Feedback changes which representations are retained, revised, or removed over time.',
    examples: ['H²-EMV'],
  },
  retrieval_policy_evolution: {
    definition: 'Feedback changes how queries are formed and which memories are prioritized.',
    examples: ['RRM', 'ABot-AgentOS', 'SkeMex'],
  },
};

const norm = (s: string) =>
  s.toLowerCase().replace(/²/g, '2').replace(/\(.*\)/g, '').replace(/[^a-z0-9]/g, '');
const byName = new Map(systems.map((s) => [norm(s.name), s.id]));

/** Resolve a paper-cited system name to a corpus page id, when the corpus has it. */
export const systemLink = (name: string): string | null => {
  const id = byName.get(norm(name));
  return id ? `/systems/${id}/` : null;
};

/** Table: representational bottlenecks across tiers (representation_bottleneck_tiers.tex). */
export const TIER_BOTTLENECK: Record<Tier, { scope: string; requirement: string; bottlenecks: string }> = {
  T1: {
    scope: 'None after formation',
    requirement: 'Preserve task-relevant information in a form that can be accessed and reused.',
    bottlenecks: 'Failure to preserve task-relevant information during formation; ineffective access to retained information.',
  },
  T2: {
    scope: 'Memory state',
    requirement: 'Apply a controlled change to the correct target while preserving unrelated content and dependent representations.',
    bottlenecks:
      'Limited editability or excessive operation scope; insufficient traces for verifiability; limited reversibility; incomplete update propagation and cross-representation inconsistency.',
  },
  T3: {
    scope: 'Memory state and management policy',
    requirement: 'Attribute outcomes to policy decisions, revise the responsible policy, and validate the revision across subsequent use.',
    bottlenecks:
      'Limited policy addressability; insufficient policy-decision traceability and feedback attribution; nonpersistent policy revisions; insufficient policy-level validation.',
  },
};
