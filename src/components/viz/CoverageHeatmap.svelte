<script lang="ts">
  type Cov = 'direct' | 'partial' | 'none';
  interface Row { id: string; name: string; modality: string; coverage: Cov[]; source: string; task: string }
  let {
    rows,
    shared,
    familyCaps,
    modalities,
  }: {
    rows: Row[];
    shared: [string, string][];
    familyCaps: Record<string, [string, string][]>;
    modalities: { key: string; label: string; cls: string }[];
  } = $props();

  let fam = $state<string>('all');
  let sortBy = $state<number | null>(null);
  let hc = $state<number | null>(null);

  const score = (c: Cov) => (c === 'direct' ? 2 : c === 'partial' ? 1 : 0);
  const GLYPH: Record<Cov, string> = { direct: '●', partial: '◐', none: '' };
  const WORD: Record<Cov, string> = { direct: 'directly evaluated', partial: 'partially evaluated', none: 'not evaluated' };

  const view = $derived.by(() => {
    const list = rows.filter((r) => fam === 'all' || r.modality === fam);
    const order = new Map(modalities.map((m, i) => [m.key, i]));
    return [...list].sort((a, b) => {
      if (sortBy !== null) {
        const d = score(b.coverage[sortBy]) - score(a.coverage[sortBy]);
        if (d) return d;
      }
      return (order.get(a.modality)! - order.get(b.modality)!) || a.name.localeCompare(b.name);
    });
  });
  const capsFor = (m: string): [string, string][] => [...shared, ...(familyCaps[m] ?? [])];
  const header = $derived(fam === 'all' ? [...shared, ['M1', 'Modality-specific 1'], ['M2', 'Modality-specific 2'], ['M3', 'Modality-specific 3']] as [string, string][] : capsFor(fam));
  const colDirect = (i: number) => view.filter((r) => r.coverage[i] === 'direct').length;
</script>

<div class="hm">
  <div class="controls">
    <div class="seg" role="group" aria-label="Modality">
      <button type="button" aria-pressed={fam === 'all'} onclick={() => (fam = 'all')}>All {rows.length}</button>
      {#each modalities as m (m.key)}
        <button type="button" aria-pressed={fam === m.key} onclick={() => (fam = m.key)}>
          {m.label} {rows.filter((r) => r.modality === m.key).length}
        </button>
      {/each}
    </div>
    <p class="legend small">
      <span><i class="c direct">●</i> Direct</span><span><i class="c partial">◐</i> Partial</span><span><i class="c none"></i> Not evaluated</span>
      <span class="muted">Click a column to sort.</span>
    </p>
  </div>

  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th class="bn" scope="col">Benchmark</th>
          {#each header as [code, name], i (code + i)}
            <th scope="col" class:sep={i === 6} class:hot={hc === i}>
              <button type="button" title={name} onclick={() => (sortBy = sortBy === i ? null : i)} aria-pressed={sortBy === i}>
                <span class="code">{code}</span>
                <span class="cnt num">{colDirect(i)}</span>
              </button>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each view as r (r.id)}
          {@const caps = capsFor(r.modality)}
          <tr>
            <th scope="row" class="bn">
              <span class="chip mod-{r.modality}"><span class="dot"></span></span>
              <a href="/benchmarks/{r.id}/">{r.name}</a>
            </th>
            {#each r.coverage as c, i (i)}
              <td
                class="c {c}"
                class:sep={i === 6}
                class:hot={hc === i}
                title="{r.name} · {caps[i][1]}: {WORD[c]}"
                onpointerenter={() => (hc = i)}
                onpointerleave={() => (hc = null)}
              >
                <span aria-hidden="true">{GLYPH[c]}</span><span class="sr-only">{caps[i][0]} {WORD[c]}</span>
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <dl class="key small">
    {#each header as [code, name], i (code + i)}
      <div><dt>{code}</dt><dd>{name}</dd></div>
    {/each}
  </dl>
</div>

<style>
  .hm { display: grid; gap: 14px; }
  .hm > * { min-width: 0; }
  .controls { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; align-items: center; }
  .legend { display: flex; gap: 14px; flex-wrap: wrap; margin: 0; align-items: center; }
  .legend span { display: inline-flex; gap: 6px; align-items: center; }
  .legend i { font-style: normal; width: 18px; height: 18px; display: inline-grid; place-items: center; border-radius: 4px; font-size: 12px; }
  .scroll { position: relative; overflow: auto; max-height: 72vh; border: 1px solid var(--rule); border-radius: 12px; background: var(--surface); }
  table { border-collapse: separate; border-spacing: 2px; width: 100%; font-size: 0.875rem; }
  thead th { position: sticky; top: 0; background: var(--surface); z-index: 2; padding: 6px 0; }
  thead button { font: inherit; border: 0; background: none; color: var(--ink); cursor: pointer; display: flex; flex-direction: column; align-items: center; width: 100%; padding: 2px; border-radius: 6px; }
  thead button[aria-pressed='true'] { background: var(--surface-2); }
  .code { font-weight: 650; }
  .cnt { font-size: 0.75rem; color: var(--muted); }
  .bn { text-align: left; white-space: nowrap; padding: 0 12px 0 8px; position: sticky; left: 0; background: var(--surface); z-index: 1; font-weight: 500; }
  thead .bn { z-index: 3; }
  .bn .chip { padding: 0; border: 0; background: none; margin-right: 4px; }
  .bn a { color: var(--ink); text-decoration: none; }
  .bn a:hover { text-decoration: underline; }
  td.c, .legend i { text-align: center; }
  td.c { width: 44px; min-width: 36px; height: 26px; border-radius: 4px; color: var(--surface); font-size: 12px; }
  .c.direct { background: var(--cov-direct); color: var(--surface); }
  .c.partial { background: var(--cov-partial); color: var(--ink); }
  .c.none { background: var(--cov-none); }
  .sep { border-left: 2px solid transparent; }
  td.sep { box-shadow: -3px 0 0 var(--surface), -4px 0 0 var(--rule); }
  .hot { outline: 1px solid var(--focus); }
  tbody tr:hover th { color: var(--accent-ink); }
  .key { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 4px 18px; margin: 0; }
  .key div { display: flex; gap: 8px; }
  .key dt { font-weight: 650; min-width: 2.5ch; }
  .key dd { margin: 0; color: var(--ink-2); }
</style>
