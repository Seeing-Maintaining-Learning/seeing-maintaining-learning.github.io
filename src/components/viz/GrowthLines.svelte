<script lang="ts">
  import { scaleLinear, scalePoint } from 'd3-scale';
  import { line, curveMonotoneX } from 'd3-shape';

  interface Series { key: string; label: string; cls: string; values: number[] }
  let { years, series, title }: { years: number[]; series: Series[]; title: string } = $props();

  let width = $state(720);
  const height = 320;
  const m = { top: 16, right: 150, bottom: 32, left: 40 };
  let hi = $state<number | null>(null);
  let focus = $state<string | null>(null);

  const narrow = $derived(width < 560);
  const right = $derived(narrow ? 16 : m.right);
  const x = $derived(scalePoint<number>().domain(years).range([m.left, width - right]).padding(0.1));
  const yMax = $derived(Math.max(...series.flatMap((s) => s.values)));
  const y = $derived(scaleLinear().domain([0, yMax]).nice().range([height - m.bottom, m.top]));
  const path = $derived((v: number[]) =>
    line<number>()
      .x((_, i) => x(years[i]) ?? 0)
      .y((d) => y(d))
      .curve(curveMonotoneX)(v) ?? '',
  );

  // Direct labels: sort by final value and nudge apart to avoid collisions.
  const labels = $derived.by(() => {
    const ys = series
      .map((s) => ({ s, y: y(s.values[s.values.length - 1]) }))
      .sort((a, b) => a.y - b.y);
    for (let i = 1; i < ys.length; i++) if (ys[i].y - ys[i - 1].y < 16) ys[i].y = ys[i - 1].y + 16;
    return ys;
  });

  function move(e: PointerEvent) {
    const r = (e.currentTarget as SVGElement).getBoundingClientRect();
    const px = ((e.clientX - r.left) / r.width) * width;
    let best = 0;
    years.forEach((yr, i) => {
      if (Math.abs((x(yr) ?? 0) - px) < Math.abs((x(years[best]) ?? 0) - px)) best = i;
    });
    hi = best;
  }
</script>

<figure class="gl" bind:clientWidth={width}>
  <figcaption class="sr-only">{title}</figcaption>
  {#if narrow}
    <ul class="legend">
      {#each series as s (s.key)}
        <li class={s.cls}><span class="sw"></span>{s.label}</li>
      {/each}
    </ul>
  {/if}
  <svg
    viewBox="0 0 {width} {height}"
    width={width}
    height={height}
    role="img"
    aria-label={title}
    onpointermove={move}
    onpointerleave={() => (hi = null)}
  >
    {#each y.ticks(4) as t (t)}
      <line class="grid" x1={m.left} x2={width - right} y1={y(t)} y2={y(t)} />
      <text class="tick" x={m.left - 8} y={y(t)} dy="0.32em" text-anchor="end">{t}</text>
    {/each}
    {#each years as yr (yr)}
      <text class="tick" x={x(yr)} y={height - 8} text-anchor="middle">{yr}</text>
    {/each}
    {#if hi !== null}
      <line class="cross" x1={x(years[hi])} x2={x(years[hi])} y1={m.top} y2={height - m.bottom} />
    {/if}
    {#each series as s (s.key)}
      <g class="s {s.cls}" class:dim={focus && focus !== s.key}>
        <path d={path(s.values)} />
        {#each s.values as v, i (i)}
          <circle cx={x(years[i])} cy={y(v)} r={hi === i ? 5 : 3} />
        {/each}
      </g>
    {/each}
    {#if !narrow}
      {#each labels as l (l.s.key)}
        <text
          class="dl {l.s.cls}"
          x={width - right + 10}
          y={l.y}
          dy="0.32em"
          role="presentation"
          onpointerenter={() => (focus = l.s.key)}
          onpointerleave={() => (focus = null)}
        >
          <tspan class="sw">●</tspan> {l.s.label} <tspan class="num v">{l.s.values[l.s.values.length - 1]}</tspan>
        </text>
      {/each}
    {/if}
  </svg>
  {#if hi !== null}
    <div class="viz-tip" style="left:{Math.min((x(years[hi]) ?? 0) + 12, width - 200)}px; top:{m.top}px">
      <strong>Through {years[hi]}</strong>
      {#each [...series].sort((a, b) => b.values[hi!] - a.values[hi!]) as s (s.key)}
        <div class="row {s.cls}"><span class="sw"></span>{s.label}<span class="num">{s.values[hi!]}</span></div>
      {/each}
    </div>
  {/if}
  <table class="sr-only">
    <caption>{title}</caption>
    <thead><tr><th>Series</th>{#each years as yr (yr)}<th>{yr}</th>{/each}</tr></thead>
    <tbody>{#each series as s (s.key)}<tr><th>{s.label}</th>{#each s.values as v, i (i)}<td>{v}</td>{/each}</tr>{/each}</tbody>
  </table>
</figure>

<style>
  .gl { position: relative; margin: 0; }
  svg { display: block; overflow: visible; touch-action: pan-y; }
  .grid { stroke: var(--rule); stroke-width: 1; }
  .tick { fill: var(--muted); font-size: 12px; }
  .cross { stroke: var(--muted); stroke-dasharray: 3 3; }
  .s path { fill: none; stroke: var(--c); stroke-width: 2; }
  .s circle { fill: var(--c); stroke: var(--surface); stroke-width: 2; transition: r var(--dur-1); }
  .s { transition: opacity var(--dur-2); }
  .s.dim { opacity: 0.2; }
  .dl { font-size: 13px; fill: var(--ink-2); cursor: default; }
  .dl .sw { fill: var(--c); }
  .dl .v { fill: var(--ink); font-weight: 600; }
  .viz-tip .row { display: grid; grid-template-columns: 12px 1fr auto; gap: 6px; align-items: center; }
  .sw { display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
  .legend { list-style: none; display: flex; flex-wrap: wrap; gap: 6px 14px; padding: 0; margin: 0 0 8px; font-size: 0.8125rem; color: var(--ink-2); }
  .legend li { display: flex; gap: 6px; align-items: center; }
</style>
