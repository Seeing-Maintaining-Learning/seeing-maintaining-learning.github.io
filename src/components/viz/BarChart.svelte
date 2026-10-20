<script lang="ts">
  interface Cat { key: string; label: string }
  interface Ser { key: string; label: string; cls: string }
  let {
    title,
    rows,
    series,
    values,
    href = '',
    unit = 'systems',
    initial = 'stacked',
  }: {
    title: string;
    rows: Cat[];
    series: Ser[];
    values: number[][];
    /** Link template; `{row}` and `{series}` are replaced with keys. */
    href?: string;
    unit?: string;
    initial?: 'stacked' | 'grouped' | 'percent';
  } = $props();

  let mode = $state<'stacked' | 'grouped' | 'percent'>(initial);
  let hidden = $state<string[]>([]);
  let hi = $state<{ r: number; s: number } | null>(null);
  let tip = $state<{ x: number; y: number } | null>(null);
  let box: HTMLDivElement;

  const visible = $derived(series.map((s, i) => ({ s, i })).filter(({ s }) => !hidden.includes(s.key)));
  const rowTotal = (r: number) => visible.reduce((a, { i }) => a + values[r][i], 0);
  const maxTotal = $derived(Math.max(1, ...rows.map((_, r) => rowTotal(r))));
  const maxCell = $derived(Math.max(1, ...rows.flatMap((_, r) => visible.map(({ i }) => values[r][i]))));
  const width = (r: number, i: number) => {
    const v = values[r][i];
    if (mode === 'percent') return (v / Math.max(1, rowTotal(r))) * 100;
    if (mode === 'grouped') return (v / maxCell) * 100;
    return (v / maxTotal) * 100;
  };
  const link = (r: number, i: number) =>
    href ? href.replace('{row}', encodeURIComponent(rows[r].key)).replace('{series}', encodeURIComponent(series[i].key)) : null;

  function toggle(key: string) {
    hidden = hidden.includes(key) ? hidden.filter((k) => k !== key) : [...hidden, key];
    if (hidden.length === series.length) hidden = [];
  }
  function enter(e: PointerEvent | FocusEvent, r: number, s: number) {
    hi = { r, s };
    const rect = box.getBoundingClientRect();
    const t = (e.currentTarget as HTMLElement).getBoundingClientRect();
    tip = { x: t.left - rect.left + t.width / 2, y: t.top - rect.top };
  }
  const leave = () => {
    hi = null;
    tip = null;
  };
  const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '0%');
</script>

<figure class="bc" bind:this={box}>
  <figcaption class="sr-only">{title}</figcaption>
  <div class="top">
    <div class="legend" role="group" aria-label="Show or hide series">
      {#each series as s (s.key)}
        <button type="button" class="lg {s.cls}" aria-pressed={!hidden.includes(s.key)} onclick={() => toggle(s.key)}>
          <span class="sw"></span>{s.label}
        </button>
      {/each}
    </div>
    <div class="seg" role="group" aria-label="Chart mode">
      <button type="button" aria-pressed={mode === 'stacked'} onclick={() => (mode = 'stacked')}>Stacked</button>
      <button type="button" aria-pressed={mode === 'grouped'} onclick={() => (mode = 'grouped')}>Grouped</button>
      <button type="button" aria-pressed={mode === 'percent'} onclick={() => (mode = 'percent')}>Percent</button>
    </div>
  </div>

  <ul class="rows" class:grouped={mode === 'grouped'}>
    {#each rows as row, r (row.key)}
      <li class:dimrow={hi && hi.r !== r}>
        <span class="rl">{row.label}</span>
        <span class="track">
          {#each visible as { s, i } (s.key)}
            {@const w = width(r, i)}
            {@const url = link(r, i)}
            <svelte:element
              this={url ? 'a' : 'span'}
              href={url ?? undefined}
              class="seg-bar {s.cls}"
              class:dim={hi && !(hi.r === r && hi.s === i)}
              style="--w:{w}%"
              role={url ? undefined : 'img'}
              aria-label="{row.label}, {s.label}: {values[r][i]} {unit}"
              tabindex={url ? undefined : -1}
              onpointerenter={(e: PointerEvent) => enter(e, r, i)}
              onpointerleave={leave}
              onfocus={(e: FocusEvent) => enter(e, r, i)}
              onblur={leave}
            ></svelte:element>
          {/each}
        </span>
        <span class="tot num">{mode === 'percent' ? '100%' : rowTotal(r)}</span>
      </li>
    {/each}
  </ul>

  {#if hi && tip}
    <div class="viz-tip" style="left:{Math.min(Math.max(8, tip.x - 110), box.clientWidth - 230)}px; top:{tip.y - 72}px">
      <div class="tr {series[hi.s].cls}"><span class="sw"></span><strong>{series[hi.s].label}</strong></div>
      <div>{rows[hi.r].label}</div>
      <div class="num">
        <strong>{values[hi.r][hi.s]}</strong> {unit} · {pct(values[hi.r][hi.s], rowTotal(hi.r))} of row
      </div>
    </div>
  {/if}

  <div class="sr-only">
    <table>
      <caption>{title}</caption>
      <thead><tr><th>Category</th>{#each series as s (s.key)}<th>{s.label}</th>{/each}</tr></thead>
      <tbody>
        {#each rows as row, r (row.key)}
          <tr><th>{row.label}</th>{#each series as s, i (s.key)}<td>{values[r][i]}</td>{/each}</tr>
        {/each}
      </tbody>
    </table>
  </div>
</figure>

<style>
  .bc { position: relative; margin: 0; display: grid; gap: 14px; }
  .top { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px; }
  .lg {
    font: inherit; font-size: var(--step--1); display: inline-flex; gap: 6px; align-items: center; cursor: pointer;
    padding: 3px 10px; border-radius: 999px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink-2);
  }
  .lg[aria-pressed='false'] { opacity: 0.45; text-decoration: line-through; }
  .sw { width: 10px; height: 10px; border-radius: 3px; background: var(--c); flex: none; }
  .rows { list-style: none; padding: 0; margin: 0; display: grid; gap: 10px; }
  .rows li { display: grid; grid-template-columns: minmax(120px, 210px) 1fr 4ch; gap: 12px; align-items: center; transition: opacity var(--dur-2); }
  .rows li.dimrow { opacity: 0.55; }
  .rl { font-size: 0.875rem; line-height: 1.25; color: var(--ink-2); }
  .track { display: flex; gap: 2px; min-height: 18px; align-items: stretch; }
  .grouped .track { flex-direction: column; gap: 2px; }
  .seg-bar {
    display: block; width: var(--w); min-width: 0; height: 18px; background: var(--c); border-radius: 2px;
    transition: width 420ms var(--ease), opacity var(--dur-1); cursor: pointer;
  }
  .grouped .seg-bar { height: 7px; border-radius: 0 4px 4px 0; }
  .track > .seg-bar:last-child { border-radius: 2px 4px 4px 2px; }
  .seg-bar.dim { opacity: 0.25; }
  .seg-bar:focus-visible { outline: 2px solid var(--focus); outline-offset: 1px; }
  .tot { text-align: right; font-size: 0.875rem; color: var(--ink-2); }
  .tr { display: flex; gap: 6px; align-items: center; }
  @media (max-width: 560px) {
    .rows li { grid-template-columns: 1fr 4ch; }
    .rl { grid-column: 1 / -1; }
    .track { grid-column: 1; }
  }
  @media (prefers-reduced-motion: reduce) { .seg-bar { transition: none; } }
</style>
