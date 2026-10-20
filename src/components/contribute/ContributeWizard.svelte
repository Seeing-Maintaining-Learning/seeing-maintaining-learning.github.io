<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fly } from 'svelte/transition';
  import { draft, restore, save, reset } from './draft.svelte.ts';
  import { tierOf } from '../../lib/contribute.ts';
  import { dur } from '../viz/motion.ts';
  import StepPaper from './StepPaper.svelte';
  import StepModality from './StepModality.svelte';
  import StepRepresentation from './StepRepresentation.svelte';
  import StepManagement from './StepManagement.svelte';
  import StepReview from './StepReview.svelte';

  interface Opt { key: string; label: string }
  let { index, labels, modalities, leaves, storage, retrieval, ops, targets, cloud }: {
    index: Record<string, string>;
    labels: Record<string, Record<string, string>>;
    modalities: { key: string; label: string; hint: string; n: number }[];
    leaves: (Opt & { family: string; short: string })[];
    storage: Opt[];
    retrieval: Opt[];
    ops: (Opt & { hint: string })[];
    targets: (Opt & { hint: string })[];
    cloud: { x: number; y: number; m: string }[];
  } = $props();

  const STEPS = ['Paper', 'Modality', 'Representation', 'Management', 'Evidence & submit'];
  let step = $state(0);
  let reached = $state(0);
  let dir = $state(1);
  let ready = $state(false);
  let main: HTMLDivElement;

  const valid = $derived([
    Boolean(draft.arxiv || draft.title) && Boolean(draft.name || draft.title),
    Boolean(draft.modality),
    draft.leaves.length > 0,
    tierOf(draft) !== null,
    true,
  ]);
  const canNext = $derived(valid[step]);
  /** Furthest step the user may jump to: every step before it must be valid. */
  const maxStep = $derived(Math.min(reached, valid.findIndex((v) => !v) === -1 ? STEPS.length - 1 : valid.findIndex((v) => !v)));
  const tier = $derived(tierOf(draft));

  async function go(i: number) {
    const next = Math.max(0, Math.min(STEPS.length - 1, i));
    if (next > step && !canNext) return;
    dir = next > step ? 1 : -1;
    step = next;
    reached = Math.max(reached, step);
    await tick();
    main?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });
    document.getElementById('wizard-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  onMount(() => {
    restore();
    // A restored draft may already be valid for several steps.
    reached = valid.findIndex((v) => !v) === -1 ? STEPS.length - 1 : valid.findIndex((v) => !v);
    ready = true;
  });
  $effect(() => {
    if (ready) save();
    void JSON.stringify(draft);
  });
</script>

<div class="wiz" id="wizard-top">
  <ol class="stepper" aria-label="Progress">
    {#each STEPS as s, i (s)}
      <li class:done={i < step} class:cur={i === step}>
        <button type="button" onclick={() => go(i)} disabled={i > maxStep} aria-current={i === step ? 'step' : undefined}>
          <span class="b num">{i < step ? '✓' : i + 1}</span><span class="sl">{s}</span>
        </button>
      </li>
    {/each}
  </ol>
  <div class="bar"><span style="width:{(step / (STEPS.length - 1)) * 100}%"></span></div>

  <div class="layout">
    <div class="main" bind:this={main}>
      {#if ready}
      {#key step}
        <div in:fly={{ x: 40 * dir, duration: dur(280) }}>
          {#if step === 0}<StepPaper {index} />
          {:else if step === 1}<StepModality {modalities} />
          {:else if step === 2}<StepRepresentation {leaves} {storage} {retrieval} />
          {:else if step === 3}<StepManagement {ops} {targets} tierLabel={labels.tier} />
          {:else}<StepReview {labels} />{/if}
        </div>
      {/key}
      {/if}
      <div class="nav">
        <button type="button" class="btn" onclick={() => go(step - 1)} disabled={step === 0}>Back</button>
        {#if step < STEPS.length - 1}
          <button type="button" class="btn primary" onclick={() => go(step + 1)} disabled={!canNext}>Continue</button>
        {/if}
        <button type="button" class="btn ghost" onclick={async () => { reset(); reached = 0; ready = false; await tick(); ready = true; go(0); }}>Start over</button>
      </div>
    </div>

    <aside class="preview" aria-label="Preview">
      <p class="small muted">Preview</p>
      <p class="sr-only" aria-live="polite">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      <div class="card">
        <svg viewBox="0 0 200 110" class="cloud" aria-hidden="true">
          {#each cloud as c, i (i)}<circle cx={c.x} cy={c.y} r="2.4" style="fill: var(--{c.m})" opacity="0.5" />{/each}
          {#if draft.modality}
            {#key draft.modality + (tier ?? '')}
              <circle class="newdot mod-{draft.modality}" cx="100" cy="55" r="6" />
            {/key}
          {/if}
        </svg>
        <p class="nm">{draft.name || 'Your system'}</p>
        <p class="pt">{draft.title || 'Paper title'}</p>
        <div class="chips">
          {#if draft.modality}<span class="chip mod-{draft.modality}"><span class="dot"></span>{labels.modality[draft.modality]}</span>{/if}
          {#if tier}<span class="chip tier-{tier}"><span class="dot"></span>{tier} {labels.tier[tier]}</span>{/if}
        </div>
        {#if draft.leaves.length}
          <ul class="lv">{#each draft.leaves as l (l)}<li>{labels.leaf[l]}</li>{/each}</ul>
        {/if}
        {#if draft.arxiv}<p class="small muted">arXiv:{draft.arxiv}</p>{/if}
      </div>
    </aside>
  </div>
</div>

<style>
  .wiz { display: grid; gap: 14px; scroll-margin-top: 84px; }
  .stepper { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
  .stepper button { font: inherit; width: 100%; display: flex; align-items: center; gap: 8px; background: none; border: 0; padding: 4px 0; color: var(--muted); cursor: pointer; text-align: left; }
  .stepper button:disabled { cursor: default; }
  .b { flex: none; width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; font-size: 0.8125rem; border: 1.5px solid var(--rule); background: var(--surface); transition: background var(--dur-2), color var(--dur-2), border-color var(--dur-2); }
  .cur button { color: var(--ink); font-weight: 600; }
  .cur .b { border-color: var(--accent); color: var(--accent-ink); box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent); }
  .done .b { background: var(--accent); border-color: var(--accent); color: var(--surface); }
  .sl { font-size: 0.875rem; }
  .bar { height: 3px; background: var(--rule); border-radius: 2px; overflow: hidden; }
  .bar span { display: block; height: 100%; background: linear-gradient(90deg, var(--m-image), var(--m-audio), var(--m-gui), var(--m-video), var(--m-embodied)); transition: width 500ms var(--ease); }
  .layout { display: grid; grid-template-columns: 1fr 300px; gap: 32px; align-items: start; margin-top: 12px; }
  .main { min-width: 0; }
  .main :global(h2) { font-size: var(--step-2); margin-bottom: 4px; outline: none; }
  .nav { display: flex; gap: 8px; margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--rule); }
  .nav .ghost { margin-left: auto; }
  .preview { position: sticky; top: 84px; }
  .card { border-radius: 16px; border: 1px solid var(--rule); background: var(--surface); padding: 16px; display: grid; gap: 8px; }
  .cloud { width: 100%; height: auto; border-radius: 10px; background: var(--surface-2); }
  .newdot { fill: var(--c); stroke: var(--surface); stroke-width: 2; animation: join 900ms var(--ease) both; }
  @keyframes join { 0% { transform: translate(90px, -60px) scale(0.3); opacity: 0; } 70% { opacity: 1; } 100% { transform: none; } }
  .newdot { transform-box: fill-box; transform-origin: center; filter: drop-shadow(0 0 6px var(--c)); }
  .nm { font-weight: 650; font-size: var(--step-1); margin: 0; }
  .pt { font-family: var(--font-read); color: var(--ink-2); margin: 0; font-size: 0.9375rem; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .lv { margin: 0; padding-left: 18px; font-size: 0.875rem; color: var(--ink-2); }
  @media (max-width: 900px) {
    .layout { grid-template-columns: 1fr; }
    .preview { position: static; order: -1; }
    .cloud { display: none; }
    .sl { display: none; }
    .stepper li.cur .sl { display: inline; }
  }
  @media (prefers-reduced-motion: reduce) { .newdot { animation: none; } }
</style>
