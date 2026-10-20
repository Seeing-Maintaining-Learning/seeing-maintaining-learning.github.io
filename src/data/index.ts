/** Typed access to the generated corpus data (written by scripts/sync-corpus.ts). */
import systemsJson from './generated/systems.json';
import benchmarksJson from './generated/benchmarks.json';
import meta from './generated/meta.json';
import pendingJson from './generated/pending.json';
import type { Benchmark, Coverage, PendingSystem, System } from './normalize.ts';

export const systems = systemsJson as System[];
export const benchmarks = benchmarksJson as Benchmark[];
/** Benchmarks scored in the survey's Table 2 (coverage known). */
export type ScoredBenchmark = Benchmark & { coverage: Coverage[] };
export const scoredBenchmarks = benchmarks.filter((b): b is ScoredBenchmark => b.coverage !== null);
/** Merged corpus records still awaiting classification. */
export const pending = pendingJson as PendingSystem[];
export const corpusMeta = meta as { corpusRepo: string; revision: string; syncedAt: string };

export const systemById = new Map(systems.map((s) => [s.id, s]));

/** Benchmark capability columns: six shared, then three per modality family. */
export const SHARED_CAPS = [
  ['CE', 'Cross-modal evidence'],
  ['LE', 'Long-range evidence'],
  ['SC', 'State changes'],
  ['CF', 'Conflicting memories'],
  ['UQ', 'Unanswerable queries'],
  ['MA', 'Memory-grounded action'],
] as const;

export const FAMILY_CAPS: Record<string, readonly (readonly [string, string])[]> = {
  image: [['FG', 'Fine-grained visual detail'], ['ET', 'Entity tracking'], ['VC', 'Visual state change']],
  video_streaming: [['TL', 'Temporal localization'], ['TR', 'Temporal relations'], ['ME', 'Multi-event integration']],
  audio_speech: [['SP', 'Speaker tracking'], ['AC', 'Acoustic-cue retention'], ['RP', 'Repair persistence']],
  gui: [['GS', 'Persistent interface state'], ['AO', 'Action–outcome association'], ['XR', 'Cross-session reuse']],
  embodied_3d: [['SM', 'Spatial memory'], ['OS', 'Object-state tracking'], ['TS', 'Task-state tracking']],
};
