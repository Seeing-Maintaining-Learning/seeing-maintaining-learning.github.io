<script lang="ts">
  import MemoryBoard, { type Item } from './MemoryBoard.svelte';

  type Target = 'write' | 'maintenance' | 'retrieval';
  interface Episode {
    target: Target;
    observe: string;
    write: (m: Item[]) => Item[];
    task: string;
    outcome: string;
    ok: false;
    rule: string;
  }

  const TARGET_LABEL: Record<Target, string> = { write: 'Write policy', maintenance: 'Maintenance policy', retrieval: 'Retrieval policy' };

  const START: Item[] = [
    { id: 'map', text: 'Kitchen & living-room map', group: '' },
    { id: 'sofa', text: 'Sofa — living room', group: '' },
    { id: 'mug1', text: 'Mug — counter', group: '', note: 'Mon 08:10' },
  ];
  const START_RULES = ['Store large objects and rooms', 'Drop items unused for a day', 'Retrieve by similarity to the question'];

  const EPISODES: Episode[] = [
    {
      target: 'write',
      observe: 'The user drops their keys on the desk.',
      write: (m) => m,
      task: '“Where are my keys?”',
      outcome: 'Fails: small objects were never written to memory.',
      ok: false,
      rule: 'Also store small portable objects the user handles',
    },
    {
      target: 'maintenance',
      observe: 'Glasses are seen on the nightstand.',
      write: (m) => [...m, { id: 'glasses', text: 'Glasses — nightstand', group: '', state: 'new' }],
      task: '“Where did I leave my glasses?” (next day)',
      outcome: 'Fails: the record was forgotten after a day without use.',
      ok: false,
      rule: 'Keep items the user has asked about for a week',
    },
    {
      target: 'retrieval',
      observe: 'The mug is moved to the sink.',
      write: (m) => [...m, { id: 'mug2', text: 'Mug — sink', group: '', note: 'Tue 09:30', state: 'new' }],
      task: '“Where is the mug now?”',
      outcome: 'Fails: similarity search returns the older counter record.',
      ok: false,
      rule: 'For “where is X now”, prefer the most recent record',
    },
  ];
  const STEPS = ['Observe', 'Write with π', 'Use memory', 'Feedback updates π'] as const;

  let ep = $state(0);
  let step = $state(0);
  let memory = $state<Item[]>(START.map((i) => ({ ...i })));
  let rules = $state<{ text: string; v: number; target?: Target }[]>(START_RULES.map((text) => ({ text, v: 1 })));
  let version = $state(1);

  const e = $derived(EPISODES[ep]);
  const done = $derived(ep === EPISODES.length - 1 && step === 3);

  function next() {
    if (done) return;
    if (step === 3) {
      ep += 1;
      step = 0;
      memory = memory.map((i) => ({ ...i, state: undefined }));
      return;
    }
    step += 1;
    if (step === 1) {
      memory = e.write(memory.map((i) => ({ ...i, state: undefined })));
      if (ep > 0 && !memory.some((i) => i.id === 'keys'))
        memory = [...memory, { id: 'keys', text: 'Keys — desk', group: '', state: 'new', note: 'now kept by write policy v2' }];
    }
    if (step === 2) {
      if (e.target === 'maintenance') memory = memory.map((i) => (i.id === 'glasses' ? { ...i, state: 'fading', note: 'evicted after 1 day' } : i));
      if (e.target === 'retrieval') memory = memory.map((i) => (i.id === 'mug1' ? { ...i, state: 'hit', note: 'retrieved (stale)' } : i));
    }
    if (step === 3) {
      version += 1;
      rules = [...rules, { text: e.rule, v: version, target: e.target }];
      if (e.target === 'maintenance') memory = memory.filter((i) => i.id !== 'glasses');
    }
  }

  function reset() {
    ep = 0;
    step = 0;
    version = 1;
    memory = START.map((i) => ({ ...i }));
    rules = START_RULES.map((text) => ({ text, v: 1 }));
  }
</script>

<div class="loop">
  <div class="steps" role="list" aria-label="Episode steps">
    <span class="ep small">Episode {ep + 1} of {EPISODES.length} · {TARGET_LABEL[e.target]}</span>
    {#each STEPS as s, i (s)}
      <span role="listitem" class="step" class:on={i === step} class:past={i < step}>{i + 1}. {s}</span>
    {/each}
  </div>

  <div class="stage">
    <div class="left">
      <div class="card x" class:active={step === 0}>
        <p class="k">Experience x<sub>t</sub></p>
        <p>{e.observe}</p>
      </div>
      <div class="card f" class:active={step >= 2}>
        <p class="k">Task &amp; feedback f<sub>t</sub></p>
        {#if step >= 2}
          <p><strong>{e.task}</strong></p>
          <p class="bad">{e.outcome}</p>
        {:else}
          <p class="muted">Waiting for the next task…</p>
        {/if}
      </div>
      <div class="eq" aria-label="Update equations">
        <span class:hl={step === 1}>M<sub>t+1</sub> = U<sub>π<sub>t</sub></sub>(M<sub>t</sub>, x<sub>t</sub>)</span>
        <span class:hl={step === 3}>π<sub>t+1</sub> = E(π<sub>t</sub>, f<sub>t</sub>)</span>
      </div>
    </div>

    <MemoryBoard items={memory} label="Memory M" />

    <div class="card policy" class:active={step === 3}>
      <p class="k">Policy π <span class="v num">v{version}</span></p>
      <ol>
        {#each rules as r (r.text)}
          <li class:fresh={r.v === version && r.v > 1}>
            {r.text}
            {#if r.target}<span class="tag small">{TARGET_LABEL[r.target]}</span>{/if}
          </li>
        {/each}
      </ol>
    </div>
  </div>

  <div class="actions">
    <button class="btn primary" type="button" onclick={next} disabled={done}>
      {done ? 'All episodes run' : step === 3 ? 'Start next episode' : `Next: ${STEPS[step + 1]}`}
    </button>
    <button class="btn" type="button" onclick={reset}>Reset</button>
  </div>
</div>

<style>
  .loop { display: grid; gap: 16px; }
  .steps { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
  .ep { margin-right: 8px; font-weight: 600; }
  .step { font-size: 0.8125rem; padding: 4px 10px; border-radius: 999px; border: 1px solid var(--rule); color: var(--muted); }
  .step.past { color: var(--ink-2); }
  .step.on { background: var(--t3); border-color: var(--t3); color: var(--surface); }
  .stage { display: grid; grid-template-columns: 1fr 1.2fr 1fr; gap: 12px; align-items: start; }
  .left { display: grid; gap: 12px; }
  .card { background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 12px 14px; transition: border-color var(--dur-2) var(--ease), box-shadow var(--dur-2); }
  .card p { margin: 0 0 6px; font-size: 0.9375rem; }
  .card.active { border-color: var(--t3); box-shadow: 0 0 0 3px color-mix(in srgb, var(--t3) 18%, transparent); }
  .k { font-size: 0.75rem !important; color: var(--muted); }
  .bad { color: var(--ink-2); }
  .eq { display: grid; gap: 4px; font-family: var(--font-read); font-size: 1.0625rem; padding: 8px 4px; }
  .eq span { padding: 2px 6px; border-radius: 6px; transition: background var(--dur-2); }
  .eq .hl { background: color-mix(in srgb, var(--t3) 20%, transparent); }
  .policy ol { margin: 0; padding-left: 20px; display: grid; gap: 6px; font-size: 0.9375rem; }
  .policy li.fresh { color: var(--ink); font-weight: 600; }
  .v { font-weight: 650; color: var(--ink); margin-left: 4px; }
  .tag { display: block; color: var(--muted); font-weight: 400; }
  .actions { display: flex; gap: 8px; }
  .btn { font: inherit; padding: 8px 16px; border-radius: 999px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); cursor: pointer; }
  .btn.primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .btn:disabled { opacity: 0.5; cursor: default; }
  @media (max-width: 900px) { .stage { grid-template-columns: 1fr; } }
</style>
