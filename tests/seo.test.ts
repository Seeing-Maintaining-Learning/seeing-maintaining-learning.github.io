import { describe, expect, it } from 'vitest';
import { systemTitle } from '../src/lib/seo.ts';

describe('systemTitle', () => {
  it('keeps the suffix when the name is short', () => {
    expect(systemTitle('VISTA')).toBe('VISTA: multimodal agent memory');
  });
  it('drops the parenthetical before dropping the suffix', () => {
    expect(systemTitle('REVEAL (Retrieval-Augmented Visual-Language Pre-Training)')).toBe('REVEAL: multimodal agent memory');
  });
  it('never exceeds 65 characters', () => {
    const long = 'LLM-Empowered Embodied Agent for Memory-Augmented Task Planning in Household Robotics';
    expect(systemTitle(long).length).toBeLessThanOrEqual(65);
  });
});
