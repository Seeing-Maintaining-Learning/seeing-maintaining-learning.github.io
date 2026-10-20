<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
</script>

<svg viewBox="0 0 320 180">
  <g class="rec" class:hit={step >= 2}>
    <rect x="16" y="28" width="150" height="56" rx="8" />
    <text x="26" y="46" class="lbl">text record · 34 bytes</text>
    <text x="26" y="62" class="r">[08:10] mug, keys on counter</text>
    <text x="26" y="75" class="src" class:show={step >= 1}>source → frame_1042</text>
  </g>
  <g class="q" class:show={step >= 2}>
    <rect x="16" y="112" width="132" height="22" rx="11" />
    <text x="26" y="127" class="qt">“Were the keys really there?”</text>
  </g>
  <path d="M166 70 C 196 70, 200 60, 214 60" class="link" class:show={step >= 1} class:flow={step >= 3} />
  <g class="frm" class:lit={step >= 3}>
    <Frame x={214} y={30} w={92} />
    <text x="214" y="112" class="lbl">raw frame · 2.1 MB</text>
  </g>
  <g class="ok" class:show={step >= 3}>
    <rect x="186" y="124" width="120" height="24" rx="12" />
    <text x="196" y="140" class="okt">verified against pixels ✓</text>
  </g>
</svg>

<style>
  .rec rect { fill: color-mix(in srgb, var(--m-audio) 12%, var(--surface)); stroke: var(--m-audio); transition: stroke-width 300ms; }
  .rec.hit rect { stroke-width: 3; }
  .lbl { font-size: 8px; fill: var(--muted); }
  .r { font-size: 8.5px; fill: var(--ink); font-family: var(--font-mono); }
  .src { font-size: 7.5px; fill: var(--accent); opacity: 0; transition: opacity 400ms; }
  .src.show, .q.show, .ok.show, .link.show { opacity: 1; }
  .q, .ok { opacity: 0; transition: opacity 400ms; }
  .q rect { fill: color-mix(in srgb, var(--m-gui) 20%, var(--surface)); stroke: var(--m-gui); }
  .qt { font-size: 8.5px; fill: var(--ink); }
  .link { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 4; opacity: 0; transition: opacity 400ms; }
  .link.flow { animation: dash 0.9s linear infinite; }
  @keyframes dash { to { stroke-dashoffset: -18; } }
  .frm { transition: opacity 400ms; opacity: 0.5; }
  .frm.lit { opacity: 1; }
  .ok rect { fill: color-mix(in srgb, var(--t2) 16%, var(--surface)); stroke: var(--t2); }
  .okt { font-size: 8.5px; fill: var(--ink); font-weight: 600; }
  @media (prefers-reduced-motion: reduce) { .link.flow { animation: none; } }
</style>
