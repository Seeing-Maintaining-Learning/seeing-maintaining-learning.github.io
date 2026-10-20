<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion, whileVisible } from './motion.ts';

  interface Paper { id: string; name: string; title: string; modality: string; tier: string; t: number; date: string }
  let { papers, lanes }: { papers: Paper[]; lanes: { key: string; label: string }[] } = $props();

  const T0 = 2023;
  const T1 = 2026.95;
  const M = { l: 132, r: 20, t: 18, b: 34 };
  const LANE_H = 54;
  const H = M.t + M.b + LANE_H * lanes.length;

  let W = $state(900);
  let now = $state(T1);
  let playing = $state(false);
  let colorBy = $state<'modality' | 'tier'>('modality');
  let hover = $state<{ p: Paper; x: number; y: number } | null>(null);
  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let visible = false;
  let raf = 0;
  let last = 0;
  let colors: Record<string, string> = {};

  const narrow = $derived(W < 640);
  const left = $derived(narrow ? 22 : M.l + 10);
  const x = (t: number) => left + ((Math.max(T0, t) - T0) / (T1 - T0)) * (W - left - M.r);
  const laneIdx = new Map(lanes.map((l, i) => [l.key, i]));
  // Stable vertical jitter inside a lane.
  const jit = (id: string) => {
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
    return ((Math.abs(h) % 1000) / 1000 - 0.5) * (LANE_H - 18);
  };
  const pos = papers.map((p) => ({ p, j: jit(p.id), li: laneIdx.get(p.modality) ?? 0 }));
  const laneY = (i: number) => M.t + LANE_H * i + LANE_H / 2;
  const counts = $derived(lanes.map((l) => papers.filter((p) => p.modality === l.key && p.t <= now).length));
  const total = $derived(counts.reduce((a, b) => a + b, 0));
  const nowLabel = $derived(() => {
    const y = Math.floor(now);
    const m = Math.min(11, Math.floor((now - y) * 12));
    return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]} ${y}`;
  });

  const VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied', T1: '--t1', T2: '--t2', T3: '--t3' };
  function readColors() {
    const cs = getComputedStyle(box);
    colors = Object.fromEntries(Object.entries(VAR).map(([k, v]) => [k, cs.getPropertyValue(v).trim()]));
    colors.rule = cs.getPropertyValue('--rule').trim();
    colors.ink = cs.getPropertyValue('--ink').trim();
  }

  function draw() {
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = colors.rule;
    ctx.lineWidth = 1;
    lanes.forEach((_, i) => {
      ctx.beginPath();
      ctx.moveTo(left, laneY(i) + LANE_H / 2);
      ctx.lineTo(W - M.r, laneY(i) + LANE_H / 2);
      ctx.stroke();
    });
    for (const { p, j, li } of pos) {
      if (p.t > now) continue;
      const age = now - p.t;
      const fresh = Math.max(0, 1 - age / 0.12); // recently "arrived" papers glow
      const col = colors[colorBy === 'modality' ? p.modality : p.tier];
      const cx = x(p.t);
      const cy = laneY(li) + j;
      const r = 3.2 + fresh * 3;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, hover?.p.id === p.id ? r + 2.5 : r, 0, Math.PI * 2);
      if (colorBy === 'tier' && p.tier === 'T1') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = col;
        ctx.fill();
      }
      if (fresh > 0) {
        ctx.globalAlpha = fresh * 0.35;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 6 * fresh, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    // "now" cursor
    ctx.strokeStyle = colors.ink;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(x(now), M.t - 6);
    ctx.lineTo(x(now), H - M.b + 4);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function tick(ts: number) {
    raf = 0;
    if (playing && visible) {
      const dt = last ? Math.min(64, ts - last) : 16;
      now = Math.min(T1, now + dt * 0.00022);
      if (now >= T1) playing = false;
    }
    last = ts;
    draw();
    if (playing && visible) raf = requestAnimationFrame(tick);
  }
  const kick = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  function play() {
    if (now >= T1 - 0.01) now = T0;
    playing = !playing;
    last = 0;
    kick();
  }

  function onMove(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best: (typeof pos)[number] | null = null;
    let bd = 10 * 10;
    for (const q of pos) {
      if (q.p.t > now) continue;
      const d = (x(q.p.t) - mx) ** 2 + (laneY(q.li) + q.j - my) ** 2;
      if (d < bd) {
        bd = d;
        best = q;
      }
    }
    hover = best ? { p: best.p, x: x(best.p.t), y: laneY(best.li) + best.j } : null;
    canvas.style.cursor = hover ? 'pointer' : 'default';
    kick();
  }

  function resize() {
    W = box.clientWidth;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    kick();
  }

  onMount(() => {
    readColors();
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    let started = false;
    const stop = whileVisible(box, (v) => {
      visible = v;
      if (v && !started && !reducedMotion()) {
        started = true;
        now = T0;
        playing = true;
        last = 0;
      }
      kick();
    });
    const onTheme = () => {
      readColors();
      kick();
    };
    window.addEventListener('themechange', onTheme);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onTheme);
    return () => {
      ro.disconnect();
      stop();
      window.removeEventListener('themechange', onTheme);
      cancelAnimationFrame(raf);
    };
  });

  $effect(() => {
    void colorBy;
    void now;
    kick();
  });
</script>

<div class="river">
  <div class="bar">
    <button class="play" type="button" onclick={play} aria-label={playing ? 'Pause timeline' : 'Play timeline'}>
      {playing ? '❚❚ Pause' : now >= T1 - 0.01 ? '↺ Replay' : '▶ Play'}
    </button>
    <label class="scrub">
      <span class="sr-only">Show papers up to</span>
      <input type="range" min={T0} max={T1} step="0.01" bind:value={now} oninput={() => (playing = false)} />
    </label>
    <span class="now num"><strong>{nowLabel()}</strong> · {total} systems</span>
    <div class="seg" role="group" aria-label="Color by">
      <button type="button" aria-pressed={colorBy === 'modality'} onclick={() => (colorBy = 'modality')}>Modality</button>
      <button type="button" aria-pressed={colorBy === 'tier'} onclick={() => (colorBy = 'tier')}>Tier</button>
    </div>
  </div>
  <div class="wrapc" bind:this={box}>
    <canvas
      bind:this={canvas}
      style="height:{H}px"
      role="img"
      aria-label="Timeline of {papers.length} systems by publication date, one lane per modality"
      onpointermove={onMove}
      onpointerleave={() => { hover = null; kick(); }}
      onclick={(e) => { onMove(e as unknown as PointerEvent); if (hover) location.href = `/systems/${hover.p.id}/`; }}
    ></canvas>
    {#each lanes as l, i (l.key)}
      <div class="lane mod-{l.key}" class:narrow style="top:{laneY(i) - (narrow ? LANE_H / 2 - 2 : 10)}px">
        <span class="dot"></span>{l.label} <span class="num c">{counts[i]}</span>
      </div>
    {/each}
    {#each [2023, 2024, 2025, 2026] as y (y)}
      <span class="yr num small" style="left:{x(y)}px; top:{H - M.b + 8}px">{y}</span>
    {/each}
    {#if hover}
      <div class="viz-tip" style="left:{Math.min(hover.x + 12, W - 270)}px; top:{hover.y + 12}px">
        <strong>{hover.p.name}</strong>
        <div>{hover.p.title}</div>
        <div class="muted">{hover.p.tier} · {hover.p.date}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .river { display: grid; gap: 12px; }
  .bar { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
  .play { font: inherit; font-size: var(--step--1); padding: 6px 14px; border-radius: 999px; border: 1px solid var(--ink); background: var(--ink); color: var(--bg); cursor: pointer; min-width: 92px; }
  .scrub { flex: 1; min-width: 160px; display: flex; }
  .scrub input { width: 100%; accent-color: var(--accent); }
  .now { font-size: var(--step--1); color: var(--ink-2); min-width: 150px; }
  .wrapc { position: relative; background: var(--surface); border: 1px solid var(--rule); border-radius: 14px; overflow: hidden; }
  canvas { display: block; width: 100%; }
  .lane { position: absolute; left: 12px; display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--ink-2); pointer-events: none; }
  .lane .dot { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .lane .c { color: var(--ink); font-weight: 650; }
  .lane.narrow { font-size: 0.75rem; background: color-mix(in srgb, var(--surface) 80%, transparent); padding: 0 4px; border-radius: 4px; }
  .yr { position: absolute; transform: translateX(-50%); color: var(--muted); }
</style>
