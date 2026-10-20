<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const N = {
    mug: { x: 205, y: 40, c: '--m-video', l: 'mug' },
    keys: { x: 290, y: 52, c: '--m-gui', l: 'keys' },
    counter: { x: 248, y: 108, c: '--m-embodied', l: 'counter' },
    sink: { x: 160, y: 112, c: '--m-embodied', l: 'sink' },
    kitchen: { x: 206, y: 156, c: '--m-image', l: 'kitchen' },
  } as const;
  type K = keyof typeof N;
  const edges = $derived(
    [
      { a: 'mug', b: step >= 3 ? 'sink' : 'counter', l: step >= 3 ? 'in' : 'on', fresh: step >= 3 },
      { a: 'keys', b: 'counter', l: 'on', fresh: false },
      { a: 'counter', b: 'kitchen', l: 'in', fresh: false },
      { a: 'sink', b: 'kitchen', l: 'in', fresh: false },
    ] as { a: K; b: K; l: string; fresh: boolean }[],
  );
</script>

<svg viewBox="0 0 320 180">
  <Frame x={10} y={22} w={100} mugAt={step >= 3 ? 'sink' : 'counter'} time={step >= 3 ? '12:30' : '08:10'} />
  <g class="edges" class:show={step >= 2}>
    {#each edges as e (e.a + e.b)}
      <line x1={N[e.a].x} y1={N[e.a].y} x2={N[e.b].x} y2={N[e.b].y} class:fresh={e.fresh} />
      <text x={(N[e.a].x + N[e.b].x) / 2 + 4} y={(N[e.a].y + N[e.b].y) / 2 - 3} class="el">{e.l}</text>
    {/each}
    {#if step >= 3}<line x1={N.mug.x} y1={N.mug.y} x2={N.counter.x} y2={N.counter.y} class="old" />{/if}
  </g>
  {#each Object.entries(N) as [k, n], i (k)}
    <g class="node" class:show={step >= 1} style="transform: translate({n.x}px, {n.y}px); transition-delay: {i * 90}ms">
      <circle r="11" style="fill: color-mix(in srgb, var({n.c}) 25%, var(--surface)); stroke: var({n.c})" />
      <text y="22" text-anchor="middle" class="nl">{n.l}</text>
    </g>
  {/each}
</svg>

<style>
  .node { opacity: 0; transition: opacity 400ms var(--ease); }
  .node.show { opacity: 1; }
  .node circle { stroke-width: 2; }
  .nl { font-size: 8px; fill: var(--ink); }
  .edges { opacity: 0; transition: opacity 400ms; }
  .edges.show { opacity: 1; }
  line { stroke: var(--ink-2); stroke-width: 1.5; }
  line.fresh { stroke: var(--t2); stroke-width: 2.5; }
  line.old { stroke: var(--t3); stroke-dasharray: 3 3; opacity: 0.6; }
  .el { font-size: 7.5px; fill: var(--muted); }
</style>
