/** Shared, persisted wizard state (one wizard per page). */
import { emptyDraft, type Draft } from '../../lib/contribute.ts';

const KEY = 'contribute-draft-v1';

function load(): Draft {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
    return raw ? { ...emptyDraft(), ...JSON.parse(raw) } : emptyDraft();
  } catch {
    return emptyDraft();
  }
}

export const draft = $state<Draft>(emptyDraft());

export function restore(): void {
  Object.assign(draft, load());
}

export function save(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(draft));
  } catch {
    /* storage unavailable: the draft just won't persist */
  }
}

export function reset(): void {
  Object.assign(draft, emptyDraft());
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

export const toggle = (list: string[], v: string): string[] => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
