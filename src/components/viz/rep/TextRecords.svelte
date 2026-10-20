<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const CAPTION = 'A mug and keys are on the kitchen counter.';
  const LOG = ['[07:55] User made tea.', '[08:02] Robot charged at dock.'];
</script>

<svg viewBox="0 0 320 180">
  <Frame x={14} y={22} w={110} faded={step >= 3} />
  <g class="vlm" class:show={step >= 1}>
    <rect x="138" y="22" width="168" height="34" rx="6" class="bubble" />
    <text x="146" y="43" class="cap" style="--n:{CAPTION.length}" class:typing={step >= 1}>{CAPTION}</text>
  </g>
  <g class="log" class:show={step >= 2}>
    <rect x="138" y="70" width="168" height="74" rx="6" class="paper" />
    <text x="146" y="86" class="lbl">memory log</text>
    {#each LOG as l, i (l)}<text x="146" y={100 + i * 13} class="line">{l}</text>{/each}
    <text x="146" y="126" class="line new">[08:10] Mug and keys on counter.</text>
  </g>
  <g class="lost" class:show={step >= 3}>
    <rect x="22" y="108" width="98" height="40" rx="6" class="lostbox" />
    <text x="30" y="124" class="lt">mug color? <tspan class="x">— not recorded</tspan></text>
    <text x="30" y="138" class="lt">key ring shape? <tspan class="x">— lost</tspan></text>
  </g>
</svg>

<style>
  .vlm, .log, .lost { opacity: 0; transition: opacity 450ms var(--ease); }
  .show { opacity: 1; }
  .bubble { fill: color-mix(in srgb, var(--m-audio) 14%, var(--surface)); stroke: var(--m-audio); }
  .cap { font-size: 8.5px; fill: var(--ink); clip-path: inset(0 100% 0 0); }
  .cap.typing { animation: type 1.6s steps(42) forwards; }
  @keyframes type { to { clip-path: inset(0 0 0 0); } }
  .paper { fill: var(--surface); stroke: var(--rule); }
  .lbl { font-size: 8px; fill: var(--muted); }
  .line { font-size: 7.5px; fill: var(--ink-2); font-family: var(--font-mono); }
  .line.new { fill: var(--ink); font-weight: 600; }
  .lostbox { fill: color-mix(in srgb, var(--t3) 10%, var(--surface)); stroke: var(--t3); stroke-dasharray: 3 2; }
  .lt { font-size: 7.5px; fill: var(--ink-2); }
  .x { fill: var(--t3); }
  @media (prefers-reduced-motion: reduce) { .cap.typing { animation: none; clip-path: none; } }
</style>
