<script lang="ts">
  import MemoryBoard, { type Item } from './MemoryBoard.svelte';
  import T3Loop from './T3Loop.svelte';

  type Op = 'update' | 'consolidation' | 'revision' | 'reorganization' | 'forgetting';
  let {
    tierText,
    opText,
    opCounts,
    tierCounts,
  }: {
    tierText: Record<string, { title: string; question: string; change: string }>;
    opText: Record<Op, { definition: string; examples: { name: string; href: string | null }[] }>;
    opCounts: Record<string, number>;
    tierCounts: Record<string, number>;
  } = $props();

  let tier = $state<'T1' | 'T2' | 'T3'>('T1');

  // ---------- T1: fixed memory ----------
  const T1_START: Item[] = [
    { id: 'map', text: 'Kitchen & living-room map', group: 'Places' },
    { id: 'mug', text: 'Mug — counter', group: 'Objects' },
    { id: 'keys', text: 'Keys — hallway table', group: 'Objects' },
    { id: 'tea', text: 'User drinks tea at 8am', group: 'Routines' },
    { id: 'dock', text: 'Charging dock — living room', group: 'Places' },
  ];
  let t1 = $state<Item[]>(T1_START.map((i) => ({ ...i })));
  let t1Answer = $state('');
  let t1Moved = $state(false);

  function t1Ask() {
    t1 = t1.map((i) => ({ ...i, state: i.id === 'keys' ? (t1Moved ? 'stale' : 'hit') : undefined }));
    t1Answer = t1Moved
      ? 'Answer: “On the hallway table.” Wrong — the keys moved, but static memory was never updated.'
      : 'Answer: “On the hallway table.” Retrieval selects the relevant entry; nothing is written.';
  }
  function t1Observe() {
    t1Moved = true;
    t1 = t1.map((i) => ({ ...i, state: undefined }));
    t1Answer = 'New observation: keys are now on the desk. Static memory does not change after formation.';
  }
  function t1Reset() {
    t1 = T1_START.map((i) => ({ ...i }));
    t1Answer = '';
    t1Moved = false;
  }

  // ---------- T2: fixed policy, changing memory ----------
  const T2_START: Item[] = [
    { id: 'map', text: 'Kitchen & living-room map', group: 'Places' },
    { id: 'keys', text: 'Keys — hallway table', group: 'Objects', note: 'Mon' },
    { id: 'tea1', text: 'Tea at 8:02', group: 'Routines', note: 'Mon' },
    { id: 'tea2', text: 'Tea at 7:58', group: 'Routines', note: 'Tue' },
    { id: 'tea3', text: 'Tea at 8:05', group: 'Routines', note: 'Wed' },
    { id: 'dock', text: 'Charging dock — living room', group: 'Places', note: 'unused 30 days' },
  ];
  let t2 = $state<Item[]>(T2_START.map((i) => ({ ...i })));
  let grouped = $state(false);
  let applied = $state<Op[]>([]);
  let lastOp = $state<Op | null>(null);

  const clearMarks = (items: Item[]) => items.map((i) => ({ ...i, state: undefined }));

  const OPS: Record<Op, (m: Item[]) => Item[]> = {
    update: (m) => [...m, { id: 'keys-new', text: 'Keys — desk', group: 'Objects', note: 'seen Thu 10:42', state: 'new' }],
    consolidation: (m) => [
      ...m.filter((i) => !i.id.startsWith('tea')),
      { id: 'routine', text: 'Routine: tea around 8am on weekdays', group: 'Routines', state: 'merged', note: 'merged from 3 records' },
    ],
    revision: (m) => {
      const hasNew = m.some((i) => i.id === 'keys-new');
      return hasNew
        ? m.filter((i) => i.id !== 'keys').map((i) => (i.id === 'keys-new' ? { ...i, state: 'revised', note: 'conflict resolved: newer wins' } : i))
        : m.map((i) => (i.id === 'keys' ? { ...i, text: 'Keys — desk', state: 'revised', note: 'was: hallway table' } : i));
    },
    reorganization: (m) => m,
    forgetting: (m) => m.filter((i) => i.id !== 'dock'),
  };

  function applyOp(op: Op) {
    lastOp = op;
    if (op === 'reorganization') {
      grouped = true;
      t2 = clearMarks(t2);
    } else {
      t2 = OPS[op](clearMarks(t2));
    }
    applied = [...applied, op];
  }
  function t2Reset() {
    t2 = T2_START.map((i) => ({ ...i }));
    grouped = false;
    applied = [];
    lastOp = null;
  }

  const OP_ORDER: Op[] = ['update', 'consolidation', 'revision', 'reorganization', 'forgetting'];
  const OP_LABEL: Record<Op, string> = { update: 'Update', consolidation: 'Consolidate', revision: 'Revise', reorganization: 'Reorganize', forgetting: 'Forget' };
</script>

<div class="demo">
  <div class="tabs" role="tablist" aria-label="Management tier">
    {#each ['T1', 'T2', 'T3'] as t (t)}
      <button
        role="tab"
        type="button"
        class="tab tier-{t}"
        aria-selected={tier === t}
        onclick={() => (tier = t as 'T1' | 'T2' | 'T3')}
      >
        <span class="tname"><span class="dot"></span>{t} · {tierText[t].title}</span>
        <span class="tq">{tierText[t].question}</span>
        <span class="tn small muted num">{tierCounts[t]} systems</span>
      </button>
    {/each}
  </div>

  <div class="panelbody" role="tabpanel">
    {#if tier === 'T1'}
      <div class="stage two">
        <div class="side">
          <div class="card"><p class="k">Policy π</p><p>No write or maintenance policy after formation.</p></div>
          <div class="actions col">
            <button class="btn primary" type="button" onclick={t1Ask}>Ask: “Where are my keys?”</button>
            <button class="btn" type="button" onclick={t1Observe} disabled={t1Moved}>Keys move to the desk</button>
            <button class="btn ghost" type="button" onclick={t1Reset}>Reset</button>
          </div>
          <p class="readout" aria-live="polite">{t1Answer || 'Try a question, then change the world and ask again.'}</p>
        </div>
        <MemoryBoard items={t1} label="Memory M (fixed)" />
      </div>
    {:else if tier === 'T2'}
      <div class="stage two">
        <div class="side">
          <div class="card"><p class="k">Policy π (fixed)</p><p>The same rules decide every operation, before and after deployment.</p></div>
          <div class="ops" role="group" aria-label="Memory operations">
            {#each OP_ORDER as op (op)}
              <button class="btn op" type="button" class:on={lastOp === op} onclick={() => applyOp(op)} disabled={applied.includes(op)}>
                {OP_LABEL[op]}
                <span class="small muted num">{opCounts[op] ?? 0}</span>
              </button>
            {/each}
            <button class="btn ghost" type="button" onclick={t2Reset}>Reset</button>
          </div>
          <div class="readout" aria-live="polite">
            {#if lastOp}
              <p><strong>{OP_LABEL[lastOp]}.</strong> {opText[lastOp].definition}</p>
              <p class="small muted">
                In the paper:
                {#each opText[lastOp].examples as ex, i (ex.name)}
                  {#if ex.href}<a href={ex.href}>{ex.name}</a>{:else}{ex.name}{/if}{i < opText[lastOp].examples.length - 1 ? ', ' : ''}
                {/each}
              </p>
            {:else}
              <p>Apply the five operations in any order. Numbers show how many corpus systems use each one.</p>
            {/if}
          </div>
        </div>
        <MemoryBoard items={t2} {grouped} label="Memory M (changing)" />
      </div>
    {:else}
      <T3Loop />
    {/if}
  </div>
</div>

<style>
  .demo { display: grid; gap: 16px; }
  .tabs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .tab {
    font: inherit; text-align: left; display: flex; flex-direction: column; gap: 2px; cursor: pointer;
    padding: 12px 14px; border-radius: 12px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink);
    border-top: 3px solid var(--c); transition: background var(--dur-1);
  }
  .tab[aria-selected='true'] { background: color-mix(in srgb, var(--c) 12%, var(--surface)); border-color: var(--c); }
  .tname { font-weight: 650; display: flex; gap: 8px; align-items: center; }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c); }
  .tq { color: var(--ink-2); font-size: 0.9375rem; }
  .stage.two { display: grid; grid-template-columns: minmax(240px, 0.9fr) 1.4fr; gap: 16px; align-items: start; }
  .side { display: grid; gap: 12px; }
  .card { background: var(--surface); border: 1px solid var(--rule); border-radius: 12px; padding: 12px 14px; }
  .card p { margin: 0 0 4px; font-size: 0.9375rem; }
  .k { font-size: 0.75rem !important; color: var(--muted); }
  .actions.col, .ops { display: flex; flex-wrap: wrap; gap: 8px; }
  .btn { font: inherit; font-size: 0.9375rem; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--rule); background: var(--surface); color: var(--ink); cursor: pointer; display: inline-flex; gap: 8px; align-items: baseline; }
  .btn.primary { background: var(--ink); color: var(--bg); border-color: var(--ink); }
  .btn.ghost { border-color: transparent; color: var(--muted); }
  .btn.op.on { border-color: var(--t2); }
  .btn:disabled { opacity: 0.45; cursor: default; }
  .readout { font-size: 0.9375rem; color: var(--ink-2); min-height: 4.5em; }
  .readout p { margin: 0 0 6px; }
  @media (max-width: 860px) {
    .tabs { grid-template-columns: 1fr; }
    .stage.two { grid-template-columns: 1fr; }
  }
</style>
