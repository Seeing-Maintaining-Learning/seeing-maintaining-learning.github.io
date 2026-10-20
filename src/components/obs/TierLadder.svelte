<script lang="ts">
  import Icon from '../Icon.svelte';

  interface Row { tier: string; label: string; hint: string; values: number[] }
  let { rows, modalities }: { rows: Row[]; modalities: { key: string; label: string }[] } = $props();
  let hi = $state<{ r: number; m: number } | null>(null);
  const total = (r: Row) => r.values.reduce((a, b) => a + b, 0);
  const max = Math.max(...rows.map(total));
</script>

<ol class="ladder">
  {#each rows as r, ri (r.tier)}
    <li class="tier-{r.tier}">
      <div class="head">
        <span class="ic"><Icon name={r.tier} size={15} /></span>
        <strong>{r.tier}</strong>
        <span class="lab">{r.label}</span>
        <span class="n num">{total(r)}</span>
      </div>
      <a class="bar" href="/systems/?tier={r.tier}" style="width:{Math.max(6, (total(r) / max) * 100)}%" aria-label="Browse the {total(r)} {r.tier} systems">
        {#each r.values as v, mi (mi)}
          {#if v > 0}
            <span
              class="seg mod-{modalities[mi].key}"
              class:dim={hi && !(hi.r === ri && hi.m === mi)}
              style="flex:{v}"
              role="presentation"
              onpointerenter={() => (hi = { r: ri, m: mi })}
              onpointerleave={() => (hi = null)}
            ></span>
          {/if}
        {/each}
      </a>
      <p class="hint small">
        {#if hi && hi.r === ri}
          {modalities[hi.m].label}: <span class="num">{r.values[hi.m]}</span> of {total(r)}
        {:else}
          {r.hint}
        {/if}
      </p>
    </li>
  {/each}
</ol>

<style>
  .ladder { list-style: none; padding: 0; margin: 0; display: grid; gap: 12px; }
  .head { display: flex; align-items: center; gap: 6px; font-size: 0.875rem; }
  .ic { color: var(--c); display: inline-flex; }
  .head strong { color: var(--ink); }
  .lab { color: var(--ink-2); }
  .n { margin-left: auto; font-weight: 700; }
  .bar { display: flex; gap: 2px; height: 14px; margin-top: 5px; border-radius: 3px; overflow: hidden; min-height: 24px; padding: 5px 0; box-sizing: border-box; }
  .bar:focus-visible { outline: 2px solid var(--focus); outline-offset: 2px; }
  .seg { display: block; background: var(--c); transition: opacity 150ms; min-width: 2px; }
  .seg.dim { opacity: 0.25; }
  .hint { margin: 3px 0 0; color: var(--muted); min-height: 1.4em; }
</style>
