<script lang="ts">
  import Sunburst from './Sunburst.svelte';
  import Chord from './Chord.svelte';
  import Clock from './Clock.svelte';
  import Terraces from './Terraces.svelte';
  import Pack from './Pack.svelte';
  import Stream from './Stream.svelte';
  import type { ColorBy, Pt } from './common.ts';

  let { points }: { points: Pt[] } = $props();
  const OPTIONS = {
    representation: ['Radial sunburst', 'Chord diagram'],
    management: ['Memory clock', 'Terraces'],
    modality: ['Bubble pack', 'Streamgraph'],
  } as const;
  type L = keyof typeof OPTIONS;
  let lens = $state<L>('representation');
  let opt = $state(0);
  let colorBy = $state<ColorBy>('modality');
  let paused = $state(false);
</script>

<div class="lab2d">
  <div class="bar">
    <div class="seg" role="group" aria-label="Lens">
      <button type="button" aria-pressed={lens === 'representation'} onclick={() => { lens = 'representation'; opt = 0; }}>Representation</button>
      <button type="button" aria-pressed={lens === 'management'} onclick={() => { lens = 'management'; opt = 0; }}>Management tier</button>
      <button type="button" aria-pressed={lens === 'modality'} onclick={() => { lens = 'modality'; opt = 0; }}>Modality</button>
    </div>
    <div class="seg" role="group" aria-label="Design option">
      {#each OPTIONS[lens] as o, i (o)}
        <button type="button" aria-pressed={opt === i} onclick={() => (opt = i)}>{i + 1}. {o}</button>
      {/each}
    </div>
  </div>
  <div class="bar">
    <div class="seg" role="group" aria-label="Color by">
      <button type="button" aria-pressed={colorBy === 'modality'} onclick={() => (colorBy = 'modality')}>Color: modality</button>
      <button type="button" aria-pressed={colorBy === 'tier'} onclick={() => (colorBy = 'tier')}>Color: tier</button>
    </div>
    <button class="pause" type="button" aria-pressed={paused} onclick={() => (paused = !paused)}>{paused ? 'Resume' : 'Pause'} motion</button>
  </div>
  <div class="stage">
    {#key `${lens}-${opt}`}
      {#if lens === 'representation'}
        {#if opt === 0}<Sunburst {points} {colorBy} />{:else}<Chord {points} {colorBy} {paused} />{/if}
      {:else if lens === 'management'}
        {#if opt === 0}<Clock {points} {colorBy} {paused} />{:else}<Terraces {points} {colorBy} />{/if}
      {:else if opt === 0}<Pack {points} {colorBy} />{:else}<Stream {points} {colorBy} />{/if}
    {/key}
  </div>
</div>

<style>
  .lab2d { display: grid; gap: 10px; }
  :global(:root[data-theme='dark']) .lab2d {
    --m-image: #4da3ff; --m-video: #ff8a4c; --m-audio: #2ee6a6; --m-gui: #ffd23f; --m-embodied: #ff6fb5;
    --t1: #b48cff; --t2: #3fd5ff; --t3: #ff5c6c;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) .lab2d {
      --m-image: #4da3ff; --m-video: #ff8a4c; --m-audio: #2ee6a6; --m-gui: #ffd23f; --m-embodied: #ff6fb5;
      --t1: #b48cff; --t2: #3fd5ff; --t3: #ff5c6c;
    }
  }
  .bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
  .pause { font: inherit; font-size: var(--step--1); background: none; border: 1px solid var(--rule); color: var(--ink-2); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .stage { padding: 16px; border-radius: 18px; border: 1px solid var(--rule); background: var(--surface); }
  :global(:root[data-theme='dark']) .stage { background: radial-gradient(ellipse at 50% 40%, #121a24 0%, #080b10 100%); }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .stage { background: radial-gradient(ellipse at 50% 40%, #121a24 0%, #080b10 100%); } }
</style>
