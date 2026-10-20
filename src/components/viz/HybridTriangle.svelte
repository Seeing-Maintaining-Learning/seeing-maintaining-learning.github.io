<script lang="ts">
  interface Combo { families: string[]; n: number; examples: { name: string; href: string }[] }
  let { combos, labels, order }: { combos: Combo[]; labels: Record<string, string>; order: string[] } = $props();

  const P: Record<string, [number, number]> = {};
  const pos: [number, number][] = [[90, 250], [410, 250], [250, 52]];
  order.forEach((f, i) => (P[f] = pos[i]));
  const maxN = Math.max(...combos.map((c) => c.n));
  const w = (n: number) => 3 + (n / maxN) * 26;

  const pairs = combos.filter((c) => c.families.length === 2);
  const triple = combos.find((c) => c.families.length === 3);
  const singles = combos.filter((c) => c.families.length === 1);
  const total = combos.reduce((a, c) => a + c.n, 0);

  let sel = $state<Combo>(pairs.sort((a, b) => b.n - a.n)[0]);
  const keyOf = (c: Combo) => c.families.join('+');
  const name = (c: Combo) =>
    c.families.length === 1 ? `Within ${labels[c.families[0]].toLowerCase()}` : c.families.map((f) => labels[f]).join(' + ');
</script>

<div class="ht">
  <svg viewBox="0 0 500 320" role="group" aria-label="Representation families combined by hybrid systems">
    {#each pairs as c (keyOf(c))}
      {@const [a, b] = c.families.map((f) => P[f])}
      <g
        class="edge"
        class:on={sel === c}
        role="button"
        tabindex="0"
        aria-label="{name(c)}: {c.n} systems"
        onclick={() => (sel = c)}
        onpointerenter={() => (sel = c)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (sel = c)}
      >
        <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke-width={w(c.n)} />
        <line class="hit" x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
        <text x={(a[0] + b[0]) / 2} y={(a[1] + b[1]) / 2} dy="0.32em" text-anchor="middle" class="num">{c.n}</text>
      </g>
    {/each}
    {#if triple}
      <g
        class="edge tri"
        class:on={sel === triple}
        role="button"
        tabindex="0"
        aria-label="{name(triple)}: {triple.n} systems"
        onclick={() => (sel = triple)}
        onpointerenter={() => (sel = triple)}
        onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (sel = triple)}
      >
        <circle cx="250" cy="185" r="18" />
        <text x="250" y="185" dy="0.32em" text-anchor="middle" class="num">{triple.n}</text>
      </g>
    {/if}
    {#each order as f, i (f)}
      {@const [x, y] = P[f]}
      {@const single = singles.find((c) => c.families[0] === f)}
      <g class="node">
        <circle cx={x} cy={y} r="34" />
        {#if single}
          <g
            class="edge loop"
            class:on={sel === single}
            role="button"
            tabindex="0"
            aria-label="{name(single)}: {single.n} systems"
            onclick={() => (sel = single)}
            onpointerenter={() => (sel = single)}
            onkeydown={(e) => (e.key === 'Enter' || e.key === ' ') && (sel = single)}
          >
            <circle cx={x} cy={y} r="40" fill="none" stroke-width={w(single.n)} />
            <text x={x + (i === 0 ? -50 : i === 1 ? 50 : 0)} y={y + (i === 2 ? -48 : 0)} dy="0.32em" text-anchor="middle" class="num small-n">{single.n}</text>
          </g>
        {/if}
        <text x={x} y={y + (i === 2 ? -62 : 60)} text-anchor="middle" class="flabel">{labels[f]}</text>
      </g>
    {/each}
  </svg>

  <div class="detail" aria-live="polite">
    <p class="small muted">{total} hybrid systems explicitly link distinct representation paths.</p>
    <h3>{name(sel)}</h3>
    <p><strong class="num">{sel.n}</strong> systems</p>
    <ul>
      {#each sel.examples as ex (ex.href)}
        <li><a href={ex.href}>{ex.name}</a></li>
      {/each}
    </ul>
    {#if sel.n > sel.examples.length}
      <a class="small" href="/systems/?category=hybrid">All hybrid systems</a>
    {/if}
  </div>
</div>

<style>
  .ht { display: grid; grid-template-columns: 1.2fr 1fr; gap: 24px; align-items: center; }
  svg { width: 100%; height: auto; overflow: visible; }
  .edge line, .edge circle { stroke: var(--accent); stroke-opacity: 0.35; stroke-linecap: round; transition: stroke-opacity var(--dur-1); cursor: pointer; }
  .edge .hit { stroke: transparent; stroke-width: 28; }
  .edge.on line:not(.hit), .edge.on circle { stroke-opacity: 0.85; }
  .tri circle { fill: var(--surface); stroke-width: 3; }
  .edge text { fill: var(--ink); font-weight: 650; font-size: 15px; paint-order: stroke; stroke: var(--bg); stroke-width: 4px; pointer-events: none; }
  .edge text.small-n { font-size: 12px; }
  .node > circle { fill: var(--surface); stroke: var(--ink-2); stroke-width: 1.5; }
  .flabel { fill: var(--ink-2); font-size: 13px; font-weight: 600; }
  .edge:focus-visible { outline: none; }
  .edge:focus-visible line:not(.hit), .edge:focus-visible circle { stroke: var(--focus); stroke-opacity: 1; }
  .detail ul { list-style: none; padding: 0; margin: 8px 0 12px; display: flex; flex-wrap: wrap; gap: 6px 14px; }
  .detail h3 { margin-bottom: 4px; }
  @media (max-width: 760px) { .ht { grid-template-columns: 1fr; } }
</style>
