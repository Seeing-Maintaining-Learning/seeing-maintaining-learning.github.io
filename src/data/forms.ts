/** Per-leaf illustrative content for the six-forms explorer (household-robot scenario). */
import { systems } from './index.ts';
import { LEAF_TEXT, systemLink } from './taxonomy.ts';
import { FAMILY_LABEL, LEAF_FAMILY, LEAF_LABEL, LEAVES } from './vocab.ts';
import { leafCounts } from '../lib/aggregate.ts';

const EXAMPLES: Record<string, { stored: string; traits: [string, number][] }> = {
  retained_perceptual_source_evidence: {
    stored: 'frame_1042.jpg  (1920×1080)\ncrop_mug_keys.png\naudio_0810.wav  “I’ll be back at six.”\nindex: { time: 08:10, camera: kitchen }',
    traits: [['Recoverability', 4], ['Interpretability & editability', 2], ['Compactness', 1], ['Integration with the policy', 2]],
  },
  modality_specific_encodings_and_geometric_state: {
    stored: 'visual tokens  [576 × 4096] fp16\n3D map:\n  mug   @ (1.42, 0.31, 0.93) m\n  keys  @ (1.71, 0.28, 0.92) m\nspeech embedding  [1 × 1024]',
    traits: [['Recoverability', 3], ['Interpretability & editability', 1], ['Compactness', 2], ['Integration with the policy', 3]],
  },
  perception_to_text_records_and_summaries: {
    stored: '[08:10] A mug and a set of keys are on the kitchen counter.\n[08:10] The user said they will be back at 6 pm.',
    traits: [['Recoverability', 1], ['Interpretability & editability', 4], ['Compactness', 4], ['Integration with the policy', 2]],
  },
  spatial_temporal_and_cross_modal_structured_memory: {
    stored: '(mug)  -[on]->  (counter)\n(keys) -[on]->  (counter)\n(counter) -[in]-> (kitchen)\n(user) -[returns_at]-> (18:00)\nobserved_at: 08:10 · source: frame_1042',
    traits: [['Recoverability', 2], ['Interpretability & editability', 4], ['Compactness', 3], ['Integration with the policy', 2]],
  },
  persistent_multimodal_latent_state: {
    stored: 'recurrent state  h_t ∈ ℝ²⁰⁴⁸\n[ 0.12, −0.87, 0.33, 0.05, … ]\nretained KV blocks 311–318',
    traits: [['Recoverability', 2], ['Interpretability & editability', 1], ['Compactness', 3], ['Integration with the policy', 4]],
  },
  experience_conditioned_parametric_memory: {
    stored: 'ΔW  (LoRA, rank 8) on layers 20–24\nwritten by gradient updates or a generated adapter\n— the observation itself is not kept',
    traits: [['Recoverability', 1], ['Interpretability & editability', 1], ['Compactness', 4], ['Integration with the policy', 4]],
  },
};

export function sixForms() {
  const leafN = leafCounts(systems);
  return LEAVES.map((leaf) => ({
    leaf,
    label: LEAF_LABEL[leaf],
    family: FAMILY_LABEL[LEAF_FAMILY[leaf]],
    count: leafN[leaf] ?? 0,
    definition: LEAF_TEXT[leaf].definition,
    units: LEAF_TEXT[leaf].units,
    examples: LEAF_TEXT[leaf].examples.map((name) => ({ name, href: systemLink(name) })),
    ...EXAMPLES[leaf],
  }));
}
