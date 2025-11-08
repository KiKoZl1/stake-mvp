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
<div class="modal" role="dialog" aria-modal="true" aria-label="Configurações de áudio"
     tabindex="-1" bind:this={modalEl} on:keydown={onKey} on:click|self={close}>
  <div class="panel">
    <header>
      <div>
        <p class="eyebrow">Dial in the vibes</p>
        <h2>Configurações</h2>
      </div>
      <button type="button" class="icon" on:click={close} aria-label="Fechar configurações">×</button>
    </header>

    <div class="row switch">
      <span id="lbl-muted">Mudo geral</span>
      <label class="toggle" for="mute-toggle">
        <input id="mute-toggle" type="checkbox" bind:checked={muted} on:change={setAll}>
        <span class="slider"></span>
      </label>
    </div>

    <label class="row" for="slider-music">
      <span id="lbl-music">Música</span>
      <input id="slider-music" type="range" min="0" max="1" step="0.01" bind:value={music} on:input={setAll}>
      <span class="val">{Math.round(music*100)}%</span>
    </label>

    <label class="row" for="slider-sfx">
      <span id="lbl-sfx">Efeitos (SFX)</span>
      <input id="slider-sfx" type="range" min="0" max="1" step="0.01" bind:value={sfx} on:input={setAll}>
      <span class="val">{Math.round(sfx*100)}%</span>
    </label>

    <footer>
      <button type="button" on:click={close}>Fechar</button>
    </footer>
  </div>
</div>
{/if}

<style>
.modal{position:fixed;inset:0;background:rgba(3,5,9,.8);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:50;padding:20px}
.panel{width:min(520px,94vw);background:radial-gradient(circle at 15% 15%,rgba(255,255,255,.1),rgba(6,8,18,.95));border:1px solid rgba(255,255,255,.1);border-radius:26px;padding:24px 28px;box-shadow:0 30px 120px rgba(0,0,0,.6);color:#f6f7ff}
header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;gap:16px}
.eyebrow{text-transform:uppercase;font-size:.7rem;letter-spacing:.3em;opacity:.7;margin:0}
h2{margin:6px 0 0}
.icon{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:1.2rem;cursor:pointer}
.row{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;margin:14px 0;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.08)}
.row:last-of-type{border-bottom:none}
.val{opacity:.8}
.switch{grid-template-columns:auto auto 1fr}
.toggle{position:relative;width:52px;height:28px;display:inline-flex;align-items:center}
.toggle input{opacity:0;width:0;height:0}
.slider{position:absolute;inset:0;background:rgba(255,255,255,.2);border-radius:999px;transition:all .2s}
.slider::after{content:'';position:absolute;width:22px;height:22px;border-radius:50%;background:#fff;top:3px;left:4px;transition:transform .2s}
.toggle input:checked + .slider{background:linear-gradient(120deg,#ffec8a,#ff8f3b)}
.toggle input:checked + .slider::after{transform:translateX(20px)}
input[type="range"]{appearance:none;-webkit-appearance:none;height:6px;border-radius:999px;background:rgba(255,255,255,.2);outline:none}
input[type="range"]::-webkit-slider-thumb{appearance:none;-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#ffec8a;box-shadow:0 0 10px rgba(255,255,255,.6)}
footer{display:flex;justify-content:flex-end;margin-top:18px}
footer button{min-width:120px;background:linear-gradient(120deg,#ffec8a,#ff8f3b);border:none;border-radius:16px;padding:10px 18px;font-weight:700;color:#1b0f04}
</style>
