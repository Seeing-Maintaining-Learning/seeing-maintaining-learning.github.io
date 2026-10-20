<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion, whileVisible } from './motion.ts';
  import { layoutFor, type Lens, type Pt, type Group } from './heroLayout.ts';

  let { points, lenses }: { points: Pt[]; lenses: { key: Lens; label: string }[] } = $props();

  let lens = $state<Lens>('representation');
  let paused = $state(false);
  let groups = $state<Group[]>([]);
  let hover = $state<{ p: Pt; x: number; y: number } | null>(null);
  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let W = 0;
  let H = 0;

  type State = { x: number; y: number; fx: number; fy: number; tx: number; ty: number; t0: number; delay: number; phase: number };
  let st: State[] = [];
  let colors: Record<string, string> = {};
  let visible = false;
  let raf = 0;
  const DUR = 1100;

  const ease = (t: number) => 1 - Math.pow(1 - t, 4);

  function readColors() {
    const cs = getComputedStyle(box);
    colors = { T1: cs.getPropertyValue('--t1'), T2: cs.getPropertyValue('--t2'), T3: cs.getPropertyValue('--t3'), ring: cs.getPropertyValue('--bg'), ink: cs.getPropertyValue('--ink') };
  }

  function setLens(next: Lens, intro = false) {
    lens = next;
    const { pos, groups: g } = layoutFor(next, points, W, H);
    groups = g;
    const now = performance.now();
    const rm = reducedMotion();
    st = points.map((p, i) => {
      const prev = st[i];
      let fx = prev?.x ?? 0;
      let fy = prev?.y ?? 0;
      if (intro || !prev) {
        // Enter from the edge assigned to the point's modality.
        const edge = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'].indexOf(p.modality);
        const a = (edge / 5) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.5;
        const r = Math.max(W, H) * 0.75;
        fx = W / 2 + Math.cos(a) * r;
        fy = H / 2 + Math.sin(a) * r;
      }
      const [tx, ty] = pos[i];
      return { x: rm ? tx : fx, y: rm ? ty : fy, fx, fy, tx, ty, t0: now, delay: rm ? 0 : (intro ? 300 : 0) + (i % 60) * 6, phase: Math.random() * 6.28 };
    });
    kick();
  }

  function frame(now: number) {
    raf = 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let moving = false;
    const drift = !paused && !reducedMotion();
    for (let i = 0; i < st.length; i++) {
      const s = st[i];
      const t = Math.min(1, Math.max(0, (now - s.t0 - s.delay) / DUR));
      if (t < 1) moving = true;
      const e = ease(t);
      const jx = drift ? Math.sin(now / 1400 + s.phase) * 1.2 : 0;
      const jy = drift ? Math.cos(now / 1700 + s.phase) * 1.2 : 0;
      s.x = s.fx + (s.tx - s.fx) * e + jx * e;
      s.y = s.fy + (s.ty - s.fy) * e + jy * e;
      const p = points[i];
      const isHover = hover?.p.id === p.id;
      ctx.beginPath();
      ctx.arc(s.x, s.y, isHover ? 6.5 : 4, 0, Math.PI * 2);
      ctx.fillStyle = colors[p.tier];
      ctx.fill();
      ctx.lineWidth = isHover ? 2.5 : 1;
      ctx.strokeStyle = isHover ? colors.ink : colors.ring;
      ctx.stroke();
    }
    if ((moving || drift) && visible) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf && canvas) raf = requestAnimationFrame(frame);
  }

  function resize() {
    W = box.clientWidth;
    H = W < 640 ? 440 : 520;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    const { pos, groups: g } = layoutFor(lens, points, W, H);
    groups = g;
    st.forEach((s, i) => {
      [s.tx, s.ty] = pos[i];
      s.fx = s.tx;
      s.fy = s.ty;
    });
    kick();
  }

  function pick(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = -1;
    let bd = 12 * 12;
    st.forEach((s, i) => {
      const d = (s.x - mx) ** 2 + (s.y - my) ** 2;
      if (d < bd) {
        bd = d;
        best = i;
      }
    });
    hover = best >= 0 ? { p: points[best], x: st[best].x, y: st[best].y } : null;
    canvas.style.cursor = hover ? 'pointer' : 'default';
    kick();
  }

  onMount(() => {
    readColors();
    W = box.clientWidth;
    H = W < 640 ? 440 : 520;
    resize();
    const ro = new ResizeObserver(() => resize());
    ro.observe(box);
    const stop = whileVisible(box, (v) => {
      visible = v;
      if (v) kick();
    });
    const onTheme = () => {
      readColors();
      kick();
    };
    window.addEventListener('themechange', onTheme);
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', onTheme);
    setLens('representation', true);
    return () => {
      ro.disconnect();
      stop();
      window.removeEventListener('themechange', onTheme);
      mq.removeEventListener('change', onTheme);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="hero-field">
  <div class="bar">
    <div class="seg" role="group" aria-label="Arrange systems by">
      {#each lenses as l (l.key)}
        <button type="button" aria-pressed={lens === l.key} onclick={() => setLens(l.key)}>{l.label}</button>
      {/each}
    </div>
    <div class="right">
      <span class="key small">
        <span class="k tier-T1"><i></i>T1 static</span>
        <span class="k tier-T2"><i></i>T2 dynamic</span>
        <span class="k tier-T3"><i></i>T3 self-evolving</span>
      </span>
      <button class="pause" type="button" aria-pressed={paused} onclick={() => { paused = !paused; kick(); }}>
        {paused ? 'Resume motion' : 'Pause motion'}
      </button>
    </div>
  </div>
  <div class="stage" bind:this={box}>
    <canvas
      bind:this={canvas}
      aria-label="Each dot is one of {points.length} multimodal agent memory systems, colored by management tier. Browse them as a list on the Systems page."
      role="img"
      onpointermove={pick}
      onpointerleave={() => { hover = null; kick(); }}
      onclick={() => hover && (location.href = `/systems/${hover.p.id}/`)}
    ></canvas>
    {#each groups as g (g.key)}
      <div class="glabel" style="left:{g.x}px; top:{g.y}px; text-align:{g.align ?? 'center'}">
        <span class="gl">{g.label}</span>
        <span class="gn num">{g.n}</span>
      </div>
    {/each}
    {#if hover}
      <div class="viz-tip" style="left:{Math.min(hover.x + 12, W - 240)}px; top:{hover.y + 12}px">
        <strong>{hover.p.name}</strong>
        <div class="muted">{hover.p.tier} · {hover.p.modalityLabel} · {hover.p.year}</div>
      </div>
    {/if}
  </div>
</div>

<style>
  .hero-field { display: grid; gap: 12px; }
  .bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
  .right { display: flex; gap: 14px; align-items: center; flex-wrap: wrap; }
  .key { display: flex; gap: 12px; color: var(--ink-2); }
  .k { display: inline-flex; align-items: center; gap: 6px; }
  .k i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); }
  .pause { font: inherit; font-size: var(--step--1); background: none; border: 1px solid var(--rule); color: var(--ink-2); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .stage { position: relative; border-radius: 16px; background: var(--surface); border: 1px solid var(--rule); overflow: hidden; }
  canvas { display: block; width: 100%; touch-action: pan-y; }
  .glabel { position: absolute; transform: translate(-50%, 0); pointer-events: none; display: flex; flex-direction: column; align-items: center; max-width: 180px; line-height: 1.2; text-align: center; }
  .gl { font-size: 0.8125rem; font-weight: 600; color: var(--ink); text-wrap: balance; }
  .gn { font-size: 0.75rem; color: var(--muted); }
  @media (max-width: 640px) { .gl { font-size: 0.6875rem; } .glabel { max-width: 120px; } .key { display: none; } }
</style>
