<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion, whileVisible } from '../motion.ts';
  import Source from './Source.svelte';
  import Encodings from './Encodings.svelte';
  import TextRecords from './TextRecords.svelte';
  import Graph from './Graph.svelte';
  import Latent from './Latent.svelte';
  import Parametric from './Parametric.svelte';
  import Hybrid from './Hybrid.svelte';
  import { CAPTIONS, type Kind } from './captions.ts';

  let { kind, compact = false }: { kind: Kind; compact?: boolean } = $props();

  const VIEWS = {
    retained_perceptual_source_evidence: Source,
    modality_specific_encodings_and_geometric_state: Encodings,
    perception_to_text_records_and_summaries: TextRecords,
    spatial_temporal_and_cross_modal_structured_memory: Graph,
    persistent_multimodal_latent_state: Latent,
    experience_conditioned_parametric_memory: Parametric,
    hybrid: Hybrid,
  } as const;

  const steps = $derived(CAPTIONS[kind]);
  const View = $derived(VIEWS[kind]);
  let step = $state(0);
  let playing = $state(false);
  let visible = false;
  let el: HTMLDivElement;
  let timer: ReturnType<typeof setInterval> | undefined;

  function schedule() {
    clearInterval(timer);
    if (playing && visible) timer = setInterval(() => (step = (step + 1) % steps.length), 2600);
  }
  function toggle() {
    playing = !playing;
    schedule();
  }
  function go(i: number) {
    step = (i + steps.length) % steps.length;
    playing = false;
    schedule();
  }

  onMount(() => {
    if (reducedMotion()) step = steps.length - 1;
    else playing = true;
    const stop = whileVisible(el, (v) => {
      visible = v;
      schedule();
    });
    return () => {
      stop();
      clearInterval(timer);
    };
  });
</script>

<div class="rx" class:compact bind:this={el}>
  <div class="stage" aria-hidden="true">
    <View {step} />
  </div>
  <div class="ctl">
    <button type="button" class="ib" onclick={() => go(step - 1)} aria-label="Previous step">‹</button>
    <button type="button" class="ib play" onclick={toggle} aria-label={playing ? 'Pause animation' : 'Play animation'}>
      {#if playing}❚❚{:else}▶{/if}
    </button>
    <button type="button" class="ib" onclick={() => go(step + 1)} aria-label="Next step">›</button>
    <span class="dots" aria-hidden="true">
      {#each steps as _, i (i)}<span class:on={i === step}></span>{/each}
    </span>
  </div>
  {#if !compact}
    <p class="cap" aria-live={playing ? 'off' : 'polite'}><span class="n num">{step + 1}/{steps.length}</span> {steps[step]}</p>
  {:else}
    <p class="sr-only" aria-live={playing ? 'off' : 'polite'}>{steps[step]}</p>
  {/if}
</div>

<style>
  .rx { display: grid; gap: 8px; }
  .stage {
    position: relative; aspect-ratio: 16 / 9; border-radius: 10px; overflow: hidden;
    background: var(--surface-2); border: 1px solid var(--rule);
  }
  .stage :global(svg) { width: 100%; height: 100%; display: block; }
  .ctl { display: flex; align-items: center; gap: 6px; }
  .ib {
    font: inherit; width: 30px; height: 30px; border-radius: 50%; border: 1px solid var(--rule);
    background: var(--surface); color: var(--ink-2); cursor: pointer; display: grid; place-items: center; font-size: 0.875rem;
  }
  .play { font-size: 0.75rem; }
  .dots { display: flex; gap: 4px; margin-left: 6px; }
  .dots span { width: 18px; height: 4px; border-radius: 2px; background: var(--rule); transition: background var(--dur-2); }
  .dots span.on { background: var(--accent); }
  .cap { margin: 0; font-size: 0.9375rem; color: var(--ink-2); min-height: 3em; }
  .n { color: var(--muted); font-size: 0.75rem; margin-right: 4px; }
  .compact .ib { width: 26px; height: 26px; }
</style>
