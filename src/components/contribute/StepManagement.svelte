<script lang="ts">
  import { scale } from 'svelte/transition';
  import { draft, toggle } from './draft.svelte.ts';
  import { tierOf } from '../../lib/contribute.ts';
  import { dur } from '../viz/motion.ts';

  interface Opt { key: string; label: string; hint: string }
  let { ops, targets, tierLabel }: { ops: Opt[]; targets: Opt[]; tierLabel: Record<string, string> } = $props();
  const tier = $derived(tierOf(draft));
</script>

<div class="step">
  <h2 tabindex="-1">What can change while it runs?</h2>
  <p class="muted">Answer two questions about the deployed system. We’ll suggest its management tier.</p>

  <div class="q">
    <p class="qt"><span class="n">1</span> After deployment, can the stored memory change — new entries added, merged, corrected, regrouped, or forgotten?</p>
    <fieldset class="yn">
      <legend class="sr-only">Memory changes after deployment</legend>
      <label class:on={draft.memoryChanges === false}><input class="sr-only" type="radio" name="q1" checked={draft.memoryChanges === false} onchange={() => { draft.memoryChanges = false; draft.policyEvolves = null; }} />No, it is built once and reused</label>
      <label class:on={draft.memoryChanges === true}><input class="sr-only" type="radio" name="q1" checked={draft.memoryChanges === true} onchange={() => (draft.memoryChanges = true)} />Yes, it changes</label>
    </fieldset>
  </div>

  {#if draft.memoryChanges}
    <div class="q" in:scale={{ duration: dur(220), start: 0.96 }}>
      <p class="qt"><span class="n">2</span> Does feedback (task outcomes, a verifier, user corrections) persistently change the <em>rules</em> that decide how memory is written, maintained, or retrieved?</p>
      <fieldset class="yn">
        <legend class="sr-only">Policy evolves from feedback</legend>
        <label class:on={draft.policyEvolves === false}><input class="sr-only" type="radio" name="q2" checked={draft.policyEvolves === false} onchange={() => (draft.policyEvolves = false)} />No, the rules are fixed</label>
        <label class:on={draft.policyEvolves === true}><input class="sr-only" type="radio" name="q2" checked={draft.policyEvolves === true} onchange={() => (draft.policyEvolves = true)} />Yes, the rules evolve</label>
      </fieldset>
    </div>
  {/if}

  {#if tier}
    {#key tier}
      <div class="badge tier-{tier}" in:scale={{ duration: dur(320), start: 0.6 }} aria-live="polite">
        <span class="dot"></span>
        <span><strong>{tier} · {tierLabel[tier]}</strong></span>
      </div>
    {/key}
  {/if}

  {#if tier === 'T2' || tier === 'T3'}
    <h3>Which memory operations does it use?</h3>
    <div class="opts">
      {#each ops as o (o.key)}
        <label class="opt" class:on={draft.ops.includes(o.key)}>
          <input type="checkbox" checked={draft.ops.includes(o.key)} onchange={() => (draft.ops = toggle(draft.ops, o.key))} />
          <span class="ot"><strong>{o.label}</strong><span class="small muted">{o.hint}</span></span>
        </label>
      {/each}
    </div>
  {/if}
  {#if tier === 'T3'}
    <h3>Which policy evolves?</h3>
    <div class="opts">
      {#each targets as o (o.key)}
        <label class="opt" class:on={draft.t3.includes(o.key)}>
          <input type="checkbox" checked={draft.t3.includes(o.key)} onchange={() => (draft.t3 = toggle(draft.t3, o.key))} />
          <span class="ot"><strong>{o.label}</strong><span class="small muted">{o.hint}</span></span>
        </label>
      {/each}
    </div>
  {/if}
</div>

<style>
  .q { margin: 16px 0; padding: 16px; border-radius: 14px; border: 1px solid var(--rule); background: var(--surface); }
  .qt { margin: 0 0 12px; }
  .n { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--ink); color: var(--bg); font-size: 0.75rem; margin-right: 6px; }
  .yn { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .yn label { padding: 10px 16px; border-radius: 999px; border: 1px solid var(--rule); background: var(--bg); color: var(--ink); cursor: pointer; }
  .yn label:has(input:focus-visible) { outline: 2px solid var(--focus); outline-offset: 2px; }
  .yn label.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface)); font-weight: 600; }
  .badge {
    display: inline-flex; align-items: center; gap: 10px; padding: 12px 18px; border-radius: 999px; font-size: 1.0625rem;
    border: 2px solid var(--c); background: color-mix(in srgb, var(--c) 12%, var(--surface));
  }
  .badge .dot { width: 14px; height: 14px; border-radius: 50%; background: var(--c); }
  h3 { font-size: 1rem; margin: 22px 0 8px; }
  .opts { display: grid; gap: 6px; }
  .opt { display: flex; gap: 10px; align-items: baseline; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--rule); background: var(--surface); cursor: pointer; font-size: 0.9375rem; }
  .opt input { accent-color: var(--accent); }
  .ot { display: grid; gap: 1px; }
  .opt.on { border-color: var(--accent); }
</style>
