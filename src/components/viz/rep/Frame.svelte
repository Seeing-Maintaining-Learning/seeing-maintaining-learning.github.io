<script lang="ts">
  /** A small kitchen frame shared by all explainers. Rendered inside an <svg>. */
  let { x = 0, y = 0, w = 96, mugAt = 'counter', time = '08:10', faded = false }: {
    x?: number; y?: number; w?: number; mugAt?: 'counter' | 'sink'; time?: string; faded?: boolean;
  } = $props();
  const s = $derived(w / 96);
</script>

<g transform="translate({x} {y}) scale({s})" class="frame" class:faded>
  <rect width="96" height="64" rx="5" class="wall" />
  <rect y="42" width="96" height="22" class="counter" />
  <rect x="62" y="8" width="26" height="20" rx="2" class="win" />
  <rect x="70" y="40" width="20" height="6" rx="2" class="sink" />
  <g class="mug" style="transform: translate({mugAt === 'sink' ? 54 : 0}px, {mugAt === 'sink' ? -2 : 0}px)">
    <rect x="18" y="30" width="10" height="12" rx="2" /><path d="M28 33 q5 0 5 4 t-5 4" fill="none" stroke-width="2" />
  </g>
  <g class="keys"><circle cx="44" cy="40" r="2.6" /><rect x="46" y="39" width="7" height="2" rx="1" /></g>
  <text x="4" y="10" class="t">{time}</text>
</g>

<style>
  .frame { transition: opacity 500ms var(--ease); }
  .frame.faded { opacity: 0.12; }
  .wall { fill: var(--surface); stroke: var(--rule); }
  .counter { fill: color-mix(in srgb, var(--ink) 14%, var(--surface)); }
  .win { fill: color-mix(in srgb, var(--m-image) 30%, var(--surface)); }
  .sink { fill: color-mix(in srgb, var(--ink) 30%, var(--surface)); }
  .mug { transition: transform 700ms var(--ease); }
  .mug rect { fill: var(--m-video); }
  .mug path { stroke: var(--m-video); }
  .keys { fill: var(--m-gui); }
  .t { font-size: 7px; fill: var(--muted); font-family: var(--font-mono); }
</style>
