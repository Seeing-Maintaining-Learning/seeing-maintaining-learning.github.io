<script lang="ts">
  import { arc as d3arc } from 'd3-shape';
  import { ICONS } from '../../../data/icons.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { CAT, CAT_ICON, CAT_NAME, CAT_VAR, FAM_SHORT, MODS, famKey, groupBy, polar, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy }: { points: Pt[]; colorBy: ColorBy } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let focus = $state<string | null>(null);
  const H = $derived(width < 640 ? 440 : 600);
  const S = $derived(Math.min(width, H));
  const cx = $derived(width / 2);
  const cy = $derived(H / 2);

  const PAD = 0.035;
  const byCat = groupBy(points, (p) => p.category);
  const total = points.length;

  // Angular span per category, starting at the top.
  const spans = $derived.by(() => {
    let a = -Math.PI / 2;
    const free = Math.PI * 2 - PAD * CAT.length;
    return CAT.map((c) => {
      const n = byCat.get(c)?.length ?? 0;
      const a0 = a + PAD / 2;
      const a1 = a0 + (free * n) / total;
      a = a1 + PAD / 2;
      return { c, n, a0, a1 };
    });
  });

  // Hybrid sub-ring: family combinations inside the hybrid span.
  const combos = $derived.by(() => {
    const hy = spans.find((s) => s.c === 'hybrid')!;
    const g = [...groupBy(byCat.get('hybrid') ?? [], famKey)].sort((a, b) => b[1].length - a[1].length);
    let a = hy.a0;
    return g.map(([k, list]) => {
      const a0 = a;
      const a1 = a0 + ((hy.a1 - hy.a0) * list.length) / hy.n;
      a = a1;
      return { k, n: list.length, a0, a1, name: k.split('').map((i) => FAM_SHORT[Number(i)]).join(' + ') };
    });
  });

  // Dots fill each sector on a polar grid, ordered by family combination, then modality, then date.
  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    const gap = S * 0.0195;
    const r0 = S * 0.3;
    for (const sp of spans) {
      const list = (byCat.get(sp.c) ?? [])
        .map((p) => points.indexOf(p))
        .sort((a, b) => famKey(points[a]).localeCompare(famKey(points[b])) || MODS.indexOf(points[a].modality as never) - MODS.indexOf(points[b].modality as never) || points[a].t - points[b].t);
      let k = 0;
      for (let row = 0; k < list.length; row++) {
        const r = r0 + row * gap;
        const cap = Math.max(1, Math.floor(((sp.a1 - sp.a0) * r) / gap));
        const take = Math.min(cap, list.length - k);
        for (let j = 0; j < take; j++) {
          const a = sp.a0 + ((j + 0.5) / cap) * (sp.a1 - sp.a0);
          out[list[k++]] = polar(cx, cy, r, a);
        }
      }
    }
    return out;
  });

  const ring = $derived(d3arc<{ a0: number; a1: number; r0: number; r1: number }>()
    .startAngle((d) => d.a0 + Math.PI / 2)
    .endAngle((d) => d.a1 + Math.PI / 2)
    .innerRadius((d) => d.r0)
    .outerRadius((d) => d.r1)
    .cornerRadius(4));
  const mid = (a0: number, a1: number) => (a0 + a1) / 2;
</script>

<Frame bind:width height={H} {points} {hover} {pos} label="Systems by representation: four categories with every system as a dot">
  <g transform="translate({cx} {cy})">
    {#each spans as sp (sp.c)}
      <path
        d={ring({ a0: sp.a0, a1: sp.a1, r0: S * 0.17, r1: S * 0.25 }) ?? ''}
        class="seg"
        class:faded={focus && focus !== sp.c}
        style="--c: var({CAT_VAR[sp.c]})"
        role="presentation"
        onpointerenter={() => (focus = sp.c)}
        onpointerleave={() => (focus = null)}
      />
    {/each}
    {#each combos as cb (cb.k)}
      <path d={ring({ a0: cb.a0 + 0.004, a1: cb.a1 - 0.004, r0: S * 0.26, r1: S * 0.283 }) ?? ''} class="sub" />
    {/each}
    <text class="big num" text-anchor="middle" dy="0.1em">{total}</text>
    <text class="small-t" text-anchor="middle" dy="1.9em">systems</text>
  </g>
  <Dots {points} {pos} r={S * 0.0072} {colorBy} bind:hover dim={focus ? (p) => p.category !== focus : null} />
  {#each spans as sp (sp.c)}
    {@const [lx, ly] = polar(cx, cy, S * 0.215, mid(sp.a0, sp.a1))}
    {#if sp.a1 - sp.a0 > 0.35}
      <g class="lab" transform="translate({lx} {ly})" style="--c: var({CAT_VAR[sp.c]})">
        <svg x="-9" y="-20" width="18" height="18" viewBox="0 0 24 24" class="ico">{@html ICONS[CAT_ICON[sp.c]]}</svg>
        <text text-anchor="middle" y="10" class="n num">{sp.n}</text>
      </g>
    {/if}
    {@const [ox, oy] = polar(cx, cy, S * 0.5, mid(sp.a0, sp.a1))}
    <text x={ox} y={oy} text-anchor={ox > cx + 4 ? 'start' : ox < cx - 4 ? 'end' : 'middle'} class="outer">{CAT_NAME[sp.c]}</text>
  {/each}
  {#each combos.filter((c) => c.n >= 10) as cb (cb.k)}
    {@const [tx, ty] = polar(cx, cy, S * 0.272, mid(cb.a0, cb.a1))}
    <text x={tx} y={ty} text-anchor="middle" dy="0.32em" class="subt">{cb.n}</text>
  {/each}
</Frame>
<p class="cap small muted">
  Inner ring: the four representation categories. Outer band: hybrid systems by the families they combine
  ({combos.map((c) => `${c.name} ${c.n}`).join(' · ')}). Every dot is one system.
</p>

<style>
  .seg { fill: color-mix(in srgb, var(--c) 30%, var(--surface)); stroke: var(--c); stroke-width: 1.5; transition: opacity 200ms; cursor: default; }
  .seg.faded { opacity: 0.3; }
  .sub { fill: color-mix(in srgb, var(--accent) 45%, var(--surface)); }
  .big { font-size: 34px; font-weight: 700; fill: var(--ink); }
  .small-t { font-size: 12px; fill: var(--muted); }
  .lab .ico { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .lab .n { font-size: 12px; font-weight: 700; fill: var(--ink); }
  .outer { font-size: 12.5px; font-weight: 600; fill: var(--ink-2); }
  .subt { font-size: 9.5px; font-weight: 700; fill: var(--surface); pointer-events: none; }
  .cap { margin-top: 8px; }
</style>
