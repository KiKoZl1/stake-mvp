<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let open = false;
  export let music = 0.6;
  export let sfx = 0.9;
  export let muted = false;

  const dispatch = createEventDispatcher();
  function setAll(){ dispatch('change', { music, sfx, muted }); }
  function close(){ dispatch('close'); }
  function onKey(e:KeyboardEvent){ if (e.key === 'Escape') close(); }

  let modalEl: HTMLDivElement;
  onMount(()=>{ if (open) setTimeout(()=>modalEl?.focus(),0); });
</script>

{#if open}
<div class="modal" role="dialog" aria-modal="true" aria-label="Configurações"
     tabindex="0" bind:this={modalEl} on:keydown={onKey} on:click|self={close}>
  <div class="panel">
    <header><h2>Configurações</h2></header>

    <label class="row">
      <span id="lbl-muted">Mudo</span>
      <input aria-labelledby="lbl-muted" type="checkbox" bind:checked={muted} on:change={setAll}>
    </label>

    <label class="row">
      <span id="lbl-music">Música</span>
      <input aria-labelledby="lbl-music" type="range" min="0" max="1" step="0.01" bind:value={music} on:input={setAll}>
      <span class="val">{Math.round(music*100)}%</span>
    </label>

    <label class="row">
      <span id="lbl-sfx">Efeitos (SFX)</span>
      <input aria-labelledby="lbl-sfx" type="range" min="0" max="1" step="0.01" bind:value={sfx} on:input={setAll}>
      <span class="val">{Math.round(sfx*100)}%</span>
    </label>

    <footer>
      <button type="button" on:click={close}>Fechar</button>
    </footer>
  </div>
</div>
{/if}

<style>
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50}
.panel{width:min(520px,94vw);background:#121212;border:1px solid #2a2a2a;border-radius:14px;padding:18px;box-shadow:0 20px 80px rgba(0,0,0,.45)}
header h2{margin:0 0 10px;font-weight:800}
.row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin:10px 0}
.val{opacity:.8}
button{background:#222;border:1px solid #383838;border-radius:10px;padding:10px 14px;font-weight:700}
</style>
