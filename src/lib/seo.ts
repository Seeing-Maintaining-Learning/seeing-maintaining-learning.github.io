/** SEO helpers: canonical URLs and JSON-LD builders. */
import { ARXIV_ID, AUTHORS, DESCRIPTION, FULL_TITLE, INSTITUTIONS, LINKS, PUBLISHED } from '../data/paper.ts';

export const SITE_URL = 'https://seeing-maintaining-learning.github.io';
export const SITE_NAME = 'Multimodal Agent Memory Survey';

export const abs = (path: string): string => new URL(path, SITE_URL).href;

type Json = Record<string, unknown>;

const instName = new Map(INSTITUTIONS.map((i) => [i.id, i.name]));

export function scholarlyArticle(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    headline: FULL_TITLE,
    name: FULL_TITLE,
    abstract: DESCRIPTION,
    url: abs('/paper/'),
    sameAs: [LINKS.arxiv, LINKS.doi, LINKS.huggingface, LINKS.openreview],
    identifier: { '@type': 'PropertyValue', propertyID: 'arXiv', value: ARXIV_ID },
    encoding: { '@type': 'MediaObject', encodingFormat: 'application/pdf', contentUrl: LINKS.pdf },
    datePublished: PUBLISHED,
    inLanguage: 'en',
    keywords: [
      'multimodal agent memory',
      'agent memory survey',
      'memory representation',
      'memory management',
      'self-evolving memory',
      'multimodal large language models',
    ],
    author: AUTHORS.map((a) => ({
      '@type': 'Person',
      name: a.name,
      affiliation: a.affiliations.map((id) => ({ '@type': 'Organization', name: instName.get(id) })),
    })),
  };
}

export function website(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: FULL_TITLE,
    url: abs('/'),
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${abs('/systems/')}?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function dataset(name: string, description: string, path: string, size: number): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name,
    description,
    url: abs(path),
    isBasedOn: LINKS.corpus,
    license: `${LINKS.corpus}/blob/main/LICENSE`,
    creator: { '@type': 'Organization', name: 'Seeing-Maintaining-Learning survey authors' },
    variableMeasured: ['modality', 'representation', 'management tier'],
    size: `${size} records`,
  };
}

export function breadcrumbs(items: [string, string][]): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: abs(path),
    })),
  };
}

export function citedWork(name: string, title: string, url: string, authors: string[], date: string | null): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'ScholarlyArticle',
    name: title,
    alternateName: name,
    url,
    ...(date ? { datePublished: date } : {}),
    author: authors.slice(0, 12).map((n) => ({ '@type': 'Person', name: n })),
  };
}

/** Page title for a system: drops the parenthetical, then the suffix, to stay within ~65 characters. */
export function systemTitle(name: string, max = 65): string {
  const suffix = ': multimodal agent memory';
  const short = name.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
  for (const t of [name + suffix, short + suffix, short]) if (t.length <= max) return t;
  return clip(short, max);
}

/** Trim to a length suitable for meta descriptions without cutting mid-word. */
export function clip(text: string, max = 155): string {
  if (text.length <= max) return text;
  return `${text.slice(0, text.lastIndexOf(' ', max - 1))}…`;
}
