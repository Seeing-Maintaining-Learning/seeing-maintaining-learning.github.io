<script lang="ts">
  import Icon from '../Icon.svelte';

  type Cell = { cat: string; tier: string; n: number };
  let {
    rows,
    cols,
    cells,
    rowLabels,
    colLabels,
    query = '',
  }: {
    rows: string[];
    cols: string[];
    cells: Cell[];
    rowLabels: Record<string, string>;
    colLabels: Record<string, string>;
    query?: string;
  } = $props();

  const ROW_ICON: Record<string, string> = {
    native: 'source_preserving_and_modality_native_memory',
    cross: 'cross_represented_explicit_memory',
    latent: 'internalized_latent_and_parametric_memory',
    hybrid: 'hybrid',
  };
  const div = (a: number, b: number) => (b ? a / b : 0);
  const N = cells.reduce((a, c) => a + c.n, 0);
  const get = (r: string, t: string) => cells.find((c) => c.cat === r && c.tier === t)?.n ?? 0;
  const rowTotal = (r: string) => cells.filter((c) => c.cat === r).reduce((a, c) => a + c.n, 0);
  const colTotal = (t: string) => cells.filter((c) => c.tier === t).reduce((a, c) => a + c.n, 0);
  const maxCell = Math.max(1, ...cells.map((c) => c.n));
  const maxRow = Math.max(1, ...rows.map(rowTotal));

  let mode = $state<'count' | 'tier' | 'rep'>('count');
  let hover = $state<{ r: string; t: string } | null>(null);

  const share = (r: string, t: string) =>
    mode === 'tier' ? div(get(r, t), colTotal(t)) : mode === 'rep' ? div(get(r, t), rowTotal(r)) : div(get(r, t), maxCell);
  const pct = (x: number) => `${Math.round(x * 100)}%`;
  const valueText = (r: string, t: string) =>
    mode === 'count' ? String(get(r, t)) : pct(mode === 'tier' ? div(get(r, t), colTotal(t)) : div(get(r, t), rowTotal(r)));
  // Circle area encodes the value: diameter grows with sqrt(share).
  const size = (r: string, t: string) => (get(r, t) ? 10 + 38 * Math.sqrt(share(r, t)) : 0);

  const readout = $derived.by(() => {
    if (!hover) return null;
    const { r, t } = hover;
    const n = get(r, t);
    const ratio = div(n, (rowTotal(r) * colTotal(t)) / N);
    const rel = n === 0 ? 'none observed' : ratio >= 1.2 ? `${ratio.toFixed(1)}× more than expected` : ratio <= 0.8 ? `${ratio.toFixed(1)}× of expected` : 'about as expected';
    return { n, r, t, ofTier: pct(div(n, colTotal(t))), ofRep: pct(div(n, rowTotal(r))), rel };
  });
</script>

<div class="tm">
  <div class="seg" role="group" aria-label="Show values as">
    <button type="button" aria-pressed={mode === 'count'} onclick={() => (mode = 'count')}>Count</button>
    <button type="button" aria-pressed={mode === 'tier'} onclick={() => (mode = 'tier')}>% of tier</button>
    <button type="button" aria-pressed={mode === 'rep'} onclick={() => (mode = 'rep')}>% of representation</button>
  </div>

  <div class="grid" style="--cols:{cols.length}" role="table" aria-label="Systems by representation and management tier">
    <div class="hrow" role="row">
      <span role="columnheader"></span>
      {#each cols as t (t)}
        <span role="columnheader" class="ch tier-{t}" class:on={hover?.t === t}>
          <span class="ci"><Icon name={t} size={15} /></span>
          <span class="cn">{t}</span>
          <span class="cl">{colLabels[t]}</span>
          <span class="ct num">{colTotal(t)} · {pct(div(colTotal(t), N))}</span>
        </span>
      {/each}
      <span role="columnheader" class="ch tot-h">Total</span>
    </div>
    {#each rows as r (r)}
      <div class="row" role="row" class:on={hover?.r === r}>
        <span role="rowheader" class="rh">
          <span class="ri"><Icon name={ROW_ICON[r] ?? 'hybrid'} size={16} /></span>
          <span>{rowLabels[r]}</span>
        </span>
        {#each cols as t (t)}
          {@const s = size(r, t)}
          <span role="cell" class="cw tier-{t}" class:col={hover?.t === t}>
            <a
              class="cell"
              href="/systems/?category={r}&tier={t}{query ? `&${query}` : ''}"
              aria-label="{rowLabels[r]}, {t}: {get(r, t)} systems"
              onpointerenter={() => (hover = { r, t })}
              onpointerleave={() => (hover = null)}
              onfocus={() => (hover = { r, t })}
              onblur={() => (hover = null)}
            >
              <span class="bub" class:zero={!get(r, t)} style="width:{s}px; height:{s}px"></span>
              <span class="v num" class:inside={s >= 34}>{get(r, t) ? valueText(r, t) : '–'}</span>
            </a>
          </span>
        {/each}
        <span role="cell" class="tot">
          <span class="tb"><span style="width:{(rowTotal(r) / maxRow) * 100}%"></span></span>
          <span class="num">{rowTotal(r)}</span>
        </span>
      </div>
    {/each}
  </div>

  <p class="readout small" aria-live="polite">
    {#if readout}
      <strong class="num">{readout.n}</strong> {rowLabels[readout.r].toLowerCase()} systems at {readout.t}: {readout.ofTier} of {readout.t},
      {readout.ofRep} of this representation, {readout.rel}.
    {:else}
      Each system counted once, at its highest tier. Circle area shows the value. Hover to compare with chance; click to list the systems.
    {/if}
  </p>
</div>

<style>
  .tm { display: grid; gap: 14px; max-width: 700px; }
  .seg { justify-self: start; }
  .grid { display: grid; gap: 0; border: 1px solid var(--rule); border-radius: 14px; overflow: hidden; background: var(--surface); }
  .hrow, .row { display: grid; grid-template-columns: minmax(140px, 1.5fr) repeat(var(--cols), minmax(0, 1fr)) minmax(70px, 0.9fr); align-items: center; }
  .hrow { background: var(--surface-2); border-bottom: 1px solid var(--rule); }
  .row + .row { border-top: 1px solid var(--rule); }
  .row { transition: background var(--dur-1); }
  .row.on { background: color-mix(in srgb, var(--accent) 5%, transparent); }
  .ch { display: grid; justify-items: center; gap: 1px; padding: 10px 4px; text-align: center; transition: background var(--dur-1); }
  .ch.on { background: color-mix(in srgb, var(--c) 12%, transparent); }
  .ci { color: var(--c); display: inline-flex; }
  .cn { font-weight: 700; font-size: 0.875rem; }
  .cl { font-size: 0.75rem; color: var(--muted); }
  .ct { font-size: 0.75rem; color: var(--ink-2); }
  .tot-h { font-size: 0.75rem; color: var(--muted); }
  .rh { display: flex; align-items: center; gap: 8px; padding: 0 12px; font-size: 0.875rem; font-weight: 600; line-height: 1.2; }
  .ri { color: var(--accent-ink); display: inline-flex; flex: none; }
  .cw { display: block; height: 64px; transition: background var(--dur-1); }
  .cw.col { background: color-mix(in srgb, var(--c) 7%, transparent); }
  .cell { position: relative; display: grid; place-items: center; height: 100%; text-decoration: none; color: var(--ink); }
  .bub {
    border-radius: 50%; background: color-mix(in srgb, var(--c) 82%, transparent); border: 1.5px solid var(--c);
    transition: width 300ms var(--ease), height 300ms var(--ease), transform 150ms var(--ease);
  }
  .cell:hover .bub, .cell:focus-visible .bub { transform: scale(1.08); }
  .bub.zero { border: 1px dashed var(--rule); background: none; width: 10px !important; height: 10px !important; }
  .v { position: absolute; font-size: 0.8125rem; font-weight: 700; color: var(--ink); transform: translateY(calc(50% + 14px)); }
  .v.inside { transform: none; color: var(--surface); }
  .tot { display: flex; align-items: center; gap: 8px; padding: 0 12px; font-size: 0.8125rem; }
  .tb { flex: 1; height: 6px; border-radius: 3px; background: var(--surface-2); overflow: hidden; }
  .tb span { display: block; height: 100%; background: var(--ink-2); opacity: 0.55; }
  .readout { min-height: 2.8em; color: var(--ink-2); margin: 0; }
  @media (max-width: 560px) {
    .hrow, .row { grid-template-columns: 92px repeat(var(--cols), minmax(0, 1fr)) 38px; }
    .cl, .ct { display: none; }
    .rh { font-size: 0.75rem; padding: 0 8px; }
    .ri { display: none; }
    .tb { display: none; }
    .tot { padding: 0 6px; }
  }
</style>
