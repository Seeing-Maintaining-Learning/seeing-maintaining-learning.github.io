<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion, whileVisible } from './motion.ts';

  let { items }: { items: { value: number; label: string }[] } = $props();
  let shown = $state(true); // server-rendered HTML shows the real values
  let instant = $state(false);
  let el: HTMLDListElement;

  const digits = (n: number) => n.toLocaleString('en-US').split('');

  onMount(() => {
    if (reducedMotion()) return;
    instant = true;
    shown = false;
    requestAnimationFrame(() => (instant = false));
    const stop = whileVisible(el, (v) => {
      if (v) {
        shown = true;
        stop();
      }
    });
    return stop;
  });
</script>

<dl class="counters" class:instant bind:this={el}>
  {#each items as it, k (it.label)}
    <div class="c">
      <dt>{it.label}</dt>
      <dd>
        <span class="sr-only">{it.value.toLocaleString('en-US')}</span>
        {#each digits(it.value) as d, i (i)}
          {#if /\d/.test(d)}
            <span class="slot" aria-hidden="true" data-nosnippet>
              <span class="reel" style="transform: translateY(-{shown ? Number(d) : 0}em); transition-delay: {k * 90 + i * 70}ms">
                {#each [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as n (n)}<span>{n}</span>{/each}
              </span>
            </span>
          {:else}
            <span aria-hidden="true">{d}</span>
          {/if}
        {/each}
      </dd>
    </div>
  {/each}
</dl>

<style>
  .counters { display: flex; flex-wrap: wrap; gap: 8px 36px; margin: 0; }
  @media (max-width: 480px) { .counters { gap: 8px 18px; } dd { font-size: var(--step-2); } dt { font-size: 0.75rem; } }
  .c { display: flex; flex-direction: column-reverse; gap: 2px; }
  dt { font-size: var(--step--1); color: var(--muted); }
  dd { margin: 0; display: flex; font-size: var(--step-3); font-weight: 650; line-height: 1; font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
  .slot { display: inline-block; height: 1em; overflow: hidden; }
  .reel { display: flex; flex-direction: column; transition: transform 1100ms cubic-bezier(0.2, 0.9, 0.2, 1); }
  .reel span { height: 1em; line-height: 1; }
  .instant .reel { transition: none; }
  @media (prefers-reduced-motion: reduce) { .reel { transition: none; } }
</style>
