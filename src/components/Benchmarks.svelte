<script lang="ts">
  type Row = { label: string; alpaca: number; llama: number };
  const sets: Record<string, { unit: string; rows: Row[] }> = {
    Prefill: { unit: 'Tokens per second, by prompt length', rows: [
      { label: '128 tokens', alpaca: 24106, llama: 18326 },
      { label: '2048 tokens', alpaca: 30797, llama: 20762 },
      { label: '4096 tokens', alpaca: 24069, llama: 15388 },
    ] },
    Decode: { unit: 'Tokens per second, by context length', rows: [
      { label: '16 context', alpaca: 582, llama: 441 },
      { label: '2048 context', alpaca: 456, llama: 367 },
    ] },
    Formats: { unit: 'Decode tokens per second, 16-token context', rows: [
      { label: 'Q4_0', alpaca: 712, llama: 518 },
      { label: 'Q8_0', alpaca: 582, llama: 441 },
      { label: 'F16', alpaca: 360, llama: 319 },
    ] },
  };
  let tab = $state('Prefill');
  const cur = $derived(sets[tab]);
  const max = $derived(Math.max(...cur.rows.flatMap((r) => [r.alpaca, r.llama])));
  const n = (v: number) => v.toLocaleString('en-US');
</script>

<div class="bench">
  <div class="tabs" role="tablist">
    {#each Object.keys(sets) as t}
      <button role="tab" aria-selected={tab === t} class:on={tab === t} onclick={() => (tab = t)}>{t}</button>
    {/each}
  </div>
  <p class="unit">{cur.unit}</p>

  {#each cur.rows as r (tab + r.label)}
    <div class="row">
      <div class="rowhead"><span class="lab">{r.label}</span><span class="x">{(r.alpaca / r.llama).toFixed(2)}×</span></div>
      <div class="line"><div class="bar a" style="--w:{(r.alpaca / max) * 100}%"></div><span>{n(r.alpaca)}<small> alpaca.swift</small></span></div>
      <div class="line"><div class="bar l" style="--w:{(r.llama / max) * 100}%"></div><span>{n(r.llama)}<small> llama.cpp</small></span></div>
    </div>
  {/each}
</div>

<style>
  .tabs { display: flex; gap: 28px; }
  .tabs button { background: none; border: 0; border-bottom: 1px solid transparent; margin-bottom: -1px; padding: 0 0 14px; font: 500 15px var(--sans); color: var(--muted); cursor: pointer; transition: color .2s; }
  .tabs button:hover { color: var(--text); }
  .tabs button.on { color: var(--text); border-bottom-color: var(--text); }
  .unit { font: 12px var(--mono); color: var(--muted); margin: 20px 0 8px; }
  .row { padding: 18px 0; }
  .rowhead { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 14px; }
  .lab { font: 500 20px/1 var(--sans); letter-spacing: -.02em; }
  .x { font: 500 14px var(--mono); color: var(--text); }
  .line { display: flex; align-items: center; gap: 14px; margin-bottom: 8px; font: 500 13px var(--mono); }
  .line:last-child { margin-bottom: 0; }
  .line span { flex: none; min-width: 190px; }
  .line small { font: 12px var(--mono); color: var(--muted); margin-left: 6px; }
  .bar { height: 10px; width: 0; animation: grow .9s cubic-bezier(.2,.8,.2,1) forwards; order: -1; flex: none; }
  .a { background: var(--text); } .l { background: var(--line-2); }
  .line { flex-direction: row; }
  @keyframes grow { to { width: calc(var(--w) * .55); } }
  @media (max-width: 600px) { .line span { min-width: 0; } .line small { display: none; } .tabs { gap: 20px; } }
  @media (prefers-reduced-motion: reduce) { .bar { animation-duration: 1ms; } }
</style>
