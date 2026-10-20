<script lang="ts">
  import { ICONS } from '../data/icons.ts';
  let { name, size = 16, label = '' }: { name: string; size?: number; label?: string } = $props();
</script>

<svg
  class="icon"
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
  role={label ? 'img' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
>{@html ICONS[name] ?? ''}</svg>

<style>
  .icon { flex: none; display: inline-block; vertical-align: middle; }
</style>
