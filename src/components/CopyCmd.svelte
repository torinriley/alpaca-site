<script lang="ts">
  let { text }: { text: string } = $props();
  let done = $state(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); done = true; setTimeout(() => (done = false), 1600); } catch {}
  }
</script>

<button class="cmd" onclick={copy} aria-label="Copy package dependency">
  <code>{text}</code>
  <span class="tag">{done ? 'Copied' : 'Copy'}</span>
</button>

<style>
  .cmd { display: flex; align-items: stretch; max-width: 100%; border: 1px solid var(--line-2); background: none; color: var(--text); cursor: pointer; text-align: left; transition: border-color .2s; }
  .cmd:hover { border-color: var(--text); }
  code { font-size: 12.5px; padding: 11px 16px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .tag { flex: none; font: 500 12px var(--mono); padding: 11px 14px; border-left: 1px solid var(--line-2); color: var(--muted); }
</style>
