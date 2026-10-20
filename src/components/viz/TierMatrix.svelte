<script lang="ts">
  type Cell = { cat: string; tier: string; n: number };
  let {
    rows,
    cols,
    cells,
    rowLabels,
    colLabels,
  }: {
    rows: string[];
    cols: string[];
    cells: Cell[];
    rowLabels: Record<string, string>;
    colLabels: Record<string, string>;
  } = $props();

  const N = cells.reduce((a, c) => a + c.n, 0);
  const rowTotal = (r: string) => cells.filter((c) => c.cat === r).reduce((a, c) => a + c.n, 0);
  const colTotal = (t: string) => cells.filter((c) => c.tier === t).reduce((a, c) => a + c.n, 0);
  const max = Math.max(...cells.map((c) => c.n));
  const get = (r: string, t: string) => cells.find((c) => c.cat === r && c.tier === t)?.n ?? 0;

  let mode = $state<'count' | 'tier' | 'rep'>('count');
  let hover = $state<{ r: string; t: string } | null>(null);

  const share = (r: string, t: string) => {
    const n = get(r, t);
    if (mode === 'tier') return n / colTotal(t);
    if (mode === 'rep') return n / rowTotal(r);
    return n / max;
  };
  const ratio = (r: string, t: string) => get(r, t) / ((rowTotal(r) * colTotal(t)) / N);
  const pct = (x: number) => `${(x * 100).toFixed(x < 0.1 && x > 0 ? 1 : 0)}%`;

  const describe = (r: string, t: string) => {
    const n = get(r, t);
    const ra = ratio(r, t);
    const rel = n === 0 ? 'none observed' : ra >= 1.2 ? `${ra.toFixed(1)}× more than expected` : ra <= 0.8 ? `${ra.toFixed(1)}× of expected` : 'about as expected';
    return { n, ofTier: pct(n / colTotal(t)), ofRep: pct(n / rowTotal(r)), rel };
  };
  const info = $derived(hover ? describe(hover.r, hover.t) : null);
</script>

<div class="tm">
  <div class="controls">
    <div class="seg" role="group" aria-label="Scale cells by">
      <button type="button" aria-pressed={mode === 'count'} onclick={() => (mode = 'count')}>Count</button>
      <button type="button" aria-pressed={mode === 'tier'} onclick={() => (mode = 'tier')}>Share of tier</button>
      <button type="button" aria-pressed={mode === 'rep'} onclick={() => (mode = 'rep')}>Share of representation</button>
    </div>
  </div>

  <div class="grid" style="--cols:{cols.length}" role="table" aria-label="Systems by representation and management tier">
    <div role="row" class="hrow">
      <span role="columnheader" class="corner"></span>
      {#each cols as t (t)}
        <span role="columnheader" class="ch tier-{t}">
          <span class="chip"><span class="dot"></span>{t}</span>
          <span class="small muted">{colLabels[t]}</span>
        </span>
      {/each}
      <span role="columnheader" class="ch small muted">Total</span>
    </div>
    {#each rows as r (r)}
      <div role="row" class="row" class:dimmed={hover && hover.r !== r}>
        <span role="rowheader" class="rh">{rowLabels[r]}</span>
        {#each cols as t (t)}
          {@const n = get(r, t)}
          <a
            role="cell"
            class="cell tier-{t}"
            class:dim={hover && !(hover.r === r && hover.t === t)}
            href="/systems/?category={r}&tier={t}"
            onmouseenter={() => (hover = { r, t })}
            onmouseleave={() => (hover = null)}
            onfocus={() => (hover = { r, t })}
            onblur={() => (hover = null)}
            aria-label="{rowLabels[r]}, {t}: {n} systems"
          >
            <span class="sq" style="--s:{Math.sqrt(share(r, t))}"></span>
            <span class="n num">{n}</span>
          </a>
        {/each}
        <span role="cell" class="tot">
          <span class="bar" style="width:{(rowTotal(r) / N) * 100}%"></span>
          <span class="num small">{rowTotal(r)}</span>
        </span>
      </div>
    {/each}
    <div role="row" class="row foot">
      <span role="rowheader" class="rh small muted">Total</span>
      {#each cols as t (t)}
        <span role="cell" class="ctot num small">{colTotal(t)} <span class="muted">({pct(colTotal(t) / N)})</span></span>
      {/each}
      <span role="cell" class="ctot num small">{N}</span>
    </div>
  </div>

  <p class="readout small" aria-live="polite">
    {#if hover && info}
      <strong>{info.n}</strong> {rowLabels[hover.r].toLowerCase()} systems at {hover.t}: {info.ofTier} of {hover.t},
      {info.ofRep} of this representation, {info.rel}. Click to list them.
    {:else}
      Each system is counted once, at its highest tier. Hover a cell to compare it with what independent rows and columns
      would predict; click to list the systems.
    {/if}
  </p>
</div>

<style>
  .tm { display: grid; gap: 16px; }
  .grid { display: grid; gap: 6px; }
  .hrow, .row { display: grid; grid-template-columns: minmax(150px, 1.3fr) repeat(var(--cols), minmax(0, 1fr)) minmax(80px, 0.8fr); gap: 6px; align-items: center; }
  .row { transition: opacity var(--dur-2) var(--ease); }
  .ch { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .rh { font-weight: 600; font-size: 0.9375rem; line-height: 1.25; }
  .cell {
    position: relative; aspect-ratio: 1.35; display: grid; place-items: center; text-decoration: none; color: var(--ink);
    background: var(--surface); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden;
    transition: opacity var(--dur-2) var(--ease), border-color var(--dur-1);
  }
  .cell:hover, .cell:focus-visible { border-color: var(--c); }
  .cell.dim { opacity: 0.45; }
  .sq {
    position: absolute; width: calc(var(--s) * 82%); aspect-ratio: 1; max-height: 82%;
    background: var(--c); border-radius: 6px; transition: width var(--dur-2) var(--ease);
  }
  .n { position: relative; font-weight: 650; font-size: var(--step-1); padding: 0 6px; border-radius: 4px; background: color-mix(in srgb, var(--surface) 82%, transparent); }
  .tot { display: flex; align-items: center; gap: 8px; }
  .bar { height: 8px; background: var(--ink-2); border-radius: 0 4px 4px 0; opacity: 0.55; }
  .ctot { text-align: center; }
  .readout { min-height: 3em; color: var(--ink-2); max-width: 70ch; margin: 0; }
  @media (max-width: 640px) {
    .hrow, .row { grid-template-columns: 96px repeat(var(--cols), minmax(0, 1fr)) 44px; gap: 4px; }
    .ch .small { display: none; }
    .rh { font-size: 0.8125rem; }
    .bar { display: none; }
    .n { font-size: var(--step-0); }
  }
</style>
