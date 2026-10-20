<script lang="ts">
  import Icon from '../Icon.svelte';

  interface Group { key: string; label: string; values: number[] }
  let { groups, modalities }: { groups: Group[]; modalities: { key: string; label: string }[] } = $props();
  let width = $state(420);
  let hi = $state<{ g: number; m: number } | null>(null);
  const H = 170;
  const B = 34;
  const max = Math.max(...groups.flatMap((g) => g.values));
  const gw = $derived((width - 8) / groups.length);
  const bw = $derived(Math.max(3, (gw - 14) / modalities.length - 2));
  const VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied' };
</script>

<div class="spec" bind:clientWidth={width}>
  <svg viewBox="0 0 {width} {H}" width="100%" height={H} role="img" aria-label="Systems per representation form, split by modality">
    {#each [0.25, 0.5, 0.75, 1] as f (f)}
      <line x1="0" x2={width} y1={H - B - (H - B - 8) * f} y2={H - B - (H - B - 8) * f} class="grid" />
    {/each}
    {#each groups as g, gi (g.key)}
      {#each g.values as v, mi (mi)}
        {@const h = ((H - B - 8) * v) / max}
        <a href="/systems/?leaves={g.key}&modality={modalities[mi].key}" aria-label="{g.label}, {modalities[mi].label}: {v}">
          <rect
            x={4 + gi * gw + 7 + mi * (bw + 2)}
            y={H - B - h}
            width={bw}
            height={Math.max(1, h)}
            rx="1.5"
            class="bar"
            class:dim={hi && !(hi.g === gi && hi.m === mi)}
            style="--c: var({VAR[modalities[mi].key]})"
            role="presentation"
            onpointerenter={() => (hi = { g: gi, m: mi })}
            onpointerleave={() => (hi = null)}
          />
        </a>
      {/each}
      <text x={4 + gi * gw + gw / 2} y={H - B + 14} text-anchor="middle" class="gl">{g.label}</text>
      <text x={4 + gi * gw + gw / 2} y={H - B + 27} text-anchor="middle" class="gn num">{g.values.reduce((a, b) => a + b, 0)}</text>
    {/each}
  </svg>
  {#if hi}
    {@const g = groups[hi.g]}
    <div class="viz-tip" style="left:{Math.min(width - 200, 4 + hi.g * gw)}px; top:4px">
      <strong>{g.label}</strong>
      <div class="row mod-{modalities[hi.m].key}"><span class="ic"><Icon name={modalities[hi.m].key} size={13} /></span>{modalities[hi.m].label}: <span class="num">{g.values[hi.m]}</span></div>
    </div>
  {/if}
</div>

<style>
  .spec { position: relative; }
  svg { display: block; }
  .grid { stroke: var(--rule); stroke-dasharray: 2 4; }
  .bar { fill: var(--c); transition: opacity 150ms; cursor: pointer; }
  .bar.dim { opacity: 0.25; }
  .gl { font-size: 10.5px; fill: var(--ink-2); font-weight: 600; }
  .gn { font-size: 10.5px; fill: var(--muted); }
  .row { display: flex; gap: 6px; align-items: center; }
  .ic { color: var(--c); display: inline-flex; }
</style>
