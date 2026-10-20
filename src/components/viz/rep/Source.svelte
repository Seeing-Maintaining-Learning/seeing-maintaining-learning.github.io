<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const TIMES = ['08:10', '09:45', '12:30', '18:02'];
</script>

<svg viewBox="0 0 320 180">
  <Frame x={14} y={20} w={96} faded={step >= 2} />
  <!-- film-strip archive -->
  <g class="strip" class:show={step >= 1}>
    <rect x="128" y="14" width="178" height="74" rx="6" class="box" />
    <text x="136" y="28" class="lbl">archive · raw frames</text>
    {#each TIMES as t, i (t)}
      <g class="cell" style="transform: translate({136 + i * 42}px, 36px); transition-delay: {i * 120}ms" class:hit={step >= 3 && i === 0}>
        <Frame w={36} time={t} mugAt={i >= 2 ? 'sink' : 'counter'} />
      </g>
    {/each}
  </g>
  <!-- query -->
  <g class="q" class:show={step >= 2}>
    <rect x="128" y="104" width="120" height="22" rx="11" class="pill" />
    <text x="138" y="119" class="qt">“Where are my keys?”</text>
  </g>
  <!-- model receives the exact frame -->
  <g class="model" class:show={step >= 3}>
    <rect x="22" y="112" width="88" height="52" rx="8" class="m" />
    <text x="32" y="128" class="lbl">model input</text>
    <g style="transform: translate(36px, 134px)"><Frame w={40} /></g>
    <path d="M150 74 C 150 140, 120 140, 112 138" class="arrow" />
  </g>
</svg>

<style>
  .box { fill: var(--surface); stroke: var(--rule); }
  .lbl { font-size: 8px; fill: var(--muted); }
  .strip { opacity: 0; transition: opacity 500ms var(--ease); }
  .strip.show { opacity: 1; }
  .cell { transition: transform 600ms var(--ease); }
  .cell.hit :global(.wall) { stroke: var(--m-image); stroke-width: 3; }
  .q, .model { opacity: 0; transform: translateY(6px); transition: opacity 400ms var(--ease), transform 400ms var(--ease); }
  .q.show, .model.show { opacity: 1; transform: none; }
  .pill { fill: color-mix(in srgb, var(--m-gui) 20%, var(--surface)); stroke: var(--m-gui); }
  .qt { font-size: 9px; fill: var(--ink); }
  .m { fill: color-mix(in srgb, var(--m-image) 12%, var(--surface)); stroke: var(--m-image); }
  .arrow { fill: none; stroke: var(--m-image); stroke-width: 1.5; stroke-dasharray: 4 3; }
</style>
