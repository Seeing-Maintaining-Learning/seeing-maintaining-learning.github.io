<script lang="ts">
  import { onMount } from 'svelte';
  import { reducedMotion, whileVisible } from './motion.ts';
  import { layoutFor, type Lens, type Pt, type Group } from './heroLayout.ts';
  import { project, spherePoints, wireframe } from './sphereLayout.ts';

  type View = 'sphere' | Lens;
  let { points, lenses, modalities }: {
    points: Pt[];
    lenses: { key: Lens; label: string }[];
    modalities: { key: string; label: string; n: number }[];
  } = $props();

  let view = $state<View>('sphere');
  let colorBy = $state<'modality' | 'tier'>('modality');
  let paused = $state(false);
  let pinnedMod = $state<string | null>(null);
  let hoverMod = $state<string | null>(null);
  const focusMod = $derived(hoverMod ?? pinnedMod);
  let groups = $state<Group[]>([]);
  let hover = $state<{ i: number; x: number; y: number } | null>(null);
  let box: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  let W = 0;
  let H = 0;
  const DUR = 1100;
  const ease = (t: number) => 1 - Math.pow(1 - t, 4);
  const { pts: sphere, arms } = spherePoints(points);
  const wire = wireframe();
  let yaw = 0.6;
  let pitch = -0.25;
  let vyaw = 0;
  let vpitch = 0;
  let drag: { x: number; y: number } | null = null;
  let dragDist = 0;
  // Blend between sphere (0) and flat layout (1), plus a tween between flat layouts.
  let blend = { from: 0, to: 0, t0: 0 };
  let flatFrom: [number, number][] = [];
  let flatTo: [number, number][] = [];
  let flatT0 = 0;
  let introT0 = 0;
  let introFrom: [number, number][] = [];
  let drawn: { x: number; y: number; r: number }[] = [];
  let colors: Record<string, string> = {};
  let visible = false;
  let raf = 0;

  const MODS = ['image', 'video_streaming', 'audio_speech', 'gui', 'embodied_3d'];
  const VAR: Record<string, string> = { image: '--m-image', video_streaming: '--m-video', audio_speech: '--m-audio', gui: '--m-gui', embodied_3d: '--m-embodied', T1: '--t1', T2: '--t2', T3: '--t3' };

  function readColors() {
    const cs = getComputedStyle(box);
    colors = Object.fromEntries(Object.entries(VAR).map(([k, v]) => [k, cs.getPropertyValue(v).trim()]));
    colors.bg = cs.getPropertyValue('--surface').trim();
    colors.ink = cs.getPropertyValue('--ink').trim();
  }

  const flat = (v: View) => (v === 'sphere' ? null : layoutFor(v, points, W, H));

  function setView(next: View) {
    const now = performance.now();
    const rm = reducedMotion();
    const cur = currentFlat(now);
    const curBlend = blendAt(now);
    view = next;
    const f = flat(next);
    groups = f ? f.groups : [];
    if (f) {
      flatFrom = curBlend > 0.01 ? cur : f.pos;
      flatTo = f.pos;
      flatT0 = rm ? -1e9 : now;
    }
    blend = { from: rm ? (next === 'sphere' ? 0 : 1) : curBlend, to: next === 'sphere' ? 0 : 1, t0: now };
    kick();
  }

  function blendAt(now: number) {
    const t = Math.min(1, (now - blend.t0) / DUR);
    return blend.from + (blend.to - blend.from) * ease(t);
  }
  function currentFlat(now: number): [number, number][] {
    if (!flatTo.length) return [];
    const t = ease(Math.min(1, (now - flatT0) / DUR));
    return flatTo.map((p, i) => [flatFrom[i][0] + (p[0] - flatFrom[i][0]) * t, flatFrom[i][1] + (p[1] - flatFrom[i][1]) * t]);
  }

  function frame(now: number) {
    raf = 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const rm = reducedMotion();
    const spin = !paused && !rm && !drag && !hover && view === 'sphere';
    if (!drag) {
      yaw += vyaw + (spin ? 0.0022 : 0);
      pitch = Math.max(-1.1, Math.min(1.1, pitch + vpitch));
      vyaw *= 0.94;
      vpitch *= 0.94;
    }
    const b = blendAt(now);
    const fl = currentFlat(now);
    const intro = rm ? 1 : ease(Math.min(1, Math.max(0, (now - introT0) / 1600)));
    const R = Math.min(W, H) * 0.43;
    const items = points.map((p, i) => {
      const s = project(sphere[i], yaw, pitch, W / 2, H / 2, R);
      let x = s.x;
      let y = s.y;
      if (intro < 1) {
        x = introFrom[i][0] + (x - introFrom[i][0]) * intro;
        y = introFrom[i][1] + (y - introFrom[i][1]) * intro;
      }
      if (b > 0 && fl.length) {
        x = x + (fl[i][0] - x) * b;
        y = y + (fl[i][1] - y) * b;
      }
      const d = s.depth * (1 - b);
      return { i, x, y, d };
    });
    // Wireframe and arm lines fade out as points flatten into a lens layout.
    if (b < 0.99) {
      ctx.globalAlpha = 0.09 * (1 - b) * intro;
      ctx.strokeStyle = colors.ink;
      ctx.lineWidth = 1;
      for (const line of wire) {
        ctx.beginPath();
        line.forEach((q, k) => {
          const s = project(q, yaw, pitch, W / 2, H / 2, R);
          if (k) ctx.lineTo(s.x, s.y);
          else ctx.moveTo(s.x, s.y);
        });
        ctx.stroke();
      }
      const pos = new Map(items.map((it) => [it.i, it]));
      ctx.lineWidth = 1.2;
      for (const arm of arms) {
        const p0 = points[arm[0]];
        if (focusMod && p0.modality !== focusMod) continue;
        ctx.strokeStyle = colors[colorBy === 'modality' ? p0.modality : 'T2'];
        ctx.globalAlpha = 0.22 * (1 - b) * intro;
        ctx.beginPath();
        arm.forEach((pi, k) => {
          const q = pos.get(pi)!;
          if (k) ctx.lineTo(q.x, q.y);
          else ctx.moveTo(q.x, q.y);
        });
        ctx.stroke();
      }
    }
    items.sort((a, c) => c.d - a.d);
    drawn = new Array(points.length);
    for (const it of items) {
      const p = points[it.i];
      const depthF = (1 - it.d) / 2; // 0 back .. 1 front
      const r = (2.2 + depthF * 2.6) * (1 - b) + 4 * b;
      const dim = focusMod && p.modality !== focusMod ? 0.12 : 1;
      ctx.globalAlpha = (0.35 + depthF * 0.65 * (1 - b) + 0.65 * b) * dim;
      const col = colors[colorBy === 'modality' ? p.modality : p.tier];
      const isHover = hover?.i === it.i;
      ctx.beginPath();
      ctx.arc(it.x, it.y, isHover ? r + 2.5 : r, 0, Math.PI * 2);
      if (colorBy === 'tier' && p.tier === 'T1') {
        ctx.strokeStyle = col;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      } else {
        ctx.fillStyle = col;
        ctx.fill();
        if (colorBy === 'tier' && p.tier === 'T3') {
          ctx.globalAlpha *= 0.35;
          ctx.beginPath();
          ctx.arc(it.x, it.y, r + 3, 0, Math.PI * 2);
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }
      if (isHover) {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      drawn[it.i] = { x: it.x, y: it.y, r };
    }
    ctx.globalAlpha = 1;
    const moving = spin || Math.abs(vyaw) + Math.abs(vpitch) > 1e-4 || now - blend.t0 < DUR || now - flatT0 < DUR || intro < 1 || !!drag;
    if (moving && visible) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (!raf && canvas) raf = requestAnimationFrame(frame);
  }

  function resize(force = false) {
    if (!force && box.clientWidth === W) return;
    W = box.clientWidth;
    H = W < 640 ? 420 : 540;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.height = `${H}px`;
    const f = flat(view);
    if (f) {
      groups = f.groups;
      flatFrom = f.pos;
      flatTo = f.pos;
    }
    kick();
  }

  function pick(e: PointerEvent | MouseEvent) {
    const r = canvas.getBoundingClientRect();
    const mx = e.clientX - r.left;
    const my = e.clientY - r.top;
    let best = -1;
    let bd = 14 * 14;
    drawn.forEach((d, i) => {
      if (!d) return;
      const dist = (d.x - mx) ** 2 + (d.y - my) ** 2;
      if (dist < bd) {
        bd = dist;
        best = i;
      }
    });
    hover = best >= 0 ? { i: best, x: drawn[best].x, y: drawn[best].y } : null;
    canvas.style.cursor = hover ? 'pointer' : view === 'sphere' ? 'grab' : 'default';
  }

  function down(e: PointerEvent) {
    if (view !== 'sphere') return;
    drag = { x: e.clientX, y: e.clientY };
    dragDist = 0;
    vyaw = 0;
    vpitch = 0;
    kick();
  }
  function move(e: PointerEvent) {
    if (drag) {
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      dragDist += Math.abs(dx) + Math.abs(dy);
      yaw += dx * 0.008;
      pitch = Math.max(-1.1, Math.min(1.1, pitch + dy * 0.008));
      vyaw = dx * 0.002;
      vpitch = dy * 0.002;
      drag = { x: e.clientX, y: e.clientY };
      hover = null;
    } else {
      pick(e);
    }
    kick();
  }
  function up(e: PointerEvent) {
    const wasDrag = dragDist > 6;
    drag = null;
    dragDist = 0;
    if (!wasDrag) {
      pick(e);
      if (hover) location.href = `/systems/${points[hover.i].id}/`;
    }
    kick();
  }

  onMount(() => {
    readColors();
    resize(true);
    const edge = (m: string) => {
      const a = (Math.max(0, MODS.indexOf(m)) / 5) * Math.PI * 2 - Math.PI / 2;
      return [W / 2 + Math.cos(a) * W * 0.7, H / 2 + Math.sin(a) * H * 0.9] as [number, number];
    };
    introFrom = points.map((p) => edge(p.modality));
    introT0 = performance.now() + 200;
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
    kick();
    return () => {
      ro.disconnect();
      stop();
      window.removeEventListener('themechange', onTheme);
      mq.removeEventListener('change', onTheme);
      cancelAnimationFrame(raf);
    };
  });

  const tierN = (t: string) => points.filter((p) => p.tier === t).length;
</script>

<div class="ms">
  <div class="bar">
    <div class="seg" role="group" aria-label="Arrange systems">
      <button type="button" aria-pressed={view === 'sphere'} onclick={() => setView('sphere')}>Sphere</button>
      {#each lenses as l (l.key)}
        <button type="button" aria-pressed={view === l.key} onclick={() => setView(l.key)}>{l.label}</button>
      {/each}
    </div>
    <div class="right">
      <div class="seg" role="group" aria-label="Color by">
        <button type="button" aria-pressed={colorBy === 'modality'} onclick={() => { colorBy = 'modality'; kick(); }}>Modality</button>
        <button type="button" aria-pressed={colorBy === 'tier'} onclick={() => { colorBy = 'tier'; kick(); }}>Tier</button>
      </div>
      <button class="pause" type="button" aria-pressed={paused} onclick={() => { paused = !paused; kick(); }}>
        {paused ? 'Resume' : 'Pause'} motion
      </button>
    </div>
  </div>

  <div class="stage" bind:this={box}>
    <canvas
      bind:this={canvas}
      role="img"
      aria-label="{points.length} multimodal agent memory systems as points on a rotating sphere, one spiral arm per modality. Use the Systems page for a full list."
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointerleave={() => { drag = null; hover = null; kick(); }}
    ></canvas>
    {#each groups as g (g.key)}
      <div class="glabel" style="left:{g.x}px; top:{g.y}px">
        <span class="gl">{g.label}</span><span class="gn num">{g.n}</span>
      </div>
    {/each}
    {#if view === 'sphere'}<p class="hint small">Drag to rotate · click a point to open it</p>{/if}
    {#if hover}
      {@const p = points[hover.i]}
      <div class="viz-tip" style="left:{Math.min(hover.x + 12, W - 240)}px; top:{hover.y + 12}px">
        <strong>{p.name}</strong>
        <div class="muted">{p.tier} · {p.modalityLabel} · {p.year}</div>
      </div>
    {/if}
  </div>

  <ul class="legend">
    {#if colorBy === 'modality'}
      {#each modalities as m (m.key)}
        <li>
          <button
            type="button"
            class="chip mod-{m.key}"
            aria-pressed={pinnedMod === m.key}
            onclick={() => { pinnedMod = pinnedMod === m.key ? null : m.key; hoverMod = null; kick(); }}
            onpointerenter={(e) => { if (e.pointerType === 'mouse') { hoverMod = m.key; kick(); } }}
            onpointerleave={() => { hoverMod = null; kick(); }}
          ><span class="dot"></span>{m.label} <span class="num muted">{m.n}</span></button>
        </li>
      {/each}
    {:else}
      {#each ['T1', 'T2', 'T3'] as t (t)}
        <li><span class="chip tier-{t}"><span class="dot"></span>{t} <span class="num muted">{tierN(t)}</span></span></li>
      {/each}
    {/if}
  </ul>
</div>

<style>
  .ms { display: grid; gap: 12px; }
  .bar { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 10px; align-items: center; }
  .right { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
  .pause { font: inherit; font-size: var(--step--1); background: none; border: 1px solid var(--rule); color: var(--ink-2); border-radius: 999px; padding: 4px 12px; cursor: pointer; }
  .stage {
    position: relative; border-radius: 18px; overflow: hidden; border: 1px solid var(--rule);
    background: radial-gradient(ellipse at 50% 45%, var(--surface) 0%, var(--surface) 35%, var(--surface-2) 100%);
  }
  canvas { display: block; width: 100%; touch-action: pan-y; cursor: grab; }
  .glabel { position: absolute; transform: translate(-50%, 0); pointer-events: none; display: flex; flex-direction: column; align-items: center; max-width: 180px; text-align: center; line-height: 1.2; }
  .gl { font-size: 0.8125rem; font-weight: 600; color: var(--ink); text-wrap: balance; }
  .gn { font-size: 0.75rem; color: var(--muted); }
  .hint { position: absolute; left: 16px; bottom: 10px; margin: 0; color: var(--muted); pointer-events: none; }
  .legend { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .legend button.chip { font: inherit; font-size: var(--step--1); cursor: pointer; }
  .legend button.chip[aria-pressed='true'] { border-color: var(--c); }
  @media (max-width: 640px) { .gl { font-size: 0.75rem; } .glabel { max-width: 120px; } }
</style>
