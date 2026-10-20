<script lang="ts">
  import { draft } from './draft.svelte.ts';
  import { issueUrl, markdown } from '../../lib/contribute.ts';

  let { labels }: { labels: Record<string, Record<string, string>> } = $props();
  let copied = $state(false);
  let opened = $state(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(markdown(draft, labels));
      copied = true;
      setTimeout(() => (copied = false), 2000);
    } catch {
      copied = false;
    }
  }
</script>

<div class="step">
  <h2 tabindex="-1">Where does the paper describe its memory?</h2>
  <p class="muted">Point maintainers to the section, page, or figure. Short notes are enough; they will verify against the paper.</p>
  <label class="ev">
    <span class="sr-only">Evidence</span>
    <textarea rows="5" bind:value={draft.evidence} placeholder="e.g. Sec. 3.2 and Fig. 2: event memory stored as captions in a vector index; Sec. 3.4: memories merged every 100 frames."></textarea>
  </label>
  <div class="who">
    <fieldset>
      <legend class="small muted">Your relation to the paper</legend>
      <label><input type="radio" bind:group={draft.relation} value="author" /> I’m an author</label>
      <label><input type="radio" bind:group={draft.relation} value="reader" /> I’m not an author</label>
    </fieldset>
    <label class="gh">
      <span class="small muted">GitHub handle (optional)</span>
      <input type="text" bind:value={draft.github} placeholder="@username" />
    </label>
  </div>

  <div class="submit">
    <a
      class="btn primary big"
      href={issueUrl(draft, labels)}
      target="_blank"
      rel="noopener"
      onclick={() => (opened = true)}
    >Open the GitHub issue</a>
    <button type="button" class="btn" onclick={copy}>{copied ? 'Copied' : 'Copy as Markdown'}</button>
  </div>
  <p class="small muted">
    The issue opens pre-filled in the survey’s corpus repository. Review it and press <strong>Create</strong>; you need a GitHub account.
    A bot checks for duplicates, and maintainers verify the classification before adding the record.
  </p>
  {#if opened}<p class="thanks" aria-live="polite">Thank you! Once merged, your paper will appear on this site at the next weekly update.</p>{/if}
</div>

<style>
  .ev textarea { width: 100%; font: inherit; padding: 12px 14px; border-radius: 10px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); resize: vertical; margin: 12px 0; }
  .who { display: flex; flex-wrap: wrap; gap: 16px 32px; align-items: end; margin-bottom: 24px; }
  fieldset { border: 0; padding: 0; margin: 0; display: flex; gap: 14px; flex-wrap: wrap; }
  fieldset legend { margin-bottom: 4px; }
  .gh { display: grid; gap: 4px; }
  .gh input { font: inherit; padding: 8px 12px; border-radius: 8px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); }
  .submit { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 10px; }
  .big { padding: 12px 22px; font-weight: 600; }
  .thanks { padding: 12px 16px; border-radius: 12px; background: color-mix(in srgb, var(--m-audio) 14%, var(--surface)); border: 1px solid var(--m-audio); }
</style>
