<script lang="ts">
  import { scaleLinear } from 'd3-scale';
  import { area, curveBasis, stack, stackOffsetWiggle, stackOrderInsideOut } from 'd3-shape';
  import { ICONS } from '../../../data/icons.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { MODS, MOD_NAME, MOD_VAR, hash, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy }: { points: Pt[]; colorBy: ColorBy } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let focus = $state<string | null>(null);
  const H = $derived(width < 640 ? 420 : 520);
  const M = $derived({ l: 16, r: width < 640 ? 16 : 120, t: 20, b: 36 });

  // Quarterly bins from 2023 to 2026; earlier work joins the first bin.
  const T0 = 2023;
  const rawBin = (t: number) => Math.max(0, Math.floor((t - T0) * 4));
  // End at the last quarter that has data so the streams do not pinch to zero.
  const BINS = Math.max(...points.map((p) => rawBin(p.t))) + 1;
  const binOf = (t: number) => Math.min(BINS - 1, rawBin(t));
  const counts = Array.from({ length: BINS }, (_, b) => {
    const row: Record<string, number> = { b };
    for (const m of MODS) row[m] = points.filter((p) => p.modality === m && binOf(p.t) === b).length;
    return row;
  });
  const series = stack<Record<string, number>>().keys([...MODS]).offset(stackOffsetWiggle).order(stackOrderInsideOut)(counts);
  const lo = Math.min(...series.flatMap((s) => s.map((d) => d[0])));
  const hi = Math.max(...series.flatMap((s) => s.map((d) => d[1])));

  const x = $derived(scaleLinear().domain([0, BINS - 1]).range([M.l, width - M.r]));
  const y = $derived(scaleLinear().domain([lo, hi]).range([H - M.b, M.t]));
  const shape = $derived(area<[number, number]>().x((_, i) => x(i)).y0((d) => y(d[0])).y1((d) => y(d[1])).curve(curveBasis));

  // Each system becomes a particle inside its stream at its quarter.
  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    for (const s of series) {
      const m = s.key;
      points.forEach((p, i) => {
        if (p.modality !== m) return;
        // Fractional bin position, then interpolate the stream's band between neighbouring bins.
        const xb = Math.max(0, Math.min(BINS - 1, (p.t - T0) * 4 - 0.5 + (hash(p.id, 7) - 0.5) * 0.4));
        const b0 = Math.floor(xb);
        const b1 = Math.min(BINS - 1, b0 + 1);
        const f = xb - b0;
        const lo0 = s[b0][0] + (s[b1][0] - s[b0][0]) * f;
        const hi0 = s[b0][1] + (s[b1][1] - s[b0][1]) * f;
        const u = 0.2 + 0.6 * hash(p.id);
        out[i] = [x(xb), y(lo0 + (hi0 - lo0) * u)];
      });
    }
    return out;
  });
  // Right-hand labels at each stream's last midpoint, nudged apart so they never overlap.
  const labelY = $derived.by(() => {
    const ys = series.map((s) => ({ k: s.key, y: y((s[BINS - 1][0] + s[BINS - 1][1]) / 2) })).sort((a, b) => a.y - b.y);
    for (let i = 1; i < ys.length; i++) if (ys[i].y - ys[i - 1].y < 22) ys[i].y = ys[i - 1].y + 22;
    return Object.fromEntries(ys.map((v) => [v.k, v.y]));
  });
</script>

<Frame bind:width height={H} {points} {hover} {pos} label="Streamgraph of new systems per quarter by modality">
  {#each [2023, 2024, 2025, 2026].filter((yr) => (yr - T0) * 4 < BINS) as yr (yr)}
    <line x1={x((yr - T0) * 4)} x2={x((yr - T0) * 4)} y1={M.t} y2={H - M.b} class="grid" />
    <text x={x((yr - T0) * 4) + 4} y={H - 12} class="yr">{yr === 2023 ? '≤2023' : yr}</text>
  {/each}
  {#each series as s (s.key)}
    <path
      d={shape(s as unknown as [number, number][]) ?? ''}
      class="stream"
      class:faded={focus && focus !== s.key}
      style="--c: var({MOD_VAR[s.key]})"
      role="presentation"
      onpointerenter={() => (focus = s.key)}
      onpointerleave={() => (focus = null)}
    />
  {/each}
  <Dots {points} {pos} r={width < 640 ? 2 : 2.8} {colorBy} bind:hover dim={focus ? (p) => p.modality !== focus : null} />
  {#if width >= 640}
    {#each series as s (s.key)}
      <g transform="translate({width - M.r + 10} {labelY[s.key]})" class="lab" style="--c: var({MOD_VAR[s.key]})">
        <svg x="0" y="-8" width="16" height="16" viewBox="0 0 24 24" class="ico">{@html ICONS[s.key]}</svg>
        <text x="21" y="4" class="ln">{MOD_NAME[s.key]} <tspan class="lv num">{points.filter((p) => p.modality === s.key).length}</tspan></text>
      </g>
    {/each}
  {/if}
</Frame>
<p class="cap small muted">Stream width is the number of new systems per quarter; every particle is one system placed at its publication date.</p>

<style>
  .grid { stroke: var(--rule); stroke-dasharray: 2 4; }
  .yr { font-size: 12px; font-weight: 600; fill: var(--muted); }
  .stream { fill: color-mix(in srgb, var(--c) 22%, var(--surface)); stroke: var(--c); stroke-width: 1.2; stroke-opacity: 0.7; transition: opacity 200ms; }
  .stream.faded { opacity: 0.2; }
  .ico { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ln { font-size: 12.5px; font-weight: 650; fill: var(--ink); }
  .lv { fill: var(--muted); font-weight: 500; }
  .cap { margin-top: 8px; }
</style>
