<script lang="ts">
  import { onMount } from 'svelte';

  export interface Row {
    id: string;
    name: string;
    title: string;
    year: number;
    period: string;
    modality: string;
    tier: string;
    category: string;
    leaves: string[];
    storage: string[];
    retrieval: string[];
    ops: string[];
    t3: string[];
  }

  interface Facet {
    key: string;
    label: string;
    options: [string, string][];
  }

  let { rows, facets }: { rows: Row[]; facets: Facet[] } = $props();

  let q = $state('');
  let selected = $state<Record<string, string[]>>({});
  let sort = $state<'name' | 'year'>('name');

  const matches = (r: Row, key: keyof Row, vals: string[]) => {
    const v = r[key];
    return Array.isArray(v) ? vals.some((x) => v.includes(x)) : vals.includes(String(v));
  };

  const filtered = $derived.by(() => {
    const needle = q.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (!needle || r.name.toLowerCase().includes(needle) || r.title.toLowerCase().includes(needle)) &&
        Object.entries(selected).every(([k, vals]) => !vals.length || matches(r, k as keyof Row, vals)),
    );
    return sort === 'year'
      ? [...out].sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
      : out;
  });

  const countFor = (k: string, value: string) => {
    const key = k as keyof Row;
    const others = Object.entries(selected).filter(([o]) => o !== key);
    return rows.filter(
      (r) => matches(r, key, [value]) && others.every(([k, vals]) => !vals.length || matches(r, k as keyof Row, vals)),
    ).length;
  };

  function toggle(key: string, value: string) {
    const cur = selected[key] ?? [];
    selected = { ...selected, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
  }

  function clear() {
    selected = {};
    q = '';
  }

  const active = $derived(Object.values(selected).reduce((n, v) => n + v.length, 0) + (q ? 1 : 0));

  onMount(() => {
    const p = new URLSearchParams(location.search);
    q = p.get('q') ?? '';
    const init: Record<string, string[]> = {};
    for (const f of facets) {
      const v = p.get(String(f.key));
      if (v) init[String(f.key)] = v.split(',');
    }
    selected = init;
    if (p.get('sort') === 'year') sort = 'year';
  });

  $effect(() => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    for (const [k, v] of Object.entries(selected)) if (v.length) p.set(k, v.join(','));
    if (sort !== 'name') p.set('sort', sort);
    const s = p.toString();
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  });

  const labelOf = (facet: Facet, v: string) => facet.options.find(([k]) => k === v)?.[1] ?? v;
  const facetOf = (key: string) => facets.find((f) => f.key === key)!;
</script>

<div class="explorer">
  <aside class="filters" aria-label="Filters">
    <label class="search">
      <span class="sr-only">Search systems</span>
      <input type="search" placeholder="Search {rows.length} systems" bind:value={q} />
    </label>
    {#each facets as facet (facet.key)}
      <details open={facet.key === 'modality' || facet.key === 'tier' || facet.key === 'category'}>
        <summary>{facet.label}</summary>
        <ul>
          {#each facet.options as [value, text] (value)}
            {@const n = countFor(facet.key, value)}
            <li>
              <label class:dim={n === 0}>
                <input
                  type="checkbox"
                  checked={(selected[String(facet.key)] ?? []).includes(value)}
                  onchange={() => toggle(String(facet.key), value)}
                />
                <span class="opt">{text}</span>
                <span class="n num">{n}</span>
              </label>
            </li>
          {/each}
        </ul>
      </details>
    {/each}
  </aside>

  <section class="results" aria-label="Results">
    <div class="status">
      <p aria-live="polite"><strong class="num">{filtered.length}</strong> of {rows.length} systems</p>
      <div class="status-right">
        {#if active}
          <button class="link" type="button" onclick={clear}>Clear filters</button>
        {/if}
        <div class="seg" role="group" aria-label="Sort">
          <button type="button" aria-pressed={sort === 'name'} onclick={() => (sort = 'name')}>A–Z</button>
          <button type="button" aria-pressed={sort === 'year'} onclick={() => (sort = 'year')}>Newest</button>
        </div>
      </div>
    </div>
    {#if active}
      <div class="active">
        {#each Object.entries(selected) as [k, vals] (k)}
          {#each vals as v (v)}
            <button class="chip" type="button" onclick={() => toggle(k, v)} aria-label="Remove filter {labelOf(facetOf(k), v)}">
              {labelOf(facetOf(k), v)} <span aria-hidden="true">×</span>
            </button>
          {/each}
        {/each}
      </div>
    {/if}
    <ol class="list">
      {#each filtered as r (r.id)}
        <li>
          <a href="/systems/{r.id}/">
            <span class="name">{r.name}</span>
            <span class="title">{r.title}</span>
          </a>
          <span class="meta">
            <span class="chip tier-{r.tier}"><span class="dot"></span>{r.tier}</span>
            <span class="chip mod-{r.modality}"><span class="dot"></span>{labelOf(facetOf('modality'), r.modality)}</span>
            <span class="year num muted">{r.year}</span>
          </span>
        </li>
      {:else}
        <li class="empty">
          No system matches these filters. Remove a filter or <button class="link" type="button" onclick={clear}>clear all</button>.
        </li>
      {/each}
    </ol>
  </section>
</div>

<style>
  .explorer { display: grid; grid-template-columns: 260px 1fr; gap: 32px; align-items: start; }
  .filters { position: sticky; top: 76px; max-height: calc(100vh - 92px); overflow: auto; padding-right: 4px; }
  .search input {
    width: 100%; font: inherit; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--rule);
    background: var(--surface); color: var(--ink); margin-bottom: 12px;
  }
  details { border-top: 1px solid var(--rule); padding-block: 10px; }
  summary { cursor: pointer; font-weight: 600; font-size: 0.9375rem; }
  details ul { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 2px; }
  details label { display: grid; grid-template-columns: auto 1fr auto; gap: 8px; align-items: baseline; font-size: var(--step--1); padding: 3px 4px; border-radius: 4px; cursor: pointer; }
  details label:hover { background: var(--surface-2); }
  details input { accent-color: var(--accent); translate: 0 2px; }
  .dim { opacity: 0.45; }
  .n { color: var(--muted); }
  .status { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
  .status p { margin: 0; }
  .status-right { display: flex; align-items: center; gap: 12px; }
  .link { font: inherit; background: none; border: 0; padding: 0; color: var(--accent-ink); text-decoration: underline; cursor: pointer; }
  .active { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
  .active .chip { cursor: pointer; font: inherit; font-size: var(--step--1); }
  .list { list-style: none; margin: 0; padding: 0; border-top: 1px solid var(--rule); }
  .list li { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: center; padding: 12px 4px; border-bottom: 1px solid var(--rule); }
  .list a { text-decoration: none; color: inherit; min-width: 0; }
  .list a:hover .name { color: var(--accent-ink); text-decoration: underline; }
  .name { display: block; font-weight: 600; }
  .title { display: block; color: var(--muted); font-size: var(--step--1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .meta { display: flex; gap: 6px; align-items: center; }
  .year { font-size: var(--step--1); min-width: 3ch; }
  .empty { display: block !important; color: var(--muted); padding: 24px 4px !important; }
  @media (max-width: 860px) {
    .explorer { grid-template-columns: 1fr; }
    .filters { position: static; max-height: none; }
    .list li { grid-template-columns: 1fr; gap: 6px; }
    .meta { flex-wrap: wrap; }
  }
</style>
