<script lang="ts">
  import { onMount } from 'svelte';
  import Icon from '../Icon.svelte';
  import { reducedMotion, whileVisible } from './motion.ts';
  import type { Pt } from './heroLayout.ts';
  import { project, type P3 } from './sphereLayout.ts';
  import { MOD_VAR, sceneFor, type Design, type Label3, type LensKey, type Scene } from './scene3d.ts';

  let { points }: { points: Pt[] } = $props();

  const DESIGNS: { key: Design; label: string; hint: string }[] = [
    { key: 'A', label: 'A · Orbs, atom, planets', hint: 'Glass orbs · gyroscope orbits · planets' },
    { key: 'B', label: 'B · Orbs, galaxy, helix', hint: 'Glass orbs · spiral galaxy · time helix' },
    { key: 'C', label: 'C · Skyline', hint: 'Isometric dot columns' },
  ];
  const LENSES: { key: LensKey; label: string }[] = [
    { key: 'representation', label: 'Representation' },
    { key: 'management', label: 'Management tier' },
    { key: 'modality', label: 'Modality' },
  ];

  let design = $state<Design>('A');
  let lens = $state<LensKey>('representation');
  let colorBy = $state<'modality' | 'tier'>('modality');
  let paused = $state(false);
  let labels = $state<Label3[]>([]);
  let hover = $state<{ i: number; x: number; y: number } | null>(null);

  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;
  let labelEls: HTMLDivElement[] = [];
  let W = 0;
  let H = 0;
  let scene: Scene;
  let from3: P3[] = [];
  let morphT0 = -1e9;
  let clock = 0;
  let last = 0;
  let yaw = 0.5;
  let pitch = -0.2;
  let pitchTarget = -0.2;
  let vyaw = 0;
  let drag: { x: number; y: number; d: number } | null = null;
  let cur3: P3[] = [];
  let drawn: { x: number; y: number; r: number }[] = [];
  let colors: Record<string, string> = {};
  let dark = false;
  let sprites: Record<string, HTMLCanvasElement> = {};
  let visible = false;
  let raf = 0;
  const DUR = 1200;
  /** '#rrggbb' -> 'rgba(r,g,b,a)' (canvas does not reliably parse color-mix). */
  const rgba = (hex: string, a: number) => {
    const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
  };
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const VARS = ['--m-image', '--m-video', '--m-audio', '--m-gui', '--m-embodied', '--t1', '--t2', '--t3', '--ink', '--surface', '--bg'];

  function readColors() {
    const cs = getComputedStyle(box);
    colors = Object.fromEntries(VARS.map((v) => [v, cs.getPropertyValue(v).trim()]));
    dark = document.documentElement.dataset.theme === 'dark' || (!document.documentElement.dataset.theme && matchMedia('(prefers-color-scheme: dark)').matches);
    sprites = {};
    if (dark) {
      for (const v of VARS.slice(0, 8)) {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d')!;
        const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        grad.addColorStop(0, rgba(colors[v], 1));
        grad.addColorStop(1, rgba(colors[v], 0));
        g.globalAlpha = 0.55;
        g.fillStyle = grad;
        g.fillRect(0, 0, 32, 32);
        sprites[v] = c;
      }
    }
  }

  function setScene() {
    from3 = cur3.length ? cur3.map((p) => ({ ...p })) : [];
    scene = sceneFor(design, lens, points);
    pitchTarget = scene.pitch;
    morphT0 = reducedMotion() || !from3.length ? -1e9 : performance.now();
    labels = scene.labels(clock);
    labelEls = [];
    kick();
  }

  const colorOf = (p: Pt) => colors[colorBy === 'modality' ? MOD_VAR[p.modality] : `--t${p.tier[1]}`];

  function frame(now: number) {
    raf = 0;
    const ctx = canvas.getContext('2d');
    if (!ctx || !scene) return;
    const rm = reducedMotion();
    const animate = !paused && !rm && !hover;
    if (animate && last) clock += Math.min(50, now - last);
    last = now;
    if (!drag) {
      yaw += vyaw + (animate && scene.spin ? 0.0016 : 0);
      vyaw *= 0.93;
    }
    pitch += (pitchTarget - pitch) * 0.08;

    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const R = Math.min(W, H) * 0.4;
    const cx = W / 2;
    const cy = H / 2 + 6;
    const P = (p: P3) => project(p, yaw, pitch, cx, cy, R);

    // Decorations
    for (const d of scene.decor(clock)) {
      const col = colors[d.c] || colors['--ink'];
      ctx.save();
      if (d.kind === 'orb') {
        const c = P(d.c3);
        const persp = 1 / (1 + c.depth * 0.25);
        const r = d.r * R * persp;
        const g = ctx.createRadialGradient(c.x - r * 0.35, c.y - r * 0.4, r * 0.05, c.x, c.y, r);
        g.addColorStop(0, rgba(col, dark ? 0.3 : 0.22));
        g.addColorStop(0.7, rgba(col, dark ? 0.12 : 0.1));
        g.addColorStop(1, rgba(col, dark ? 0.28 : 0.18));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 0.7;
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.4;
        ctx.stroke();
        // specular highlight
        ctx.globalAlpha = dark ? 0.35 : 0.6;
        ctx.beginPath();
        ctx.ellipse(c.x - r * 0.38, c.y - r * 0.45, r * 0.22, r * 0.1, -0.6, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(255,255,255,0.5)' : '#fff';
        ctx.fill();
      } else if (d.kind === 'glow') {
        const c = P(d.c3);
        const r = d.r * R * 1.6;
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, r);
        g.addColorStop(0, rgba(col, dark ? 0.55 : 0.35));
        g.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(c.x - r, c.y - r, r * 2, r * 2);
      } else {
        ctx.globalAlpha = d.alpha;
        ctx.strokeStyle = col;
        ctx.lineWidth = d.width ?? 1.2;
        if (d.dash) ctx.setLineDash(d.dash);
        ctx.beginPath();
        d.pts.forEach((q, k) => {
          const s = P(q);
          if (k) ctx.lineTo(s.x, s.y);
          else ctx.moveTo(s.x, s.y);
        });
        ctx.stroke();
      }
      ctx.restore();
    }

    // Points: morph in 3D, then project
    const target = scene.at(clock);
    const t = ease(Math.min(1, (now - morphT0) / DUR));
    cur3 = target.map((p, i) => (from3[i] && t < 1 ? { x: from3[i].x + (p.x - from3[i].x) * t, y: from3[i].y + (p.y - from3[i].y) * t, z: from3[i].z + (p.z - from3[i].z) * t } : p));
    const items = cur3.map((p, i) => ({ i, s: P(p) })).sort((a, b) => b.s.depth - a.s.depth);
    drawn = new Array(points.length);
    for (const { i, s } of items) {
      const p = points[i];
      const f = (1 - Math.max(-1, Math.min(1, s.depth))) / 2;
      const r = 1.8 + f * 2.6;
      const col = colorOf(p);
      const v = colorBy === 'modality' ? MOD_VAR[p.modality] : `--t${p.tier[1]}`;
      if (dark && sprites[v]) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.5 + f * 0.5;
        const g = r * 4.2;
        ctx.drawImage(sprites[v], s.x - g, s.y - g, g * 2, g * 2);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 0.45 + f * 0.55;
      ctx.beginPath();
      ctx.arc(s.x, s.y, hover?.i === i ? r + 2.5 : r, 0, Math.PI * 2);
      if (colorBy === 'tier' && p.tier === 'T1') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = col;
        ctx.fill();
      }
      drawn[i] = { x: s.x, y: s.y, r };
    }
    ctx.globalAlpha = 1;

    // Labels follow their 3D anchors
    const ls = scene.labels(clock);
    ls.forEach((l, k) => {
      const el = labelEls[k];
      if (!el) return;
      const s = P(l.p);
      el.style.transform = `translate(${Math.min(W - 60, Math.max(60, s.x))}px, ${Math.max(14, Math.min(H - 14, s.y))}px) translate(-50%, -50%)`;
      el.style.opacity = String(0.55 + 0.45 * ((1 - Math.max(-1, Math.min(1, s.depth))) / 2));
    });

    const moving = (!paused && !rm && (scene.spin || clock >= 0)) || t < 1 || !!drag || Math.abs(vyaw) > 1e-4 || Math.abs(pitchTarget - pitch) > 1e-3;
    if (moving && visible) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (!raf && canvas) raf = requestAnimationFrame(frame);
  };

  function resize() {
    W = box.clientWidth;
    H = W < 640 ? 440 : 560;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    kick();
  }

  function pick(e: PointerEvent | MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = -1;
    let bd = 12 * 12;
    drawn.forEach((d, i) => {
      if (!d) return;
      const dist = (d.x - mx) ** 2 + (d.y - my) ** 2;
      if (dist < bd) {
        bd = dist;
        best = i;
      }
    });
    hover = best >= 0 ? { i: best, x: drawn[best].x, y: drawn[best].y } : null;
    canvas.style.cursor = hover ? 'pointer' : 'grab';
    kick();
  }

  onMount(() => {
    readColors();
    resize();
    setScene();
    const ro = new ResizeObserver(() => box.clientWidth !== W && resize());
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
    return () => {
      ro.disconnect();
      stop();
      window.removeEventListener('themechange', onTheme);
      mq.removeEventListener('change', onTheme);
      cancelAnimationFrame(raf);
    };
  });
</script>

<div class="l3d">
  <div class="bar">
    <div class="seg" role="group" aria-label="Design">
      {#each DESIGNS as d (d.key)}
        <button type="button" aria-pressed={design === d.key} title={d.hint} onclick={() => { design = d.key; setScene(); }}>{d.label}</button>
      {/each}
    </div>
  </div>
  <div class="bar">
    <div class="seg" role="group" aria-label="Lens">
      {#each LENSES as l (l.key)}
        <button type="button" aria-pressed={lens === l.key} onclick={() => { lens = l.key; setScene(); }}>{l.label}</button>
      {/each}
    </div>
    <div class="right">
      <div class="seg" role="group" aria-label="Color by">
        <button type="button" aria-pressed={colorBy === 'modality'} onclick={() => { colorBy = 'modality'; kick(); }}>Modality</button>
        <button type="button" aria-pressed={colorBy === 'tier'} onclick={() => { colorBy = 'tier'; kick(); }}>Tier</button>
      </div>
      <button class="pause" type="button" aria-pressed={paused} onclick={() => { paused = !paused; kick(); }}>{paused ? 'Resume' : 'Pause'} motion</button>
    </div>
  </div>

  <div class="stage" bind:this={box}>
    <canvas
      bind:this={canvas}
      role="img"
      aria-label="3D view of {points.length} memory systems"
      onpointerdown={(e) => { drag = { x: e.clientX, y: e.clientY, d: 0 }; vyaw = 0; kick(); }}
      onpointermove={(e) => {
        if (drag) {
          const dx = e.clientX - drag.x;
          const dy = e.clientY - drag.y;
          drag = { x: e.clientX, y: e.clientY, d: drag.d + Math.abs(dx) + Math.abs(dy) };
          yaw += dx * 0.008;
          pitchTarget = pitch = Math.max(-1.2, Math.min(0.6, pitch + dy * 0.006));
          vyaw = dx * 0.002;
          hover = null;
          kick();
        } else pick(e);
      }}
      onpointerup={(e) => {
        const click = drag && drag.d < 6;
        drag = null;
        if (click) {
          pick(e);
          if (hover) location.href = `/systems/${points[hover.i].id}/`;
        }
      }}
      onpointerleave={() => { drag = null; hover = null; kick(); }}
    ></canvas>
    {#each labels as l, k (l.text + k)}
      <div class="lab" bind:this={labelEls[k]} style="--c: var({l.c ?? '--ink'})">
        {#if l.icon}<span class="ic"><Icon name={l.icon} size={15} /></span>{/if}
        <span class="lt">{l.text}</span>
        {#if l.n >= 0}<span class="ln num">{l.n}</span>{/if}
      </div>
    {/each}
    {#if hover}
      {@const p = points[hover.i]}
      <div class="viz-tip" style="left:{Math.min(hover.x + 12, W - 240)}px; top:{hover.y + 12}px">
        <strong>{p.name}</strong>
        <div class="muted">{p.tier} · {p.modalityLabel} · {p.year}</div>
      </div>
    {/if}
    <p class="hint small">Drag to rotate · click a point to open it</p>
  </div>

  <ul class="legend">
    {#each ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'] as m (m)}
      <li class="mod-{m}"><span class="ic"><Icon name={m} size={14} /></span>{points.find((p) => p.modality === m)?.modalityLabel}</li>
    {/each}
  </ul>
</div>

<style>
  /* Lab palette: neon in dark mode, pastel fills with mid-tone marks in light mode. */
  .l3d { display: grid; gap: 10px; }
  :global(:root[data-theme='dark']) .l3d {
    --m-image: #4da3ff; --m-video: #ff8a4c; --m-audio: #2ee6a6; --m-gui: #ffd23f; --m-embodied: #ff6fb5;
    --t1: #b48cff; --t2: #3fd5ff; --t3: #ff5c6c;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme='light'])) .l3d {
      --m-image: #4da3ff; --m-video: #ff8a4c; --m-audio: #2ee6a6; --m-gui: #ffd23f; --m-embodied: #ff6fb5;
      --t1: #b48cff; --t2: #3fd5ff; --t3: #ff5c6c;
    }
  }
  .bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
  .right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .pause { font: inherit; font-size: var(--step--1); background: none; border: 1px solid var(--rule); color: var(--ink-2); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .stage {
    position: relative; border-radius: 18px; overflow: hidden; border: 1px solid var(--rule);
    background: radial-gradient(ellipse at 50% 40%, var(--surface) 0%, var(--surface-2) 100%);
  }
  :global(:root[data-theme='dark']) .stage { background: radial-gradient(ellipse at 50% 40%, #121a24 0%, #070a0e 100%); }
  @media (prefers-color-scheme: dark) { :global(:root:not([data-theme='light'])) .stage { background: radial-gradient(ellipse at 50% 40%, #121a24 0%, #070a0e 100%); } }
  canvas { display: block; width: 100%; touch-action: pan-y; cursor: grab; }
  .lab {
    position: absolute; left: 0; top: 0; pointer-events: none; display: inline-flex; align-items: center; gap: 6px; white-space: nowrap;
    padding: 4px 10px; border-radius: 999px; font-size: 0.8125rem; font-weight: 600; color: var(--ink);
    background: color-mix(in srgb, var(--surface) 78%, transparent); border: 1px solid color-mix(in srgb, var(--c) 55%, transparent);
    backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
  }
  .ic { color: var(--c); display: inline-flex; }
  .ln { color: var(--muted); font-weight: 500; }
  .hint { position: absolute; left: 16px; bottom: 10px; margin: 0; color: var(--muted); pointer-events: none; }
  .legend { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .legend li { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; font-size: var(--step--1); background: color-mix(in srgb, var(--c) 14%, var(--surface)); border: 1px solid color-mix(in srgb, var(--c) 40%, transparent); color: var(--ink); }
  .legend .ic { color: var(--c); }
</style>
