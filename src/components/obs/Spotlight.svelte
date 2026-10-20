<script lang="ts">
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import Icon from '../Icon.svelte';
  import { dur, reducedMotion, whileVisible } from '../viz/motion.ts';

  interface Item { id: string; name: string; title: string; modality: string; modalityLabel: string; date: string; evolves: string[]; forms: string[] }
  interface Dot { id: string; tier: string; a: number; modality: string }
  let { items, dots }: { items: Item[]; dots: Dot[] } = $props();
  let k = $state(0);
  let hold = $state(false);
  let el: HTMLDivElement;
  const it = $derived(items[k]);
  const R: Record<string, number> = { T1: 38, T2: 66, T3: 94 };

  onMount(() => {
    if (reducedMotion()) return;
    let visible = false;
    const stop = whileVisible(el, (v) => (visible = v));
    const t = setInterval(() => visible && !hold && (k = (k + 1) % items.length), 8000);
    return () => {
      clearInterval(t);
      stop();
    };
  });
  const VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied' };
  const spotA = $derived(dots.find((d) => d.id === it.id)?.a ?? -Math.PI / 2);
  const t3n = dots.filter((d) => d.tier === 'T3').length;
</script>

<div class="spot" bind:this={el} role="region" aria-label="T3 Self-Evolving Memory spotlight" onpointerenter={() => (hold = true)} onpointerleave={() => (hold = false)}>
  <div class="left">
    <div class="tabs" role="tablist" aria-label="Spotlight items">
      {#each items as s, i (s.id)}
        <button type="button" role="tab" aria-selected={k === i} class="num" onclick={() => (k = i)}>{String(i + 1).padStart(2, '0')}</button>
      {/each}
      {#if !reducedMotion()}<span class="timer" class:paused={hold}><span style="animation-duration: 8000ms" class:run={!hold}></span></span>{/if}
    </div>
    {#key k}
      <div class="body mod-{it.modality}" in:fade={{ duration: dur(250) }}>
        <p class="kick small"><span class="ic"><Icon name="T3" size={13} /></span> T3 Self-Evolving Memory · {it.date}</p>
        <a class="name" href="/systems/{it.id}/">{it.name}</a>
        <p class="title">{it.title}</p>
        <p class="small">
          <span class="muted">Evolves its</span> <strong>{it.evolves.join(', ') || 'memory policy'}</strong>
          <span class="muted"> · stores memory as</span> {it.forms.join(', ')}
        </p>
        <p class="small chipline"><span class="chip mod-{it.modality}"><span class="dot"></span>{it.modalityLabel}</span></p>
      </div>
    {/key}
  </div>
  <svg viewBox="-110 -110 220 220" class="rings" aria-hidden="true">
    {#each ['T1', 'T2', 'T3'] as t (t)}
      <circle r={R[t]} class="ring" style="--c: var(--t{t[1]})" />
    {/each}
    {#each dots as d, i (i)}
      <circle cx={R[d.tier] * Math.cos(d.a)} cy={R[d.tier] * Math.sin(d.a)} r={d.tier === 'T3' ? 2.6 : 1.6} class="pt" style="--c: var({VAR[d.modality]})" />
    {/each}
    <g transform="translate({R.T3 * Math.cos(spotA)} {R.T3 * Math.sin(spotA)})" style="--c: var({VAR[it.modality]})">
      <circle r="9" class="halo" />
      <circle r="4.5" class="spotdot" />
    </g>
    <text y="4" text-anchor="middle" class="mid num">{t3n}</text>
    <text y="18" text-anchor="middle" class="mids">T3 systems</text>
  </svg>
</div>

<style>
  .spot { display: grid; grid-template-columns: 1fr 220px; gap: 20px; align-items: center; }
  .tabs { display: flex; gap: 4px; align-items: center; margin-bottom: 10px; }
  .tabs button { font: inherit; font-size: 0.8125rem; padding: 3px 9px; border-radius: 6px; border: 1px solid var(--rule); background: var(--surface); color: var(--muted); cursor: pointer; }
  .tabs button[aria-selected='true'] { color: var(--ink); border-color: var(--t3); background: color-mix(in srgb, var(--t3) 12%, var(--surface)); }
  .timer { flex: 1; height: 2px; background: var(--rule); margin-left: 8px; border-radius: 1px; overflow: hidden; }
  .timer span { display: block; height: 100%; width: 0; background: var(--t3); }
  .timer span.run { animation-name: fill; animation-timing-function: linear; animation-iteration-count: infinite; }
  @keyframes fill { to { width: 100%; } }
  .body { display: grid; gap: 4px; }
  .kick { margin: 0; color: var(--ink-2); display: inline-flex; gap: 6px; align-items: center; font-weight: 600; }
  .kick .ic { display: inline-flex; color: var(--t3); }
  .name { font-size: var(--step-2); font-weight: 700; color: var(--ink); text-decoration: none; line-height: 1.15; }
  .name:hover { text-decoration: underline; }
  .title { margin: 0; color: var(--ink-2); font-family: var(--font-read); }
  .body p { margin: 0; }
  .chipline { margin-top: 4px !important; }
  .rings { width: 100%; height: auto; }
  .ring { fill: none; stroke: var(--c); stroke-opacity: 0.45; stroke-dasharray: 2 4; }
  .pt { fill: var(--c); opacity: 0.55; }
  .halo { fill: none; stroke: var(--c); stroke-width: 2; opacity: 0.6; }
  .spotdot { fill: var(--c); stroke: var(--surface); stroke-width: 1.5; }
  .mid { font-size: 20px; font-weight: 700; fill: var(--ink); }
  .mids { font-size: 8px; fill: var(--muted); }
  @media (max-width: 640px) { .spot { grid-template-columns: 1fr; } .rings { max-width: 200px; justify-self: center; } }
  @media (prefers-reduced-motion: reduce) { .timer { display: none; } }
</style>
