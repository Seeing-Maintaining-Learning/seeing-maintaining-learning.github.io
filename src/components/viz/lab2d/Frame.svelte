<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Pt } from './common.ts';

  let {
    width = $bindable(800),
    height,
    points,
    hover,
    pos,
    label,
    children,
  }: {
    width?: number;
    height: number;
    points: Pt[];
    hover: number | null;
    pos: ([number, number] | null)[];
    label: string;
    children: Snippet;
  } = $props();
  const h = $derived(hover !== null ? points[hover] : null);
  const q = $derived(hover !== null ? pos[hover] : null);
</script>

<div class="frame" bind:clientWidth={width}>
  <svg viewBox="0 0 {width} {height}" width="100%" height={height} role="img" aria-label={label}>
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="2.4" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    {@render children()}
  </svg>
  {#if h && q}
    <div class="viz-tip" style="left:{Math.min(q[0] + 12, width - 240)}px; top:{q[1] + 12}px">
      <strong>{h.name}</strong>
      <div class="muted">{h.tier} · {h.modalityLabel} · {h.year}</div>
    </div>
  {/if}
</div>

<style>
  .frame { position: relative; }
  svg { display: block; overflow: hidden; }
  :global(:root[data-theme='dark']) .frame :global(.dots) { filter: url(#glow); }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .frame :global(.dots) { filter: url(#glow); } }
</style>
