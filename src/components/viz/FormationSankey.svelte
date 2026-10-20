<script lang="ts">
  import { sankey, sankeyLinkHorizontal, type SankeyGraph } from 'd3-sankey';

  interface Link { source: string; target: string; value: number; modality: string }
  interface NodeIn { id: string; label: string; stage: number; order: number }
  let {
    links,
    nodes,
    modalities,
    stages,
  }: {
    links: Link[];
    nodes: NodeIn[];
    modalities: { key: string; label: string; cls: string }[];
    stages: string[];
  } = $props();

  type N = NodeIn & { x0?: number; x1?: number; y0?: number; y1?: number; value?: number };
  type L = Link & { width?: number; y0?: number; y1?: number; source: N | string; target: N | string };

  const W = 1120;
  const H = 620;
  const M = { top: 28, right: 250, bottom: 8, left: 8 };

  const graph = $derived.by(() => {
    const gen = sankey<N, L>()
      .nodeId((d) => d.id)
      .nodeWidth(12)
      .nodePadding(14)
      .nodeAlign((n) => n.stage)
      .nodeSort((a, b) => a.order - b.order)
      .extent([
        [M.left, M.top],
        [W - M.right, H - M.bottom],
      ]);
    return gen({ nodes: nodes.map((n) => ({ ...n })), links: links.map((l) => ({ ...l })) } as SankeyGraph<N, L>);
  });

  const linkPath = sankeyLinkHorizontal();
  const clsOf = (m: string) => modalities.find((x) => x.key === m)?.cls ?? '';
  const labelOf = (m: string) => modalities.find((x) => x.key === m)?.label ?? m;

  let hoverNode = $state<string | null>(null);
  let hoverLink = $state<L | null>(null);
  let only = $state<string | null>(null);
  let tip = $state<{ x: number; y: number } | null>(null);
  let wrap: HTMLDivElement;

  const id = (n: N | string) => (typeof n === 'string' ? n : n.id);
  const lit = (l: L) => {
    if (only && l.modality !== only) return false;
    if (hoverNode) return id(l.source) === hoverNode || id(l.target) === hoverNode;
    if (hoverLink) return l === hoverLink;
    return true;
  };
  const stageX = (i: number) => {
    const xs = graph.nodes.filter((n) => n.stage === i).map((n) => n.x0 ?? 0);
    return xs.length ? Math.min(...xs) : 0;
  };
  const nodeTotal = (n: N) =>
    only
      ? graph.links
          .filter((l) => l.modality === only && (n.stage === 0 ? id(l.source) : id(l.target)) === n.id)
          .reduce((a, l) => a + l.value, 0)
      : (n.value ?? 0);

  function onMove(e: PointerEvent) {
    const r = wrap.getBoundingClientRect();
    tip = { x: e.clientX - r.left, y: e.clientY - r.top };
  }
  const fmt = (v: number) => {
    const r = Math.round(v * 10) / 10;
    return v >= 10 || Number.isInteger(r) ? Math.round(v).toString() : r.toFixed(1);
  };
</script>

<div class="sk">
  <div class="legend" role="group" aria-label="Highlight a modality">
    {#each modalities as m (m.key)}
      <button type="button" class="chip {m.cls}" aria-pressed={only === m.key} onclick={() => (only = only === m.key ? null : m.key)}>
        <span class="dot"></span>{m.label}
      </button>
    {/each}
  </div>
  <div class="scroller" bind:this={wrap} onpointermove={onMove} role="presentation">
    <svg viewBox="0 0 {W} {H}" role="img" aria-label="Flow from modality to representation, storage and retrieval">
      {#each stages as s, i (s)}
        <text class="stage" x={stageX(i)} y={14}>{s}</text>
      {/each}
      <g class="links">
        {#each graph.links as l, i (i)}
          <path
            class="link {clsOf(l.modality)}"
            class:off={!lit(l)}
            d={linkPath(l as never)}
            stroke-width={Math.max(1, l.width ?? 1)}
            role="presentation"
            onpointerenter={() => (hoverLink = l)}
            onpointerleave={() => (hoverLink = null)}
          />
        {/each}
      </g>
      {#each graph.nodes as n (n.id)}
          {@const ly = ((n.y0 ?? 0) + (n.y1 ?? 0)) / 2}
          {@const lw = (n.label.length + fmt(nodeTotal(n)).length + 1) * 6.9 + 14}
        <g
          class="node"
          role="presentation"
          onpointerenter={() => (hoverNode = n.id)}
          onpointerleave={() => (hoverNode = null)}
        >
          <rect x={n.x0} y={n.y0} width={(n.x1 ?? 0) - (n.x0 ?? 0)} height={Math.max(1, (n.y1 ?? 0) - (n.y0 ?? 0))} rx="3" />
          <rect class="pill" x={(n.x1 ?? 0) + 3} y={ly - 10} width={lw} height="20" rx="5" />
          <text x={(n.x1 ?? 0) + 10} y={ly} dy="0.32em">
            {n.label} <tspan class="v">{fmt(nodeTotal(n))}</tspan>
          </text>
        </g>
      {/each}
    </svg>
    {#if tip && (hoverLink || hoverNode)}
      <div class="viz-tip" style="left:{Math.min(tip.x + 14, wrap.clientWidth - 270)}px; top:{tip.y + 14}px">
        {#if hoverLink}
          {@const s = hoverLink.source as N}
          {@const t = hoverLink.target as N}
          <div class="tr {clsOf(hoverLink.modality)}"><span class="sw"></span>{labelOf(hoverLink.modality)}</div>
          <div>{s.label} → {t.label}</div>
          <div class="num"><strong>{fmt(hoverLink.value)}</strong> memory paths</div>
        {:else}
          {@const n = graph.nodes.find((x) => x.id === hoverNode)}
          {#if n}<div><strong>{n.label}</strong></div><div class="num">{fmt(nodeTotal(n))} memory paths</div>{/if}
        {/if}
      </div>
    {/if}
  </div>
</div>

<style>
  .sk { display: grid; gap: 12px; }
  .legend { display: flex; flex-wrap: wrap; gap: 6px; }
  .legend .chip { cursor: pointer; font: inherit; font-size: var(--step--1); }
  .legend .chip[aria-pressed='true'] { border-color: var(--c); background: color-mix(in srgb, var(--c) 14%, var(--surface)); color: var(--ink); }
  .scroller { position: relative; overflow-x: auto; }
  svg { display: block; width: 100%; min-width: 860px; height: auto; }
  .stage { font-size: 13px; font-weight: 600; fill: var(--muted); }
  .link { fill: none; stroke: var(--c); stroke-opacity: 0.42; transition: stroke-opacity var(--dur-2) var(--ease); mix-blend-mode: multiply; }
  :global(:root[data-theme='dark']) .link { mix-blend-mode: screen; }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .link { mix-blend-mode: screen; } }
  .link:hover { stroke-opacity: 0.75; }
  .link.off { stroke-opacity: 0.05; }
  .node rect { fill: var(--ink-2); }
  .node rect.pill { fill: var(--bg); fill-opacity: 0.88; }
  .node text { font-size: 13px; fill: var(--ink); }
  .node .v { fill: var(--muted); }
  .tr { display: flex; gap: 6px; align-items: center; font-weight: 600; }
  .sw { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
</style>
