<script lang="ts" module>
  export interface Item {
    id: string;
    text: string;
    group: string;
    state?: 'new' | 'stale' | 'hit' | 'revised' | 'fading' | 'merged';
    note?: string;
  }
</script>

<script lang="ts">
  import { flip } from 'svelte/animate';
  import { fade, scale } from 'svelte/transition';
  import { dur } from './motion.ts';

  let { items, grouped = false, label = 'Memory M' }: { items: Item[]; grouped?: boolean; label?: string } = $props();

  const groups = $derived(grouped ? [...new Set(items.map((i) => i.group))] : ['all']);
</script>

<div class="board" aria-label={label}>
  <p class="board-label small muted">{label}</p>
  <div class="groups" class:grouped>
    {#each groups as g (g)}
      <div class="group" transition:fade={{ duration: dur(200) }}>
        {#if grouped}<p class="gname small">{g}</p>{/if}
        <ul>
          {#each items.filter((i) => !grouped || i.group === g) as item (item.id)}
            <li
              class="item {item.state ?? ''}"
              animate:flip={{ duration: dur(380) }}
              in:scale={{ duration: dur(260), start: 0.85 }}
              out:fade={{ duration: dur(320) }}
            >
              <span class="text">{item.text}</span>
              {#if item.note}<span class="note">{item.note}</span>{/if}
            </li>
          {/each}
        </ul>
      </div>
    {/each}
  </div>
</div>

<style>
  .board { background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 14px; min-height: 260px; }
  .board-label { margin: 0 0 10px; }
  .groups.grouped { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
  .gname { margin: 0 0 6px; font-weight: 600; color: var(--ink-2); }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
  .grouped ul { flex-direction: column; flex-wrap: nowrap; }
  .item {
    display: flex; flex-direction: column; gap: 2px; padding: 8px 10px; border-radius: 8px;
    background: var(--surface-2); border: 1px solid transparent; font-size: 0.875rem; line-height: 1.3;
    transition: background var(--dur-2) var(--ease), border-color var(--dur-2) var(--ease), opacity var(--dur-2);
  }
  .note { font-size: 0.75rem; color: var(--muted); }
  .item.new { border-color: var(--t2); background: color-mix(in srgb, var(--t2) 14%, var(--surface)); }
  .item.hit { border-color: var(--focus); background: color-mix(in srgb, var(--focus) 14%, var(--surface)); }
  .item.revised { border-color: var(--t2); }
  .item.merged { border-color: var(--t3); background: color-mix(in srgb, var(--t2) 10%, var(--surface)); }
  .item.stale { opacity: 0.55; border-style: dashed; border-color: var(--muted); }
  .item.stale .text { text-decoration: line-through; text-decoration-color: var(--muted); }
  .item.fading { opacity: 0.4; }
</style>
