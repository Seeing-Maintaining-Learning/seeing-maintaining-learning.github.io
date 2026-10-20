<script lang="ts">
  import { draft, toggle } from './draft.svelte.ts';
  import RepExplainer from '../viz/rep/RepExplainer.svelte';
  import type { Kind } from '../viz/rep/captions.ts';

  interface Opt { key: string; label: string }
  let { leaves, storage, retrieval }: { leaves: (Opt & { family: string; short: string })[]; storage: Opt[]; retrieval: Opt[] } = $props();
  let preview = $state<string>(draft.leaves[0] ?? leaves[0].key);
</script>

<div class="step">
  <h2>What form does the stored memory take?</h2>
  <p class="muted">Choose every form the system hands back to its model. Hover or focus a card to see how that form works.</p>
  <div class="grid">
    <div class="cards">
      {#each leaves as l (l.key)}
        <label
          class="card"
          class:on={draft.leaves.includes(l.key)}
          onpointerenter={() => (preview = l.key)}
          onfocusin={() => (preview = l.key)}
        >
          <input type="checkbox" checked={draft.leaves.includes(l.key)} onchange={() => (draft.leaves = toggle(draft.leaves, l.key))} />
          <span class="tl">{l.label}</span>
          <span class="small muted">{l.family}</span>
        </label>
      {/each}
    </div>
    <div class="pv">
      {#key preview}
        <RepExplainer kind={preview as Kind} compact />
      {/key}
      <p class="small muted">{leaves.find((l) => l.key === preview)?.short}</p>
    </div>
  </div>

  <h3>Where is it stored?</h3>
  <div class="chips">
    {#each storage as s (s.key)}
      <label class="pick" class:on={draft.storage.includes(s.key)}>
        <input type="checkbox" checked={draft.storage.includes(s.key)} onchange={() => (draft.storage = toggle(draft.storage, s.key))} />{s.label}
      </label>
    {/each}
  </div>
  <h3>How is it found again?</h3>
  <div class="chips">
    {#each retrieval as s (s.key)}
      <label class="pick" class:on={draft.retrieval.includes(s.key)}>
        <input type="checkbox" checked={draft.retrieval.includes(s.key)} onchange={() => (draft.retrieval = toggle(draft.retrieval, s.key))} />{s.label}
      </label>
    {/each}
  </div>
</div>

<style>
  .grid { display: grid; grid-template-columns: 1fr minmax(260px, 0.9fr); gap: 16px; margin: 16px 0 24px; align-items: start; }
  .cards { display: grid; gap: 8px; }
  .card {
    display: grid; grid-template-columns: auto 1fr; column-gap: 10px; padding: 12px 14px; border-radius: 12px; cursor: pointer;
    border: 1px solid var(--rule); background: var(--surface); transition: border-color var(--dur-1), background var(--dur-2);
  }
  .card input { grid-row: span 2; accent-color: var(--accent); margin-top: 3px; }
  .card.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
  .tl { font-weight: 600; font-size: 0.9375rem; }
  .pv { position: sticky; top: 84px; display: grid; gap: 8px; }
  h3 { font-size: 1rem; margin: 18px 0 8px; }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; }
  .pick {
    display: inline-flex; gap: 6px; align-items: center; padding: 6px 12px; border-radius: 999px; cursor: pointer; font-size: 0.875rem;
    border: 1px solid var(--rule); background: var(--surface); transition: border-color var(--dur-1), background var(--dur-1);
  }
  .pick input { accent-color: var(--accent); margin: 0; }
  .pick.on { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }
  @media (max-width: 760px) { .grid { grid-template-columns: 1fr; } .pv { position: static; order: -1; } }
</style>
