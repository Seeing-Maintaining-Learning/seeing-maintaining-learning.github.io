<script lang="ts">
  import { draft, toggle } from './draft.svelte.ts';

  let { modalities }: { modalities: { key: string; label: string; hint: string; n: number }[] } = $props();
</script>

<div class="step">
  <h2>What does the agent remember from?</h2>
  <p class="muted">Pick the modality that supplies the main persistent experience. Add others it also stores.</p>
  <div class="tiles" role="radiogroup" aria-label="Primary modality">
    {#each modalities as m (m.key)}
      <button
        type="button"
        role="radio"
        aria-checked={draft.modality === m.key}
        class="tile mod-{m.key}"
        onclick={() => {
          draft.modality = m.key;
          draft.secondary = draft.secondary.filter((s) => s !== m.key);
        }}
      >
        <span class="swatch"></span>
        <span class="tl">{m.label}</span>
        <span class="small muted">{m.hint}</span>
        <span class="small num n">{m.n} in the survey</span>
      </button>
    {/each}
  </div>
  {#if draft.modality}
    <fieldset class="sec">
      <legend class="small muted">Also stores (optional)</legend>
      {#each modalities.filter((m) => m.key !== draft.modality) as m (m.key)}
        <label class="chip mod-{m.key}">
          <input type="checkbox" checked={draft.secondary.includes(m.key)} onchange={() => (draft.secondary = toggle(draft.secondary, m.key))} />
          <span class="dot"></span>{m.label}
        </label>
      {/each}
    </fieldset>
  {/if}
</div>

<style>
  .tiles { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; margin: 16px 0; }
  .tile {
    font: inherit; text-align: left; display: flex; flex-direction: column; gap: 4px; padding: 14px; cursor: pointer;
    border-radius: 14px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink);
    transition: transform var(--dur-2) var(--ease), border-color var(--dur-1), background var(--dur-2);
  }
  .tile:hover { transform: translateY(-2px); border-color: var(--c); }
  .tile[aria-checked='true'] { border: 2px solid var(--c); background: color-mix(in srgb, var(--c) 12%, var(--surface)); }
  .swatch { width: 28px; height: 28px; border-radius: 50%; background: var(--c); margin-bottom: 4px; box-shadow: 0 0 0 4px color-mix(in srgb, var(--c) 25%, transparent); }
  .tl { font-weight: 650; }
  .n { margin-top: auto; }
  .sec { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .sec legend { margin-bottom: 6px; }
  .sec .chip { cursor: pointer; }
  .sec input { accent-color: var(--accent); margin: 0; }
</style>
