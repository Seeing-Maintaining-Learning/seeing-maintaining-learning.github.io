/** Step captions for the representation explainers (one array per leaf, plus hybrid). */
export type Kind =
  | 'retained_perceptual_source_evidence'
  | 'modality_specific_encodings_and_geometric_state'
  | 'perception_to_text_records_and_summaries'
  | 'spatial_temporal_and_cross_modal_structured_memory'
  | 'persistent_multimodal_latent_state'
  | 'experience_conditioned_parametric_memory'
  | 'hybrid';

export const CAPTIONS: Record<Kind, string[]> = {
  retained_perceptual_source_evidence: [
    'The robot’s camera sees the kitchen at 08:10.',
    'Frames are kept as they are, each with a timestamp, in an archive.',
    'Later the user asks, “Where are my keys?”',
    'The matching frame is retrieved and handed back to the model as evidence: the original pixels.',
  ],
  modality_specific_encodings_and_geometric_state: [
    'The robot’s camera sees the kitchen at 08:10.',
    'An encoder cuts the frame into patches and turns each into a feature token.',
    'The tokens keep the frame’s spatial layout in a compact, model-specific form. Some fine detail may be lost.',
    'Objects are also placed in a 3D map of the room, keeping where things are.',
  ],
  perception_to_text_records_and_summaries: [
    'The robot’s camera sees the kitchen at 08:10.',
    'A vision-language model describes the scene in words.',
    'The sentence joins a running log that any language model can read and edit.',
    'Anything the caption did not mention, like the mug’s color, is gone for good.',
  ],
  spatial_temporal_and_cross_modal_structured_memory: [
    'The robot’s camera sees the kitchen at 08:10.',
    'Objects and places become nodes in a graph.',
    'Relations become edges: mug on counter, counter in kitchen.',
    'At 12:30 the mug is in the sink. One edge is rewired; the rest of the graph stays.',
  ],
  persistent_multimodal_latent_state: [
    'Frames arrive one after another.',
    'Each frame is blended into a hidden state vector carried forward in time.',
    'The state keeps a compressed, lossy summary of what has been seen so far, outside the model’s weights.',
    'It is fast for the model to use, but a person cannot read or edit it directly.',
  ],
  experience_conditioned_parametric_memory: [
    'The robot collects an episode of experience.',
    'Experience is written into the weights or a small adapter, by gradient updates or a generated adapter.',
    'The experience now shapes the weights; the connections that changed light up.',
    'The original observation is discarded. The knowledge lives only in the parameters.',
  ],
  hybrid: [
    'A compact text record and the original frame are both kept.',
    'The record carries a link back to its source frame.',
    'A question is matched quickly against the short record.',
    'The link recovers the frame, so the answer can be checked against what was seen.',
  ],
};
