<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { dur } from './motion.ts';
  import RepExplainer from './rep/RepExplainer.svelte';
  import type { Kind } from './rep/captions.ts';

  interface Form {
    leaf: string;
    label: string;
    family: string;
    count: number;
    definition: string;
    units: string;
    examples: { name: string; href: string | null }[];
    stored: string;
    traits: [string, number][];
  }
  let { forms }: { forms: Form[] } = $props();
  let active = $state(0);
  let root: HTMLDivElement;
  const f = $derived(forms[active]);

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') active = (active + 1) % forms.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') active = (active - 1 + forms.length) % forms.length;
    else return;
    e.preventDefault();
    (document.getElementById(`form-tab-${active}`) as HTMLElement | null)?.focus();
  }

  // Deep links such as /formation/#perception_to_text_records_and_summaries select that form.
  function fromHash() {
    const i = forms.findIndex((x) => `#${x.leaf}` === location.hash);
    if (i >= 0) {
      active = i;
      root?.scrollIntoView({ block: 'start' });
    }
  }
  onMount(() => {
    fromHash();
    window.addEventListener('hashchange', fromHash);
    return () => window.removeEventListener('hashchange', fromHash);
  });
</script>

<div class="six" bind:this={root}>
  {#each forms as form (form.leaf)}<span id={form.leaf} class="anchor" aria-hidden="true"></span>{/each}
  <div class="left">
    <div class="tabs" role="tablist" aria-label="Representation forms" aria-orientation="vertical">
      {#each forms as form, i (form.leaf)}
        <button
          id="form-tab-{i}"
          role="tab"
          type="button"
          aria-selected={active === i}
          aria-controls="form-panel"
          tabindex={active === i ? 0 : -1}
          onclick={() => (active = i)}
          onkeydown={key}
        >
          <span class="tl">{form.label}</span>
          <span class="small muted">{form.family} · <span class="num">{form.count}</span> systems</span>
        </button>
      {/each}
    </div>
    <div class="obs panel">
      <p class="k">The same observation, every time</p>
      <p class="small">
        Frame 1042, kitchen camera, 08:10. A mug and keys sit on the counter. The user says, <em>“I’ll be back at six.”</em>
      </p>
    </div>
  </div>

  <div class="out panel" id="form-panel" role="tabpanel" aria-labelledby="form-tab-{active}">
    {#key active}
      <div in:fade={{ duration: dur(200) }} class="detail">
        <p class="fam small muted">{f.family}</p>
        <h3>{f.label}</h3>
        <p class="def">{f.definition}</p>
        <RepExplainer kind={f.leaf as Kind} />
        <div class="cols">
          <div>
            <p class="k">What gets stored</p>
            <pre class="stored">{f.stored}</pre>
            <p class="small"><span class="muted">Typical units:</span> {f.units}</p>
          </div>
          <div>
            <p class="k">Trade-offs</p>
            <dl class="traits">
              {#each f.traits as [name, v] (name)}
                <div>
                  <dt>{name}</dt>
                  <dd>
                    <span class="sr-only">{v} of 4</span>
                    {#each [1, 2, 3, 4] as s (s)}<span class="pip" class:on={s <= v} aria-hidden="true"></span>{/each}
                  </dd>
                </div>
              {/each}
            </dl>
            <p class="small">
              <span class="muted">In the paper:</span>
              {#each f.examples as ex, i (ex.name)}
                {#if ex.href}<a href={ex.href}>{ex.name}</a>{:else}{ex.name}{/if}{i < f.examples.length - 1 ? ', ' : ''}
              {/each}
            </p>
            <a class="btn small-btn" href="/systems/?leaves={f.leaf}">Browse all {f.count} systems</a>
          </div>
        </div>
      </div>
    {/key}
  </div>
</div>
<p class="small muted foot">Trade-off levels are a qualitative reading of the survey’s discussion, not measurements.</p>

<style>
  .six { position: relative; display: grid; grid-template-columns: minmax(240px, 300px) 1fr; gap: 20px; align-items: start; scroll-margin-top: 84px; }
  .anchor { position: absolute; top: 0; }
  .left { display: grid; gap: 12px; position: sticky; top: 84px; }
  .panel { padding: 16px; }
  .out { padding: 20px 22px; min-width: 0; }
  .k { font-size: 0.75rem; color: var(--muted); margin: 0 0 8px; }
  .fam { margin: 0; }
  h3 { font-size: var(--step-2); margin: 2px 0 8px; }
  .def { font-family: var(--font-read); color: var(--ink-2); line-height: 1.6; max-width: 70ch; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 18px; }
  .tabs { display: grid; gap: 4px; }
  .tabs button {
    font: inherit; text-align: left; display: flex; flex-direction: column; gap: 1px; cursor: pointer;
    padding: 10px 12px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--ink);
  }
  .tabs button:hover { background: var(--surface-2); }
  .tabs button[aria-selected='true'] { background: var(--surface); border-color: var(--accent); box-shadow: inset 3px 0 0 var(--accent); }
  .tl { font-weight: 600; font-size: 0.9375rem; }
  .stored {
    margin: 0 0 10px; padding: 12px; border-radius: 8px; background: var(--surface-2); color: var(--ink);
    white-space: pre-wrap; word-break: break-word; font-size: 0.8125rem; line-height: 1.55;
  }
  .traits { display: grid; gap: 6px; margin: 0 0 14px; }
  .traits div { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; }
  dt { font-size: 0.875rem; color: var(--ink-2); }
  dd { margin: 0; display: flex; gap: 3px; }
  .pip { width: 18px; height: 8px; border-radius: 2px; background: var(--surface-2); border: 1px solid var(--rule); }
  .pip.on { background: var(--accent); border-color: var(--accent); }
  .small-btn { font-size: 0.875rem; padding: 6px 14px; margin-top: 4px; }
  .foot { margin-top: 12px; }
  @media (max-width: 960px) {
    .six { grid-template-columns: 1fr; }
    .left { position: static; }
    .tabs { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); }
    .cols { grid-template-columns: 1fr; }
  }
</style>
