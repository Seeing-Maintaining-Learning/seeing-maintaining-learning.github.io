/** Human-readable labels for every controlled vocabulary used by the corpus. */

export const MODALITIES = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'] as const;
export type Modality = (typeof MODALITIES)[number];

export const MODALITY_LABEL: Record<Modality, string> = {
  image: 'Image',
  video_streaming: 'Video & streaming',
  audio_speech: 'Audio & speech',
  gui: 'GUI & computer use',
  embodied_3d: 'Embodied & 3D',
};

/** Lowercase-safe modality phrases for running text (keeps GUI and 3D capitalized). */
export const MODALITY_PHRASE: Record<Modality, string> = {
  image: 'image',
  video_streaming: 'video & streaming',
  audio_speech: 'audio & speech',
  gui: 'GUI & computer-use',
  embodied_3d: 'embodied & 3D',
};

/** Modality headings as the survey writes them. */
export const MODALITY_HEADING: Record<Modality, string> = {
  image: 'Image Memory',
  video_streaming: 'Video Memory',
  audio_speech: 'Audio and Speech Memory',
  gui: 'GUI Memory',
  embodied_3d: 'Embodied Memory',
};

export const MODALITY_SLUG: Record<Modality, string> = {
  image: 'image',
  video_streaming: 'video',
  audio_speech: 'audio',
  gui: 'gui',
  embodied_3d: 'embodied',
};

export const TIERS = ['T1', 'T2', 'T3'] as const;
export type Tier = (typeof TIERS)[number];

export const TIER_LABEL: Record<Tier, string> = {
  T1: 'Static Memory',
  T2: 'Dynamic Memory',
  T3: 'Self-Evolving Memory',
};

export const FAMILIES = [
  'source_preserving_and_modality_native_memory',
  'cross_represented_explicit_memory',
  'internalized_latent_and_parametric_memory',
] as const;
export type Family = (typeof FAMILIES)[number];

/** Exclusive representation category used for the paper's 4x3 matrix. */
export type RepCategory = 'native' | 'cross' | 'latent' | 'hybrid';
export const REP_CATEGORIES: RepCategory[] = ['native', 'cross', 'latent', 'hybrid'];

export const FAMILY_LABEL: Record<Family, string> = {
  source_preserving_and_modality_native_memory: 'Source- and modality-specific',
  cross_represented_explicit_memory: 'Cross-represented explicit',
  internalized_latent_and_parametric_memory: 'Internalized latent & parametric',
};

export const FAMILY_TO_CATEGORY: Record<Family, RepCategory> = {
  source_preserving_and_modality_native_memory: 'native',
  cross_represented_explicit_memory: 'cross',
  internalized_latent_and_parametric_memory: 'latent',
};

export const REP_CATEGORY_LABEL: Record<RepCategory, string> = {
  native: 'Source- and modality-specific',
  cross: 'Cross-represented explicit',
  latent: 'Internalized latent & parametric',
  hybrid: 'Hybrid',
};

export const LEAVES = [
  'retained_perceptual_source_evidence',
  'modality_specific_encodings_and_geometric_state',
  'perception_to_text_records_and_summaries',
  'spatial_temporal_and_cross_modal_structured_memory',
  'persistent_multimodal_latent_state',
  'experience_conditioned_parametric_memory',
] as const;
export type Leaf = (typeof LEAVES)[number];

export const LEAF_LABEL: Record<Leaf, string> = {
  retained_perceptual_source_evidence: 'Retained perceptual source evidence',
  modality_specific_encodings_and_geometric_state: 'Modality-specific encodings & geometric state',
  perception_to_text_records_and_summaries: 'Perception-to-text records & summaries',
  spatial_temporal_and_cross_modal_structured_memory: 'Spatial, temporal & cross-modal structured memory',
  persistent_multimodal_latent_state: 'Persistent multimodal latent state',
  experience_conditioned_parametric_memory: 'Experience-conditioned parametric memory',
};

/** Short leaf names for dense charts. */
export const LEAF_SHORT: Record<Leaf, string> = {
  retained_perceptual_source_evidence: 'Retained source evidence',
  modality_specific_encodings_and_geometric_state: 'Encodings & geometry',
  perception_to_text_records_and_summaries: 'Text records & summaries',
  spatial_temporal_and_cross_modal_structured_memory: 'Structured records & graphs',
  persistent_multimodal_latent_state: 'Latent state',
  experience_conditioned_parametric_memory: 'Parametric memory',
};

export const LEAF_FAMILY: Record<Leaf, Family> = {
  retained_perceptual_source_evidence: 'source_preserving_and_modality_native_memory',
  modality_specific_encodings_and_geometric_state: 'source_preserving_and_modality_native_memory',
  perception_to_text_records_and_summaries: 'cross_represented_explicit_memory',
  spatial_temporal_and_cross_modal_structured_memory: 'cross_represented_explicit_memory',
  persistent_multimodal_latent_state: 'internalized_latent_and_parametric_memory',
  experience_conditioned_parametric_memory: 'internalized_latent_and_parametric_memory',
};

export const STORAGE_LABEL: Record<string, string> = {
  flat_sequential_record_store: 'Flat sequential records',
  vector_indexed_collection: 'Vector-indexed collection',
  graph_relational_store: 'Graph / relational store',
  hierarchical_multi_tier_store: 'Hierarchical multi-tier store',
  modular_adapter_store_bank: 'Modular adapter bank',
  unclear: 'Unclear',
};

export const RETRIEVAL_LABEL: Record<string, string> = {
  similarity_based_retrieval: 'Similarity search',
  metadata_spatiotemporal_retrieval: 'Metadata / spatiotemporal retrieval',
  structure_based_traversal: 'Structure traversal',
  planner_tool_assisted_retrieval: 'Planner / tool-assisted retrieval',
  latent_parametric_activation: 'Latent / parametric activation',
  unclear: 'Unclear',
};

export const SOURCE_ACCESS_LABEL: Record<string, string> = {
  direct: 'Source directly available',
  linked_recoverable: 'Source linked & recoverable',
  retained_not_accessible: 'Retained but not accessible to the agent',
  none: 'Source not retained',
  unclear: 'Unclear',
};

/** T2 operation leaves grouped under the paper's five operations. */
export const T2_OPS = ['update', 'consolidation', 'revision', 'reorganization', 'forgetting'] as const;
export type T2Op = (typeof T2_OPS)[number];

export const T2_OP_LABEL: Record<T2Op, string> = {
  update: 'Update',
  consolidation: 'Consolidation',
  revision: 'Revision',
  reorganization: 'Reorganization',
  forgetting: 'Forgetting',
};

export const T2_LEAF: Record<string, { label: string; op: T2Op }> = {
  rule_based_update: { label: 'Rule-based update', op: 'update' },
  learned_update_module: { label: 'Learned update module', op: 'update' },
  optimization_based_update: { label: 'Optimization-based update', op: 'update' },
  llm_based_memory_editing: { label: 'Prompted LLM/VLM record update', op: 'update' },
  episodic_or_hierarchical_summarization: { label: 'Episodic / hierarchical summarization', op: 'consolidation' },
  memory_merging_and_deduplication: { label: 'Merging & deduplication', op: 'consolidation' },
  experience_abstraction: { label: 'Experience abstraction', op: 'consolidation' },
  rule_based_state_correction: { label: 'Rule-based state correction', op: 'revision' },
  evidence_weighted_belief_revision: { label: 'Evidence-weighted belief revision', op: 'revision' },
  llm_based_conflict_resolution: { label: 'LLM-based conflict resolution', op: 'revision' },
  memory_relinking_and_reindexing: { label: 'Relinking & reindexing', op: 'reorganization' },
  memory_tier_migration: { label: 'Memory-level migration (short- to long-term)', op: 'reorganization' },
  discrete_memory_eviction: { label: 'Discrete eviction', op: 'forgetting' },
  progressive_memory_decay: { label: 'Progressive decay', op: 'forgetting' },
};

export const T3_TARGET_LABEL: Record<string, string> = {
  write_policy_evolution: 'Write policy',
  maintenance_policy_evolution: 'Maintenance policy',
  retrieval_policy_evolution: 'Retrieval policy',
};

export const label = (map: Record<string, string>, key: string): string =>
  map[key] ?? key.replace(/_/g, ' ');
