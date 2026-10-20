<script lang="ts">
  import BarChart from './BarChart.svelte';

  type Props = Omit<import('svelte').ComponentProps<typeof BarChart>, 'title'>;
  let { title, variants }: { title: string; variants: { label: string; props: Props }[] } = $props();
  let active = $state(0);
</script>

<div class="cs">
  {#if variants.length > 1}
    <div class="seg colorby" role="group" aria-label="Color by">
      <span class="small muted lab">Color by</span>
      {#each variants as v, i (v.label)}
        <button type="button" aria-pressed={active === i} onclick={() => (active = i)}>{v.label}</button>
      {/each}
    </div>
  {/if}
  {#key active}
    <BarChart {title} {...variants[active].props} />
  {/key}
</div>

<style>
  .cs { display: grid; gap: 12px; }
  .colorby { align-items: center; justify-self: start; }
  .lab { padding: 0 6px 0 10px; }
</style>
