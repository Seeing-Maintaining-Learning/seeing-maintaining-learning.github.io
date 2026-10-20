<script lang="ts">
  import { onMount } from 'svelte';
  import { arc as d3arc } from 'd3-shape';
  import { ICONS } from '../../../data/icons.ts';
  import { reducedMotion, whileVisible } from '../motion.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { FAM, FAM_NAME, FAM_VAR, famKey, groupBy, hash, polar, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy, paused }: { points: Pt[]; colorBy: ColorBy; paused: boolean } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let focus = $state<number | null>(null);
  let clock = $state(0);
  let el: HTMLDivElement;
  const H = $derived(width < 640 ? 440 : 600);
  const S = $derived(Math.min(width, H));
  const cx = $derived(width / 2);
  const cy = $derived(H / 2);
  const R = $derived(S * 0.3);

  const groups = groupBy(points, famKey);
  const single = (i: number) => (groups.get(String(i)) ?? []);
  const pairs: [number, number][] = [[0, 1], [1, 2], [0, 2]];
  const pairList = (a: number, b: number) => groups.get(`${a}${b}`) ?? [];
  const triple = groups.get('012') ?? [];

  // Arc for each family: its single-family block plus one block per pair it joins.
  const PAD = 0.12;
  const weight = (i: number) => single(i).length + pairs.filter(([a, b]) => a === i || b === i).reduce((s, [a, b]) => s + pairList(a, b).length, 0) + triple.length;
  const W3 = FAM.map((_, i) => weight(i));
  const free = Math.PI * 2 - PAD * 3;
  const famArc = (() => {
    let a = -Math.PI / 2 - (free * W3[0]) / (2 * W3.reduce((s, x) => s + x, 0));
    return FAM.map((_, i) => {
      const a0 = a;
      const a1 = a0 + (free * W3[i]) / W3.reduce((s, x) => s + x, 0);
      a = a1 + PAD;
      return { a0, a1 };
    });
  })();
  // Sub-blocks on each arc: [single][pair with the neighbour][pair with the other][triple].
  const block = (() => {
    const out: Record<string, { a0: number; a1: number }> = {};
    FAM.forEach((_, i) => {
      const { a0, a1 } = famArc[i];
      const per = (a1 - a0) / W3[i];
      let a = a0;
      const take = (key: string, n: number) => {
        out[`${i}:${key}`] = { a0: a, a1: a + per * n };
        a += per * n;
      };
      take('s', single(i).length);
      for (const [x, y] of pairs) if (x === i || y === i) take(`${x}${y}`, pairList(x, y).length);
      take('t', triple.length);
    });
    return out;
  })();
  const mid = (b: { a0: number; a1: number }) => (b.a0 + b.a1) / 2;

  function ribbon(i: number, j: number, key: string) {
    const A = block[`${i}:${key}`];
    const B = block[`${j}:${key}`];
    const p = (a: number) => polar(cx, cy, R, a);
    const [a0x, a0y] = p(A.a0);
    const [a1x, a1y] = p(A.a1);
    const [b0x, b0y] = p(B.a0);
    const [b1x, b1y] = p(B.a1);
    return `M${a0x},${a0y} A${R},${R} 0 0 1 ${a1x},${a1y} Q${cx},${cy} ${b0x},${b0y} A${R},${R} 0 0 1 ${b1x},${b1y} Q${cx},${cy} ${a0x},${a0y}Z`;
  }

  // Quadratic Bézier through the centre between two arc midpoints.
  const bez = (a: number, b: number, t: number): [number, number] => {
    const [x0, y0] = polar(cx, cy, R, a);
    const [x1, y1] = polar(cx, cy, R, b);
    const u = 1 - t;
    return [u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1];
  };

  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    const idx = new Map(points.map((p, i) => [p.id, i]));
    // Single-family systems: a polar band just outside their arc.
    FAM.forEach((_, f) => {
      const b = block[`${f}:s`];
      const list = single(f);
      const gap = S * 0.021;
      let k = 0;
      for (let row = 0; k < list.length; row++) {
        const r = R + S * 0.06 + row * gap;
        const cap = Math.max(1, Math.floor(((famArc[f].a1 - famArc[f].a0) * r) / gap));
        const take = Math.min(cap, list.length - k);
        for (let j = 0; j < take; j++) out[idx.get(list[k++].id)!] = polar(cx, cy, r, famArc[f].a0 + ((j + 0.5) / cap) * (famArc[f].a1 - famArc[f].a0));
      }
      void b;
    });
    // Hybrids: particles flowing along their ribbon.
    for (const [a, b] of pairs) {
      const key = `${a}${b}`;
      const list = pairList(a, b);
      const A = block[`${a}:${key}`];
      const B = block[`${b}:${key}`];
      list.forEach((p, k) => {
        const lane = hash(p.id);
        const t = ((k + 0.5) / list.length + clock * 0.00004) % 1;
        out[idx.get(p.id)!] = bez(A.a0 + lane * (A.a1 - A.a0), B.a1 - lane * (B.a1 - B.a0), 0.08 + 0.84 * t);
      });
    }
    triple.forEach((p, k) => (out[idx.get(p.id)!] = polar(cx, cy, S * 0.02 * (k + 1), k * 2.1)));
    return out;
  });

  const ringArc = $derived(d3arc<{ a0: number; a1: number }>()
    .startAngle((d) => d.a0 + Math.PI / 2)
    .endAngle((d) => d.a1 + Math.PI / 2)
    .innerRadius(R)
    .outerRadius(R + S * 0.03)
    .cornerRadius(3));

  onMount(() => {
    let raf = 0;
    let last = 0;
    let visible = false;
    const loop = (now: number) => {
      if (!paused && !reducedMotion() && hover === null) clock += Math.min(50, last ? now - last : 16);
      last = now;
      raf = visible ? requestAnimationFrame(loop) : 0;
    };
    const stop = whileVisible(el, (v) => {
      visible = v;
      last = 0;
      if (v && !raf) raf = requestAnimationFrame(loop);
    });
    return () => {
      stop();
      cancelAnimationFrame(raf);
    };
  });
</script>

<div bind:this={el}>
  <Frame bind:width height={H} {points} {hover} {pos} label="Chord diagram of representation families with hybrid systems flowing between them">
    {#each pairs as [a, b] (`${a}${b}`)}
      <path
        d={ribbon(a, b, `${a}${b}`)}
        class="rib"
        class:faded={focus !== null && focus !== a && focus !== b}
        style="--c1: var({FAM_VAR[a]}); --c2: var({FAM_VAR[b]})"
      />
    {/each}
    {#each FAM as _, i (i)}
      <path
        transform="translate({cx} {cy})"
        d={ringArc(famArc[i]) ?? ''}
        class="arc"
        class:faded={focus !== null && focus !== i}
        style="--c: var({FAM_VAR[i]})"
        role="presentation"
        onpointerenter={() => (focus = i)}
        onpointerleave={() => (focus = null)}
      />
      {@const [lx, ly] = polar(cx, cy, R + S * 0.15, mid(famArc[i]))}
      <g transform="translate({lx} {ly})" class="lab" style="--c: var({FAM_VAR[i]})">
        <svg x="-10" y="-30" width="20" height="20" viewBox="0 0 24 24" class="ico">{@html ICONS[FAM[i]]}</svg>
        <text text-anchor="middle" class="ln">{FAM_NAME[i]}</text>
        <text text-anchor="middle" y="15" class="lc num">{W3[i]} systems</text>
      </g>
    {/each}
    {#each pairs as [a, b] (`${a}${b}`)}
      {@const [mx, my] = bez(mid(block[`${a}:${a}${b}`]), mid(block[`${b}:${a}${b}`]), 0.5)}
      <text x={mx} y={my} text-anchor="middle" dy="0.32em" class="pc num">{pairList(a, b).length}</text>
    {/each}
    <Dots {points} {pos} r={S * 0.0068} {colorBy} bind:hover dim={focus !== null ? (p) => !p.families.includes(FAM[focus!]) : null} />
  </Frame>
</div>
<p class="cap small muted">
  Arcs are the three representation families. Ribbons connect families that hybrid systems combine; their dots flow along the
  ribbon. Systems using one family sit outside its arc.
</p>

<style>
  .rib { fill: color-mix(in srgb, var(--c1) 22%, color-mix(in srgb, var(--c2) 22%, transparent)); stroke: color-mix(in srgb, var(--c1) 50%, var(--c2)); stroke-opacity: 0.4; transition: opacity 200ms; }
  .rib.faded, .arc.faded { opacity: 0.2; }
  .arc { fill: var(--c); transition: opacity 200ms; }
  .lab .ico { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .ln { font-size: 12.5px; font-weight: 650; fill: var(--ink); }
  .lc { font-size: 11px; fill: var(--muted); }
  .pc { font-size: 13px; font-weight: 700; fill: var(--ink); paint-order: stroke; stroke: var(--surface); stroke-width: 4px; pointer-events: none; }
  .cap { margin-top: 8px; }
</style>
