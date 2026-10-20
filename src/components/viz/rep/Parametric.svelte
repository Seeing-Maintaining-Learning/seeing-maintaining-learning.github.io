<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const L = [3, 4, 4, 2];
  const nodes = L.flatMap((n, li) => Array.from({ length: n }, (_, i) => ({ li, i, x: 170 + li * 42, y: 90 + (i - (n - 1) / 2) * 26 })));
  const edges = nodes.flatMap((a) => nodes.filter((b) => b.li === a.li + 1).map((b) => ({ a, b, k: `${a.li}${a.i}-${b.li}${b.i}` })));
  // Edges inside the adapter (layers 1->2) are the ones that change.
  const changed = (e: (typeof edges)[number]) => e.a.li === 1 && (e.a.i + e.b.i) % 2 === 0;
</script>

<svg viewBox="0 0 320 180">
  <Frame x={14} y={30} w={110} faded={step >= 3} />
  <text x="14" y="128" class="lbl" class:gone={step < 3}>observation discarded</text>
  <rect x="204" y="34" width="50" height="112" rx="8" class="adapter" class:show={step >= 1} />
  <text x="208" y="28" class="lbl" class:gone={step < 1}>LoRA adapter</text>
  {#each edges as e (e.k)}
    <line
      x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
      class:hot={step >= 2 && changed(e)}
      class:pulse={step === 1 && e.a.li === 1}
    />
  {/each}
  {#each nodes as n (`${n.li}${n.i}`)}<circle cx={n.x} cy={n.y} r="5" class="n" />{/each}
  <path d="M124 64 C 140 64, 150 80, 166 86" class="arrow" class:gone={step < 1} />
</svg>

<style>
  .lbl { font-size: 8px; fill: var(--muted); transition: opacity 400ms; }
  .gone { opacity: 0; }
  .adapter { fill: none; stroke: var(--t2); stroke-dasharray: 4 3; opacity: 0; transition: opacity 400ms; }
  .adapter.show { opacity: 1; }
  line { stroke: var(--rule); stroke-width: 1; transition: stroke 600ms, stroke-width 600ms; }
  line.hot { stroke: var(--t2); stroke-width: 3; }
  line.pulse { stroke: var(--t2); stroke-dasharray: 3 4; animation: dash 0.8s linear infinite; }
  @keyframes dash { to { stroke-dashoffset: -14; } }
  .n { fill: var(--surface); stroke: var(--ink-2); stroke-width: 1.5; }
  .arrow { fill: none; stroke: var(--t2); stroke-width: 1.5; transition: opacity 400ms; }
  @media (prefers-reduced-motion: reduce) { line.pulse { animation: none; } }
</style>
