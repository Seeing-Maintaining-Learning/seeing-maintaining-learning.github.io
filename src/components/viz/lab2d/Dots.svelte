<script lang="ts">
  import { fill, type ColorBy, type Pt } from './common.ts';

  let {
    points,
    pos,
    r = 3.2,
    colorBy,
    hover = $bindable(null),
    dim = null,
  }: {
    points: Pt[];
    pos: ([number, number] | null)[];
    r?: number;
    colorBy: ColorBy;
    hover?: number | null;
    /** Optional predicate: points returning true are dimmed. */
    dim?: ((p: Pt) => boolean) | null;
  } = $props();
</script>

<g class="dots">
  {#each points as p, i (p.id)}
    {@const q = pos[i]}
    {#if q}
      <circle
        cx={q[0]}
        cy={q[1]}
        r={hover === i ? r + 2.5 : r}
        class="d"
        class:ring={colorBy === 'tier' && p.tier === 'T1'}
        class:halo={colorBy === 'tier' && p.tier === 'T3'}
        class:dim={dim?.(p)}
        style="--f:{fill(p, colorBy)}"
        role="link"
        tabindex="-1"
        aria-label={p.name}
        onpointerenter={() => (hover = i)}
        onpointerleave={() => (hover = null)}
        onclick={() => (location.href = `/systems/${p.id}/`)}
        onkeydown={(e) => e.key === 'Enter' && (location.href = `/systems/${p.id}/`)}
      />
    {/if}
  {/each}
</g>

<style>
  .d { fill: var(--f); stroke: var(--surface); stroke-width: 0.8; cursor: pointer; transition: r 120ms, opacity 200ms; }
  .d.ring { fill: transparent; stroke: var(--f); stroke-width: 1.6; }
  .d.halo { stroke: color-mix(in srgb, var(--f) 45%, transparent); stroke-width: 3; }
  .d.dim { opacity: 0.12; }
</style>
