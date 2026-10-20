<script lang="ts">
  import { draft } from './draft.svelte.ts';
  import { parseArxivId } from '../../lib/contribute.ts';

  let { index }: { index: Record<string, string> } = $props();
  let input = $state(draft.arxiv ? `https://arxiv.org/abs/${draft.arxiv}` : '');
  let status = $state<'idle' | 'loading' | 'found' | 'manual' | 'invalid'>(draft.title ? 'found' : 'idle');
  const dup = $derived(draft.arxiv ? index[draft.arxiv] : undefined);

  function onInput() {
    const id = parseArxivId(input) ?? '';
    if (id !== draft.arxiv) {
      // A different paper: drop details fetched for the previous ID.
      draft.arxiv = id;
      draft.title = '';
      draft.authors = '';
      status = 'idle';
    }
  }

  async function lookup() {
    const id = parseArxivId(input);
    if (!id) {
      status = 'invalid';
      return;
    }
    draft.arxiv = id;
    status = 'loading';
    try {
      const res = await fetch(`https://huggingface.co/api/papers/${id}`);
      if (!res.ok) throw new Error(String(res.status));
      const j = (await res.json()) as { title?: string; authors?: { name: string }[] };
      if (draft.arxiv !== id) return; // a newer lookup superseded this one
      draft.title = (j.title ?? '').replace(/\s+/g, ' ').trim();
      draft.authors = (j.authors ?? []).map((a) => a.name).join(', ');
      if (!draft.name) draft.name = draft.title.split(':')[0].slice(0, 60);
      status = draft.title ? 'found' : 'manual';
    } catch {
      if (draft.arxiv === id) status = 'manual';
    }
  }
</script>

<div class="step">
  <h2 tabindex="-1">Which paper?</h2>
  <p class="muted">Paste an arXiv ID or link — that and a modality are all we need. We’ll fetch the title and check whether the survey already covers it.</p>
  <form class="lookup" onsubmit={(e) => { e.preventDefault(); lookup(); }}>
    <label class="sr-only" for="arxiv-in">arXiv ID or URL</label>
    <input id="arxiv-in" type="text" placeholder="e.g. 2610.19366 or https://arxiv.org/abs/…" bind:value={input} autocomplete="off" oninput={onInput} />
    <button class="btn primary" type="submit" disabled={status === 'loading'}>{status === 'loading' ? 'Looking up…' : 'Look up'}</button>
  </form>

  <div aria-live="polite">
    {#if status === 'invalid'}
      <p class="msg warn">That doesn’t look like an arXiv ID. Use the form <code>2610.19366</code>, or fill in the details below.</p>
    {:else if dup}
      <p class="msg dup">Already in the survey. <a href={dup}>See its page</a>. If our record is wrong, you can still submit a correction.</p>
    {:else if status === 'found'}
      <p class="msg ok">Found on arXiv. Not yet in the survey — thanks for adding it.</p>
    {:else if status === 'manual'}
      <p class="msg warn">We couldn’t fetch the details automatically. Fill them in below.</p>
    {/if}
  </div>

  {#if status !== 'idle'}
    <div class="fields">
      <label>Paper title<input type="text" bind:value={draft.title} /></label>
      <label>System or benchmark name<input type="text" bind:value={draft.name} placeholder="Short name, e.g. M3-Agent" /></label>
      <label>Authors<input type="text" bind:value={draft.authors} /></label>
      <fieldset class="kind">
        <legend>This paper introduces a</legend>
        <label class="radio"><input type="radio" bind:group={draft.kind} value="architecture" /> memory system</label>
        <label class="radio"><input type="radio" bind:group={draft.kind} value="benchmark" /> benchmark or evaluation</label>
      </fieldset>
    </div>
  {/if}
</div>

<style>
  .lookup { display: flex; gap: 8px; flex-wrap: wrap; margin: 16px 0; }
  .lookup input { flex: 1; min-width: 220px; font: inherit; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); }
  .lookup input:focus { border-color: var(--accent); outline: none; box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent); }
  .msg { padding: 10px 14px; border-radius: 10px; font-size: 0.9375rem; animation: pop 260ms var(--ease); }
  .ok { background: color-mix(in srgb, var(--m-audio) 14%, var(--surface)); border: 1px solid var(--m-audio); }
  .dup { background: color-mix(in srgb, var(--m-gui) 16%, var(--surface)); border: 1px solid var(--m-gui); }
  .warn { background: color-mix(in srgb, var(--t3) 10%, var(--surface)); border: 1px solid var(--t3); }
  .fields { display: grid; gap: 12px; margin-top: 12px; }
  .fields > label { display: grid; gap: 4px; font-size: 0.875rem; color: var(--ink-2); }
  .fields input[type='text'] { font: inherit; padding: 10px 12px; border-radius: 8px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); }
  .kind { border: 0; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px 18px; font-size: 0.9375rem; }
  .kind legend { font-size: 0.875rem; color: var(--ink-2); margin-bottom: 4px; }
  .radio { display: inline-flex; gap: 6px; align-items: center; }
  @keyframes pop { from { opacity: 0; transform: translateY(4px); } }
</style>
