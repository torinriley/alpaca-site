<script lang="ts">
  import { onMount, tick } from 'svelte';

  // One slab per component of the engine, stacked like an exploded architecture diagram.
  const slabs = [
    { k: 'file', label: 'model.gguf', c: 0.23 },
    { k: 'buf', label: 'MTLBuffer · no copy', c: 0.34 },
    { k: 'tok', label: 'BPE tokens', c: 0.45 },
    { k: 'layer', label: 'layer 1', c: 0.53 },
    { k: 'layer', label: 'layer 2', c: 0.6 },
    { k: 'layer', label: 'layer 30', c: 0.67 },
    { k: 'logit', label: 'logits', c: 0.8 },
    { k: 'stream', label: 'stream', c: 0.92 },
  ];
  const N = slabs.length;
  const hints = [
    { at: 0.2, top: 3, a: 'Hardened ', b: 'parsing.', p: 'Model files are untrusted input: bounded lengths, overflow-checked arithmetic, and 20,000 fuzzed files without a crash.' },
    { at: 0.31, top: 19, a: 'Zero-copy ', b: 'weights.', p: 'The GGUF file is memory-mapped and wrapped as a single no-copy MTLBuffer. Resident memory is about the file size.' },
    { at: 0.42, top: 35, a: 'Written ', b: 'from scratch.', p: 'Tensor engine, tokenizer, sampler and forward pass. No llama.cpp, MLX, Core ML, or ONNX.' },
    { at: 0.5, top: 51, a: 'Custom ', b: 'Metal kernels.', p: 'Six fused dispatches per layer, tensor-op prefill attention and GEMM, split-K decode attention.' },
    { at: 0.76, top: 68, a: 'Verified against ', b: 'PyTorch.', p: '191 of 191 tokenizer strings and 72 of 72 greedy tokens match the reference.' },
    { at: 0.88, top: 85, a: 'Idiomatic ', b: 'Swift.', p: 'Async loading, AsyncSequence streaming, cancellation, and seeded sampling.' },
  ];

  const PW = 300, PH = 190; // slab size in design units
  const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const bump = (p: number, c: number, w: number) => smooth(clamp(1 - Math.abs(p - c) / w));

  let root: HTMLElement;
  let art: HTMLElement;
  let slabEls: HTMLElement[] = $state([]);
  let p = $state(0);
  let k = $state(1);
  let reduced = $state(false);
  let labelPos: { y: number; r: number; l: number }[] = $state([]);
  let labelRight = $state(0);

  const spread = $derived(reduced ? 1 : smooth(clamp(p / 0.16)));
  const dim = $derived(reduced ? 0 : smooth(clamp((p - 0.16) / 0.06)));
  const gap = $derived(10 + 86 * spread);
  const rx = $derived(64 - 6 * spread);
  const rz = $derived(-44 + 26 * (reduced ? 0.3 : p));
  const f = $derived(slabs.map((s) => (reduced ? 0 : bump(p, s.c, 0.055))));
  const mid = $derived(((N - 1) * gap) / 2 + (OPEN * dim) / 2);

  // continuous focus position along the stack (0 = file ... N-1 = stream)
  const fc = $derived.by(() => {
    if (reduced || p <= slabs[0].c) return 0;
    for (let i = 0; i < N - 1; i++) {
      if (p <= slabs[i + 1].c) return i + (p - slabs[i].c) / (slabs[i + 1].c - slabs[i].c);
    }
    return N - 1;
  });
  // slabs above the focused one move up, opening a clear window around it
  const OPEN = 130;
  const extra = $derived(slabs.map((_, i) => OPEN * dim * smooth(clamp(fc - i))));

  const segLit = (i: number) => {
    const s = slabs[i];
    if (s.k !== 'layer' || f[i] < 0.05) return 0;
    return clamp((p - (s.c - 0.04)) / 0.08) * 6;
  };

  async function update() {
    const r = root.getBoundingClientRect();
    p = clamp(-r.top / (r.height - window.innerHeight));
    const ar = art.getBoundingClientRect();
    k = Math.max(0.35, Math.min(ar.width / 620, ar.height / 1000));
    await tick();
    const rects = slabEls.map((el) => el.getBoundingClientRect());
    const left = Math.min(...rects.map((q) => q.left));
    labelRight = left - ar.left - 18;
    labelPos = rects.map((q) => ({ y: q.top + q.height / 2 - ar.top, r: left - ar.left - 18, l: q.left - ar.left + q.width * 0.12 }));
  }

  onMount(() => {
    reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const on = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  });

  const cur = $derived(hints.reduce((c, h, i) => (p >= h.at ? i : c), -1));
  const bars = [14, 22, 10, 34, 18, 52, 90, 26, 12, 20, 8, 16];
</script>

<div class="track" bind:this={root}>
  <div class="sticky">
    <div class="stage">
      <div class="art" bind:this={art} role="img" aria-label="Exploded 3D stack of the inference pipeline: model file, memory-mapped buffer, tokens, transformer layers, logits, streamed output.">
        <div class="scene">
          <div class="world" style="transform: scale({k}) rotateX({rx}deg) rotateZ({rz}deg) translateZ({-mid}px)">
            {#each slabs as s, i}
              <div
                bind:this={slabEls[i]}
                class="slab {s.k}"
                style="width:{PW}px;height:{PH}px;transform: translate3d({70 * f[i]}px,0,{(N - 1 - i) * gap + extra[i] + 34 * f[i]}px); opacity:{1 - dim * 0.86 * (1 - f[i])}; border-width:{1.25 + 1.5 * f[i]}px; --lw:{1.25 + 1.2 * f[i]}px"
              >
                {#if s.k === 'file'}
                  <div class="doc"><i></i><i></i><i style="width:60%"></i></div>
                {:else if s.k === 'buf'}
                  <div class="cells"><i></i><i></i><i></i><i></i></div>
                {:else if s.k === 'tok'}
                  <div class="toks"><i></i><i></i><i></i><i></i><i></i></div>
                {:else if s.k === 'layer'}
                  <div class="segs">{#each Array(6) as _, j}<i class:lit={segLit(i) > j}></i>{/each}</div>
                {:else if s.k === 'logit'}
                  <div class="bars">{#each bars as h, j}<i style="height:{h}%" class:pick={j === 6 && f[i] > 0.3}></i>{/each}</div>
                {:else}
                  <div class="lines">
                    {#each [78, 46, 90, 58] as w, j}<i style="width:{w * clamp((f[i] * 1.4 - j * 0.18) + (p > 0.95 ? 1 : 0))}%"></i>{/each}
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>

        <div class="labels" aria-hidden="true">
          {#each slabs as s, i}
            {#if labelPos[i]}
              <span class="lab" style="top:{labelPos[i].y}px; right:calc(100% - {labelRight}px); opacity:{clamp((spread - 0.55) * 2.2) * (1 - dim * 0.75 * (1 - f[i]))}">{s.label}</span>
            {/if}
          {/each}
        </div>
      </div>

      <div class="hints">
        {#each hints as h, i}
          <div class="hint" class:on={p >= h.at - 0.02} class:cur={i === cur} style="--top:{h.top}%">
            <h3>{h.a}<em>{h.b}</em></h3>
            <p>{h.p}</p>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>

<style>
  .track { height: 700vh; }
  .sticky { position: sticky; top: 0; height: 100svh; display: flex; align-items: center; }
  .stage { width: 100%; height: min(100%, 760px); display: grid; grid-template-columns: 1.25fr 1fr; gap: 24px; }
  .art { position: relative; height: 100%; min-width: 0; color: var(--text); }
  .scene { position: absolute; inset: 0; perspective: 1700px; perspective-origin: 50% 38%; }
  .world { position: absolute; left: 50%; top: 50%; width: 0; height: 0; transform-style: preserve-3d; will-change: transform; }

  .slab { position: absolute; left: -150px; top: -95px; box-sizing: border-box; background: #fff; border: var(--lw, 1.25px) solid var(--text); transform-style: flat; padding: 22px; display: flex; align-items: center; justify-content: center; }
  .slab i { display: block; font-style: normal; }
  .doc { width: 100%; display: grid; gap: 14px; } .doc i { height: 0; border-top: var(--lw, 1.25px) solid var(--text); }
  .cells { display: flex; width: calc(100% + 44px); height: 100%; margin: -22px; } .cells i { flex: 1; border-left: var(--lw, 1.25px) solid var(--text); } .cells i:first-child { border: 0; }
  .toks { display: flex; gap: 12px; } .toks i { width: 38px; height: 38px; border: var(--lw, 1.25px) solid var(--text); }
  .segs { display: grid; grid-template-columns: repeat(6, 1fr); gap: 6px; width: 100%; height: 44px; } .segs i { border: var(--lw, 1.25px) solid var(--text); transition: background .25s; } .segs i.lit { background: var(--text); }
  .bars { display: flex; align-items: flex-end; gap: 8px; width: 100%; height: 100%; } .bars i { flex: 1; border: var(--lw, 1.25px) solid var(--text); border-bottom: 0; min-height: 3px; } .bars i.pick { background: var(--text); }
  .lines { display: grid; gap: 14px; width: 100%; } .lines i { height: 0; border-top: var(--lw, 1.25px) solid var(--text); transform-origin: left; min-width: 0; }


  .labels { position: absolute; inset: 0; pointer-events: none; }
  .lab { position: absolute; transform: translateY(-50%); font: 12px var(--mono); color: var(--muted); white-space: nowrap; }

  .hints { position: relative; height: 100%; max-width: 400px; }
  .hint { position: absolute; top: var(--top); left: 0; right: 0; opacity: 0; transform: translateY(10px); transition: opacity .6s ease, transform .6s ease; }
  .hint.on { opacity: .38; transform: none; }
  .hint.cur { opacity: 1; }
  h3 { font: 500 21px/1.15 var(--sans); letter-spacing: -.03em; margin-bottom: 6px; }
  h3 em { color: var(--muted); }
  p { font-size: 14px; line-height: 1.5; color: var(--muted); }

  @media (max-width: 900px) {
    .track { height: 640vh; }
    .stage { grid-template-columns: 1fr; grid-template-rows: 1fr auto; height: 100%; gap: 8px; padding: 12px 0; }
    .hints { height: 110px; max-width: none; }
    .hint { top: 0; }
    .hint.on:not(.cur) { opacity: 0; }
    .lab { display: none; }
  }
</style>
