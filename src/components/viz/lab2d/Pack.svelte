<script lang="ts">
  import { hierarchy, pack } from 'd3-hierarchy';
  import { ICONS } from '../../../data/icons.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { MODS, MOD_NAME, MOD_VAR, TIERS, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy }: { points: Pt[]; colorBy: ColorBy } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let focus = $state<string | null>(null);
  const H = $derived(width < 640 ? 460 : 600);

  type Node = { name: string; key?: string; tier?: string; i?: number; children?: Node[] };
  const tree: Node = {
    name: 'all',
    children: MODS.map((m) => ({
      name: m,
      key: m,
      children: TIERS.map((t) => ({
        name: `${m}:${t}`,
        tier: t,
        children: points.map((p, i) => ({ p, i })).filter(({ p }) => p.modality === m && p.tier === t).map(({ i }) => ({ name: points[i].id, i })),
      })).filter((n) => n.children!.length),
    })),
  };

  const layout = $derived.by(() => {
    const root = hierarchy<Node>(tree).sum((d) => (d.i !== undefined ? 1 : 0)).sort((a, b) => (b.value ?? 0) - (a.value ?? 0));
    return pack<Node>().size([width - 8, H - 8]).padding((d) => (d.depth === 0 ? 14 : d.depth === 1 ? 7 : 1.6))(root);
  });
  const mods = $derived(layout.children ?? []);
  const tiers = $derived(mods.flatMap((m) => m.children ?? []));
  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    for (const leaf of layout.leaves()) if (leaf.data.i !== undefined) out[leaf.data.i] = [leaf.x + 4, leaf.y + 4];
    return out;
  });
  const leafR = $derived(Math.max(1.6, (layout.leaves()[0]?.r ?? 3) * 0.92));
</script>

<Frame bind:width height={H} {points} {hover} {pos} label="Bubble pack: modality, then management tier, then systems">
  <g transform="translate(4 4)">
    {#each mods as m (m.data.name)}
      <g class="mod" class:faded={focus && focus !== m.data.name} style="--c: var({MOD_VAR[m.data.name]})" role="presentation"
        onpointerenter={() => (focus = m.data.name)} onpointerleave={() => (focus = null)}>
        <circle cx={m.x} cy={m.y} r={m.r} class="mc" />
      </g>
    {/each}
    {#each tiers as t (t.data.name)}
      <circle cx={t.x} cy={t.y} r={t.r} class="tc" style="--t: var(--t{t.data.tier?.[1]})" />
      {#if t.r > 26}<text x={t.x} y={t.y - t.r + 11} text-anchor="middle" class="tt">{t.data.tier}</text>{/if}
    {/each}
  </g>
  <Dots {points} {pos} r={leafR} {colorBy} bind:hover dim={focus ? (p) => p.modality !== focus : null} />
  {#each mods as m (m.data.name)}
    <g transform="translate({m.x + 4} {m.y + 4 - m.r - 2})" class="ml" style="--c: var({MOD_VAR[m.data.name]})">
      <rect x="-48" y="-13" width="96" height="24" rx="12" class="pill" />
      <svg x="-40" y="-8" width="14" height="14" viewBox="0 0 24 24" class="ico">{@html ICONS[m.data.name]}</svg>
      <text x="-22" y="4" class="mn">{MOD_NAME[m.data.name]} <tspan class="mv num">{m.value}</tspan></text>
    </g>
  {/each}
</Frame>
<p class="cap small muted">Each large bubble is a modality; inner rings split it by management tier (T1, T2, T3); every dot is one system.</p>

<style>
  .mod { transition: opacity 200ms; }
  .mod.faded { opacity: 0.35; }
  .mc { fill: color-mix(in srgb, var(--c) 13%, var(--surface)); stroke: var(--c); stroke-width: 1.6; }
  .tc { fill: color-mix(in srgb, var(--t) 7%, transparent); stroke: color-mix(in srgb, var(--t) 55%, transparent); stroke-dasharray: 3 3; pointer-events: none; }
  .tt { font-size: 10px; font-weight: 700; fill: var(--t); pointer-events: none; }
  .pill { fill: var(--surface); stroke: color-mix(in srgb, var(--c) 60%, transparent); }
  .ico { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .mn { font-size: 12px; font-weight: 650; fill: var(--ink); }
  .mv { fill: var(--muted); font-weight: 500; }
  .ml { pointer-events: none; }
  .cap { margin-top: 8px; }
</style>
