<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Icon from '../Icon.svelte';
  import { dur, reducedMotion, whileVisible } from '../viz/motion.ts';

  export interface ScanItem {
    id: string;
    name: string;
    title: string;
    modality: string;
    modalityLabel: string;
    tier: string;
    tierLabel: string;
    date: string;
    flow: string[];
  }
  let { items, latest, all = [] }: { items: ScanItem[]; latest: ScanItem[]; all?: ScanItem[] } = $props();
  const byId = new Map(all.map((x) => [x.id, x]));
  // A system picked on the sphere: shown while hovered and for a few seconds after.
  let picked = $state<ScanItem | null>(null);
  let pickTimer: ReturnType<typeof setTimeout> | undefined;
  let k = $state(0);
  let dir = $state(1);
  let hold = $state(false);
  let el: HTMLDivElement;
  const it = $derived(picked ?? items[k]);

  const go = (d: number) => {
    picked = null;
    dir = d;
    k = (k + d + items.length) % items.length;
  };

  // Tell the sphere which system this card shows, so it can ring the matching dot.
  $effect(() => {
    window.dispatchEvent(new CustomEvent('scan-show', { detail: it.id }));
  });

  onMount(() => {
    const onHover = (e: Event) => {
      const id = (e as CustomEvent<string | null>).detail;
      clearTimeout(pickTimer);
      if (id && byId.has(id)) {
        dir = 1;
        picked = byId.get(id)!;
      } else if (picked) {
        // Keep the last hovered system on screen briefly before rotation resumes.
        pickTimer = setTimeout(() => (picked = null), 8000);
      }
    };
    window.addEventListener('sphere-hover', onHover);
    let visible = false;
    const stop = whileVisible(el, (v) => (visible = v));
    const t = reducedMotion() ? undefined : setInterval(() => visible && !hold && !picked && go(1), 6000);
    return () => {
      clearInterval(t);
      clearTimeout(pickTimer);
      window.removeEventListener('sphere-hover', onHover);
      stop();
    };
  });
</script>

<div class="scan" bind:this={el} role="region" aria-label="System scan" onpointerenter={() => (hold = true)} onpointerleave={() => (hold = false)}>
  <div class="card mod-{it.modality}">
    <div class="top">
      <span class="ic"><Icon name={it.modality} size={16} /></span>
      <span class="small muted">{it.modalityLabel}</span>
      <span class="count num small muted">{picked ? 'Hovered' : `${k + 1}/${items.length}`}</span>
      <button type="button" class="nav" aria-label="Previous system" onclick={() => go(-1)}>‹</button>
      <button type="button" class="nav" aria-label="Next system" onclick={() => go(1)}>›</button>
    </div>
    {#key it.id}
      <div class="body" in:fly={{ x: 16 * dir, duration: dur(260) }}>
        <a class="name" href="/systems/{it.id}/">{it.name}</a>
        <p class="title">{it.title}</p>
        <ol class="flow" aria-label="Memory path">
          {#each it.flow as f, j (j)}
            <li>{f}</li>
          {/each}
        </ol>
        <p class="meta small"><span class="chip tier-{it.tier}"><span class="dot"></span>{it.tier} {it.tierLabel}</span><span class="muted num nowrap">{it.date}</span></p>
      </div>
    {/key}
  </div>

  <p class="lh small">Latest systems</p>
  <ol class="log">
    {#each latest as l (l.id)}
      <li class="mod-{l.modality}">
        <span class="d num">{l.date.slice(0, 7)}</span>
        <span class="ic"><Icon name={l.modality} size={13} /></span>
        <a href="/systems/{l.id}/">{l.name}</a>
      </li>
    {/each}
  </ol>
</div>

<style>
  .scan { display: grid; gap: 10px; align-content: start; }
  .card { border: 1px solid var(--rule); border-radius: 10px; padding: 12px 14px; background: var(--surface); min-height: 214px; border-top: 3px solid var(--c); overflow: hidden; }
  .top { display: flex; align-items: center; gap: 6px; white-space: nowrap; }
  .ic { color: var(--c); display: inline-flex; }
  .count { margin-left: auto; }
  .nav { font: inherit; width: 24px; height: 24px; border-radius: 6px; border: 1px solid var(--rule); background: var(--bg); color: var(--ink-2); cursor: pointer; line-height: 1; }
  .body { display: grid; gap: 6px; margin-top: 10px; }
  .name { font-size: var(--step-1); font-weight: 700; color: var(--ink); text-decoration: none; }
  .name:hover { text-decoration: underline; }
  .title { margin: 0; font-size: 0.8125rem; color: var(--ink-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .flow { list-style: none; padding: 0; margin: 4px 0 0; display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
  .flow li { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.75rem; padding: 2px 8px; border-radius: 6px; background: color-mix(in srgb, var(--c) 14%, var(--surface)); color: var(--ink); }
  .flow li + li::before { content: '→'; margin-right: 6px; color: var(--muted); }
  .meta { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin: 2px 0 0; }
  .nowrap { white-space: nowrap; }
  .lh { margin: 6px 0 0; font-weight: 650; color: var(--ink-2); }
  .log { list-style: none; padding: 0; margin: 0; display: grid; gap: 2px; }
  .log li { display: grid; grid-template-columns: 7.2ch 16px minmax(0, 1fr); gap: 8px; align-items: center; font-size: 0.8125rem; padding: 4px 6px; border-radius: 6px; }
  .log li:hover { background: var(--surface-2); }
  .log .d { color: var(--muted); }
  .log a { color: var(--ink); text-decoration: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .log a:hover { text-decoration: underline; }
</style>
