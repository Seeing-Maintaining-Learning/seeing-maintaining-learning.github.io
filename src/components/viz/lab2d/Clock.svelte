<script lang="ts">
  import { onMount } from 'svelte';
  import { arc as d3arc } from 'd3-shape';
  import { ICONS } from '../../../data/icons.ts';
  import { reducedMotion, whileVisible } from '../motion.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { TIERS, TIER_NAME, polar, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy, paused }: { points: Pt[]; colorBy: ColorBy; paused: boolean } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let hand = $state(1);
  let el: HTMLDivElement;
  const H = $derived(width < 640 ? 440 : 600);
  const S = $derived(Math.min(width, H));
  const cx = $derived(width / 2);
  const cy = $derived(H / 2 + 10);

  // Time runs clockwise from the top, leaving a gap for labels. Years get equal angles.
  const YEARS = [2023, 2024, 2025, 2026];
  const GAP = 0.55;
  const A0 = -Math.PI / 2 + GAP / 2;
  const SPAN = Math.PI * 2 - GAP;
  const frac = (t: number) => {
    const y = Math.max(2023, Math.min(2026.999, t));
    return (y - 2023) / 4;
  };
  const angle = (t: number) => A0 + frac(t) * SPAN;
  const BAND: Record<string, [number, number]> = { T1: [0.13, 0.21], T2: [0.24, 0.38], T3: [0.41, 0.46] };

  // Polar beeswarm: within each tier band, stack points outward when their angles collide.
  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    const gap = S * 0.017;
    for (const t of TIERS) {
      const [b0, b1] = BAND[t];
      const idx = points.map((p, i) => i).filter((i) => points[i].tier === t).sort((a, b) => points[a].t - points[b].t);
      const bins = new Map<number, number>();
      for (const i of idx) {
        const a = angle(points[i].t);
        const r0 = S * b0;
        const bin = Math.round((a * r0) / gap);
        const k = bins.get(bin) ?? 0;
        bins.set(bin, k + 1);
        const rows = Math.max(1, Math.floor((S * (b1 - b0)) / gap));
        const r = r0 + (k % rows) * gap;
        const nudge = Math.floor(k / rows) * (gap / r);
        out[i] = polar(cx, cy, r, a + nudge);
      }
    }
    return out;
  });

  const bandArc = $derived(d3arc<{ r0: number; r1: number }>()
    .startAngle(A0 + Math.PI / 2)
    .endAngle(A0 + SPAN + Math.PI / 2)
    .innerRadius((d) => d.r0)
    .outerRadius((d) => d.r1)
    .cornerRadius(10));
  const handA = $derived(A0 + hand * SPAN);
  // While the hand sweeps, systems published after it are dimmed: the field fills in over time.
  const future = $derived((p: Pt) => frac(p.t) > hand);

  onMount(() => {
    let raf = 0;
    let last = 0;
    let visible = false;
    const loop = (now: number) => {
      if (!paused && hover === null) hand = (hand + Math.min(50, last ? now - last : 16) / 14000) % 1.0001;
      last = now;
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    if (reducedMotion()) return;
    hand = 0;
    const stop = whileVisible(el, (v) => {
      visible = v;
      last = 0;
      if (v && !raf) raf = requestAnimationFrame(loop);
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  });
</script>

<div bind:this={el}>
  <Frame bind:width height={H} {points} {hover} {pos} label="Memory clock: systems by publication date (angle) and management tier (ring)">
    <g transform="translate({cx} {cy})">
      {#each TIERS as t (t)}
        <path d={bandArc({ r0: S * BAND[t][0] - 6, r1: S * BAND[t][1] + 6 }) ?? ''} class="band" style="--c: var(--t{t[1]})" />
      {/each}
      {#each YEARS as y (y)}
        {@const a = angle(y)}
        {@const [x0, y0] = polar(0, 0, S * 0.11, a)}
        {@const [x1, y1] = polar(0, 0, S * 0.47, a)}
        {@const [lx, ly] = polar(0, 0, S * 0.495, angle(y + 0.5))}
        <line class="tick" x1={x0} y1={y0} x2={x1} y2={y1} />
        <text x={lx} y={ly} text-anchor="middle" dy="0.32em" class="yr">{y === 2023 ? '≤2023' : y}</text>
      {/each}
      {#if hand < 1}
        {@const [hx, hy] = polar(0, 0, S * 0.47, handA)}
        <line x1="0" y1="0" x2={hx} y2={hy} class="hand" />
        <circle r="5" class="hub" />
      {/if}
    </g>
    {#each TIERS as t (t)}
      {@const [tx, ty] = polar(cx, cy, S * ((BAND[t][0] + BAND[t][1]) / 2), -Math.PI / 2)}
      <g transform="translate({tx} {ty})" class="tl" style="--c: var(--t{t[1]})">
        <svg x="-38" y="-8" width="14" height="14" viewBox="0 0 24 24" class="ico">{@html ICONS[t]}</svg>
        <text x="-20" dy="0.35em" class="tn">{t}</text>
      </g>
    {/each}
    <Dots {points} {pos} r={S * 0.0068} {colorBy} bind:hover dim={hand < 1 ? future : null} />
  </Frame>
</div>
<ul class="key small">
  {#each TIERS as t (t)}
    <li class="tier-{t}"><span class="dot"></span>{TIER_NAME[t]} <span class="num muted">{points.filter((p) => p.tier === t).length}</span></li>
  {/each}
  <li class="muted">Angle = publication date · the hand sweeps through time</li>
</ul>

<style>
  .band { fill: color-mix(in srgb, var(--c) 10%, transparent); stroke: color-mix(in srgb, var(--c) 45%, transparent); stroke-width: 1; }
  .tick { stroke: var(--rule); stroke-dasharray: 2 4; }
  .yr { font-size: 12px; font-weight: 600; fill: var(--muted); }
  .hand { stroke: var(--accent); stroke-width: 2; stroke-linecap: round; }
  .hub { fill: var(--accent); }
  .tl .ico { fill: none; stroke: var(--c); stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
  .tn { font-size: 12px; font-weight: 700; fill: var(--c); }
  .key { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-wrap: wrap; gap: 6px 18px; }
  .key li { display: inline-flex; align-items: center; gap: 6px; }
  .key .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
  .key .tier-T1 .dot { background: transparent; box-shadow: inset 0 0 0 2px var(--c); }
</style>
