<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const N = 16;
  // Deterministic pseudo-random state per step.
  const val = (i: number, s: number) => (Math.sin(i * 12.9 + s * 3.7) * 43758.5) % 1;
  const cells = $derived(Array.from({ length: N }, (_, i) => Math.abs(val(i, Math.min(step, 2)))));
  const FRAMES = ['08:10', '08:11', '08:12'];
</script>

<svg viewBox="0 0 320 180">
  {#each FRAMES as t, i (t)}
    <g class="f" style="transform: translate({step >= 1 ? 100 + i * 60 : 14 + i * 34}px, {step >= 1 ? 120 : 20 + i * 8}px) scale({step >= 1 ? 0.2 : 1}); opacity: {step >= 1 ? 0 : 1}; transition-delay: {i * 160}ms">
      <Frame w={64} time={t} />
    </g>
  {/each}
  <text x="40" y="104" class="lbl">h<tspan baseline-shift="sub" font-size="6">t</tspan> = f(h<tspan baseline-shift="sub" font-size="6">t−1</tspan>, x<tspan baseline-shift="sub" font-size="6">t</tspan>)</text>
  <g class="vec">
    {#each cells as v, i (i)}
      <rect x={40 + i * 15} y="114" width="13" height="26" rx="2" style="fill: color-mix(in srgb, var(--t1) {Math.round(15 + v * 85)}%, var(--surface))" />
    {/each}
  </g>
  <text x="40" y="154" class="lbl">hidden state · 2048 dims (16 shown)</text>
  <g class="q" class:show={step >= 3}>
    <rect x="200" y="22" width="106" height="44" rx="8" class="qb" />
    <text x="208" y="40" class="qt">What does dim 7 mean?</text>
    <text x="208" y="55" class="qx">not human-readable</text>
  </g>
</svg>

<style>
  .f { transition: transform 700ms var(--ease), opacity 600ms var(--ease); }
  .vec rect { transition: fill 700ms var(--ease); }
  .lbl { font-size: 8px; fill: var(--muted); }
  .q { opacity: 0; transition: opacity 400ms; }
  .q.show { opacity: 1; }
  .qb { fill: color-mix(in srgb, var(--t3) 10%, var(--surface)); stroke: var(--t3); stroke-dasharray: 3 2; }
  .qt { font-size: 8px; fill: var(--ink); }
  .qx { font-size: 8px; fill: var(--t3); font-weight: 600; }
</style>
