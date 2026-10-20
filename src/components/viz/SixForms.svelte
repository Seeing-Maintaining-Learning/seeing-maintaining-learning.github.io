<script lang="ts">
  import { fade } from 'svelte/transition';
  import { dur } from './motion.ts';

  interface Form {
    leaf: string;
    label: string;
    family: string;
    count: number;
    stored: string;
    traits: [string, number][];
  }
  let { forms }: { forms: Form[] } = $props();
  let active = $state(0);
  const f = $derived(forms[active]);

  function key(e: KeyboardEvent) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') active = (active + 1) % forms.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') active = (active - 1 + forms.length) % forms.length;
    else return;
    e.preventDefault();
    (document.getElementById(`form-tab-${active}`) as HTMLElement | null)?.focus();
  }
</script>

<div class="six">
  <div class="obs panel">
    <p class="k">One observation</p>
    <div class="scene" aria-hidden="true">
      <svg viewBox="0 0 240 150">
        <rect x="0" y="0" width="240" height="150" rx="10" class="wall" />
        <rect x="0" y="96" width="240" height="54" class="counter" />
        <rect x="150" y="20" width="70" height="56" rx="4" class="window" />
        <g class="mug"><rect x="58" y="70" width="24" height="26" rx="4" /><path d="M82 76 q10 0 10 8 t-10 8" fill="none" stroke-width="4" /></g>
        <g class="keys"><circle cx="128" cy="92" r="5" /><rect x="132" y="90" width="16" height="4" rx="2" /></g>
        <rect x="52" y="64" width="102" height="36" rx="4" class="bbox" />
      </svg>
    </div>
    <p class="small">
      Frame 1042, kitchen camera, 08:10. A mug and keys sit on the counter. The user says, <em>“I’ll be back at six.”</em>
    </p>
  </div>

  <div class="tabs" role="tablist" aria-label="Representation forms" aria-orientation="vertical">
    {#each forms as form, i (form.leaf)}
      <button
        id="form-tab-{i}"
        role="tab"
        type="button"
        aria-selected={active === i}
        tabindex={active === i ? 0 : -1}
        onclick={() => (active = i)}
        onkeydown={key}
      >
        <span class="tl">{form.label}</span>
        <span class="small muted">{form.family} · <span class="num">{form.count}</span> systems</span>
      </button>
    {/each}
  </div>

  <div class="out panel" role="tabpanel" aria-labelledby="form-tab-{active}">
    {#key active}
      <div in:fade={{ duration: dur(200) }}>
        <p class="k">What gets stored</p>
        <pre class="stored">{f.stored}</pre>
        <p class="k">Trade-offs</p>
        <dl class="traits">
          {#each f.traits as [name, v] (name)}
            <div>
              <dt>{name}</dt>
              <dd aria-label="{v} of 4">
                {#each [1, 2, 3, 4] as s (s)}<span class="pip" class:on={s <= v}></span>{/each}
              </dd>
            </div>
          {/each}
        </dl>
        <a class="small" href="/systems/?leaves={f.leaf}">See the {f.count} systems</a>
      </div>
    {/key}
  </div>
</div>
<p class="small muted foot">Trade-off levels are a qualitative reading of the survey’s discussion, not measurements.</p>

<style>
  .six { display: grid; grid-template-columns: 1fr 1.05fr 1.25fr; gap: 16px; align-items: start; }
  .panel { padding: 16px; }
  .k { font-size: 0.75rem; color: var(--muted); margin: 0 0 8px; }
  .scene svg { width: 100%; height: auto; display: block; margin-bottom: 10px; }
  .wall { fill: var(--surface-2); }
  .counter { fill: color-mix(in srgb, var(--ink) 12%, var(--surface)); }
  .window { fill: color-mix(in srgb, var(--m-image) 22%, var(--surface)); }
  .mug rect { fill: var(--m-video); }
  .mug path { stroke: var(--m-video); }
  .keys { fill: var(--m-gui); }
  .bbox { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 4; }
  .tabs { display: grid; gap: 4px; }
  .tabs button {
    font: inherit; text-align: left; display: flex; flex-direction: column; gap: 1px; cursor: pointer;
    padding: 10px 12px; border-radius: 10px; border: 1px solid transparent; background: transparent; color: var(--ink);
  }
  .tabs button:hover { background: var(--surface-2); }
  .tabs button[aria-selected='true'] { background: var(--surface); border-color: var(--accent); }
  .tl { font-weight: 600; font-size: 0.9375rem; }
  .stored {
    margin: 0 0 16px; padding: 12px; border-radius: 8px; background: var(--surface-2); color: var(--ink);
    white-space: pre-wrap; word-break: break-word; font-size: 0.8125rem; line-height: 1.55; min-height: 8.5em;
  }
  .traits { display: grid; gap: 6px; margin: 0 0 14px; }
  .traits div { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 12px; }
  dt { font-size: 0.875rem; color: var(--ink-2); }
  dd { margin: 0; display: flex; gap: 3px; }
  .pip { width: 18px; height: 8px; border-radius: 2px; background: var(--surface-2); border: 1px solid var(--rule); }
  .pip.on { background: var(--accent); border-color: var(--accent); }
  .foot { margin-top: 12px; }
  @media (max-width: 960px) { .six { grid-template-columns: 1fr; } .tabs { grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); } }
</style>
