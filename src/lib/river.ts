/** Slim records for the paper river timeline. */
import type { System } from '../data/normalize.ts';

export const riverPapers = (systems: System[]) =>
  systems.map((s) => {
    const d = new Date(s.date);
    const frac = Number.isNaN(d.getTime()) ? 0.5 : (d.getTime() - Date.UTC(s.year, 0, 1)) / (365 * 864e5);
    return { id: s.id, name: s.name, title: s.title, modality: s.modality, tier: s.tier, t: s.year + frac, date: s.date };
  });
