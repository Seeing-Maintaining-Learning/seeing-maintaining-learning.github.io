<script lang="ts">
  import Frame from './Frame.svelte';
  let { step }: { step: number } = $props();
  const COLS = 6;
  const ROWS = 4;
  const cells = Array.from({ length: COLS * ROWS }, (_, i) => ({ c: i % COLS, r: Math.floor(i / COLS), i }));
  const hue = (i: number) => ['--m-image', '--m-video', '--m-audio', '--m-gui', '--m-embodied'][(i * 7) % 5];
  // After merging, 24 tokens collapse into 8 slots.
  const tokenPos = (i: number, merged: boolean) =>
    merged ? { x: 150 + (i % 8) * 16, y: 52 } : { x: 150 + (i % 12) * 13, y: 40 + Math.floor(i / 12) * 14 };
</script>

<svg viewBox="0 0 320 180">
  <Frame x={14} y={22} w={110} faded={step >= 1} />
  {#each cells as p (p.i)}
    {@const t = tokenPos(p.i, step >= 2)}
    <rect
      class="tok"
      width={step >= 1 ? 11 : 17}
      height={step >= 1 ? 11 : 17}
      rx="2"
      style="fill: var({hue(p.i)}); transform: translate({step === 0 ? 14 + p.c * 18 : t.x}px, {step === 0 ? 22 + p.r * 18 : t.y}px); opacity: {step === 0 ? 0 : step >= 2 && p.i >= 8 ? 0 : 0.9}; transition-delay: {p.i * 18}ms"
    />
  {/each}
  <text x="150" y="30" class="lbl" class:show={step >= 1}>{step >= 2 ? '8 merged tokens (was 24)' : '24 patch tokens'}</text>
  <!-- 3D room map -->
  <g class="room" class:show={step >= 3}>
    <path d="M150 150 L210 130 L290 150 L230 172 Z" class="floor" />
    <path d="M150 150 L150 96 L210 76 L210 130" class="wallp" />
    <circle cx="186" cy="138" r="5" class="pm" /><text x="194" y="134" class="lbl show">mug (1.42, 0.31, 0.93)</text>
    <circle cx="214" cy="152" r="4" class="pk" /><text x="222" y="160" class="lbl show">keys (1.71, 0.28)</text>
  </g>
</svg>

<style>
  .tok { transition: transform 700ms var(--ease), opacity 500ms var(--ease), width 500ms, height 500ms; }
  .lbl { font-size: 8px; fill: var(--muted); opacity: 0; transition: opacity 400ms; }
  .lbl.show { opacity: 1; }
  .room { opacity: 0; transition: opacity 600ms var(--ease); }
  .room.show { opacity: 1; }
  .floor { fill: color-mix(in srgb, var(--m-embodied) 14%, var(--surface)); stroke: var(--m-embodied); }
  .wallp { fill: none; stroke: var(--rule); }
  .pm { fill: var(--m-video); }
  .pk { fill: var(--m-gui); }
</style>
