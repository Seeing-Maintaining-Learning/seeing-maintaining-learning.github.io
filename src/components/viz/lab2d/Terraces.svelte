<script lang="ts">
  import { ICONS } from '../../../data/icons.ts';
  import Dots from './Dots.svelte';
  import Frame from './Frame.svelte';
  import { MODS, TIERS, TIER_NAME, type ColorBy, type Pt } from './common.ts';

  let { points, colorBy }: { points: Pt[]; colorBy: ColorBy } = $props();
  let width = $state(900);
  let hover = $state<number | null>(null);
  let focus = $state<string | null>(null);
  const narrow = $derived(width < 640);
  const H = $derived(narrow ? 520 : 560);

  const STEP_TEXT: Record<string, string> = {
    T1: 'Memory is built once and reused',
    T2: 'Memory changes; the rules stay fixed',
    T3: 'Feedback rewrites the rules',
  };

  // Three rising terraces. Each has a top face (where dots stand) and a front face.
  const steps = $derived(
    TIERS.map((t, i) => {
      const x0 = width * (0.04 + i * 0.32);
      const x1 = x0 + width * 0.3;
      const top = H * (0.74 - i * 0.2);
      return { t, x0, x1, top, depth: narrow ? 26 : 38, front: H - top - 26 };
    }),
  );

  // Dots stand on each terrace in rows, ordered left→right by modality then date.
  const pos = $derived.by(() => {
    const out: ([number, number] | null)[] = points.map(() => null);
    const gap = narrow ? 7 : 10;
    for (const st of steps) {
      const idx = points.map((_, i) => i).filter((i) => points[i].tier === st.t)
        .sort((a, b) => MODS.indexOf(points[a].modality as never) - MODS.indexOf(points[b].modality as never) || points[a].t - points[b].t);
      const cols = Math.max(1, Math.floor((st.x1 - st.x0 - 16) / gap));
      idx.forEach((pi, k) => {
        const row = Math.floor(k / cols);
        const col = k % cols;
        // Isometric offset: later rows step up and slightly right, like standing on a stage.
        out[pi] = [st.x0 + 10 + col * gap + row * 2.2, st.top - 8 - row * gap * 0.8];
      });
    }
    return out;
  });
</script>

<Frame bind:width height={H} {points} {hover} {pos} label="Three terraces from static to self-evolving memory">
  {#each steps as st, i (st.t)}
    <g style="--c: var(--t{st.t[1]})" class:faded={focus && focus !== st.t} class="step" role="presentation" onpointerenter={() => (focus = st.t)} onpointerleave={() => (focus = null)}>
      <path d="M{st.x0},{st.top} L{st.x1},{st.top} L{st.x1 + st.depth * 0.6},{st.top - st.depth * 0.45} L{st.x0 + st.depth * 0.6},{st.top - st.depth * 0.45} Z" class="topf" />
      <rect x={st.x0} y={st.top} width={st.x1 - st.x0} height={H - st.top - 22} class="front" rx="3" />
      <path d="M{st.x1},{st.top} L{st.x1 + st.depth * 0.6},{st.top - st.depth * 0.45} L{st.x1 + st.depth * 0.6},{H - 22 - st.depth * 0.45} L{st.x1},{H - 22} Z" class="side" />
      <svg x={st.x0 + 14} y={st.top + 16} width="22" height="22" viewBox="0 0 24 24" class="ico">{@html ICONS[st.t]}</svg>
      <text x={st.x0 + 44} y={st.top + 32} class="sn">{TIER_NAME[st.t]}</text>
      <text x={st.x0 + 14} y={st.top + 60} class="sc num">{points.filter((p) => p.tier === st.t).length}</text>
      {#if !narrow}<text x={st.x0 + 14} y={st.top + 82} class="st">{STEP_TEXT[st.t]}</text>{/if}
      {#if i > 0}
        {@const prev = steps[i - 1]}
        <path d="M{prev.x1 - 30},{prev.top - 60} q 40 -50 {st.x0 - prev.x1 + 70} {st.top - prev.top + 10}" class="arrow" marker-end="url(#ah)" />
        <text x={(prev.x1 + st.x0) / 2 + 10} y={Math.min(prev.top, st.top) - 70} text-anchor="middle" class="al">{i === 1 ? 'memory starts changing' : 'the rules start changing'}</text>
      {/if}
    </g>
  {/each}
  <defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="ahp" /></marker></defs>
  <Dots {points} {pos} r={narrow ? 2.4 : 3.4} {colorBy} bind:hover dim={focus ? (p) => p.tier !== focus : null} />
</Frame>

<style>
  .step { transition: opacity 200ms; }
  .step.faded { opacity: 0.35; }
  .topf { fill: color-mix(in srgb, var(--c) 26%, var(--surface)); stroke: var(--c); stroke-width: 1; }
  .front { fill: color-mix(in srgb, var(--c) 12%, var(--surface)); stroke: color-mix(in srgb, var(--c) 60%, transparent); }
  .side { fill: color-mix(in srgb, var(--c) 30%, var(--surface-2)); }
  .ico { fill: none; stroke: var(--c); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
  .sn { font-size: 15px; font-weight: 700; fill: var(--ink); }
  .sc { font-size: 22px; font-weight: 700; fill: var(--c); }
  .st { font-size: 12px; fill: var(--ink-2); }
  .arrow { fill: none; stroke: var(--muted); stroke-width: 1.4; stroke-dasharray: 4 4; }
  .ahp { fill: var(--muted); }
  .al { font-size: 11.5px; fill: var(--muted); font-style: italic; }
</style>
