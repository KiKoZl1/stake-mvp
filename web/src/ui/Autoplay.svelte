<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let open = false;

  const dispatch = createEventDispatcher();

  let count: number | 'inf' = 10;
  let stopOnBonus = true;
  let stopOnWinAbove = 0;        // em múltiplos da aposta
  let stopOnBalanceBelow = 0;    // saldo em moeda (ex.: 50.00)

  function apply() {
    dispatch('apply', {
      count: count === 'inf' ? Infinity : Number(count),
      rules: {
        stopOnBonus,
        stopOnWinAbove: Number(stopOnWinAbove),
        stopOnBalanceBelow: Number(stopOnBalanceBelow)
      }
    });
  }
  function close() { dispatch('close'); }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  onMount(() => {
    // foco no dialog quando abrir
    if (open) setTimeout(() => (modalEl as HTMLDivElement)?.focus(), 0);
  });

  let modalEl: HTMLDivElement;
</script>

{#if open}
<div class="modal" role="dialog" aria-modal="true" aria-label="Autoplay"
     tabindex="0" on:keydown={onKey} bind:this={modalEl}
     on:click|self={close}>
  <div class="panel">
    <header><h2>Autoplay</h2></header>

    <section class="row">
      <div class="group">
        <span class="lbl">Número de giros</span>
        <div class="list">
          <button type="button" class:active={count===10} on:click={() => count=10}>10</button>
          <button type="button" class:active={count===25} on:click={() => count=25}>25</button>
          <button type="button" class:active={count===50} on:click={() => count=50}>50</button>
          <button type="button" class:active={count===100} on:click={() => count=100}>100</button>
          <button type="button" class:active={count==='inf'} on:click={() => count='inf'}>∞</button>
        </div>
      </div>
    </section>

    <section class="rules">
      <h3>Regras de parada</h3>

      <label class="rule">
        <input type="checkbox" bind:checked={stopOnBonus}>
        <span>Parar ao entrar no bônus</span>
      </label>

      <label class="rule">
        <span>Parar se win ≥</span>
        <input type="number" min="0" step="0.5" bind:value={stopOnWinAbove} aria-label="Parar se o ganho for maior que múltiplos da aposta">
        <span>× bet</span>
      </label>

      <label class="rule">
        <span>Parar se saldo &lt;</span>
        <input type="number" min="0" step="1" bind:value={stopOnBalanceBelow} aria-label="Parar se o saldo ficar abaixo de">
      </label>
    </section>

    <footer>
      <button type="button" class="ghost" on:click={close}>Cancelar</button>
      <button type="button" on:click={apply}>Iniciar</button>
    </footer>
  </div>
</div>
{/if}

<style>
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50}
.panel{width:min(520px,94vw);background:#121212;border:1px solid #2a2a2a;border-radius:14px;padding:18px 18px 14px;box-shadow:0 20px 80px rgba(0,0,0,.45)}
header h2{margin:0 0 8px;font-weight:800}
.row{margin:8px 0 6px}
.group .lbl{display:block;margin:6px 0 8px;opacity:.9}
.list{display:flex;gap:8px;flex-wrap:wrap}
button{background:#222;border:1px solid #383838;border-radius:10px;padding:10px 14px;font-weight:700}
button.active{background:#2c3f7a;border-color:#3a59a8}
.rules{margin:10px 0 4px}
.rule{display:flex;gap:10px;align-items:center;margin:8px 0}
.rule input[type="number"]{width:90px;background:#1b1b1b;border:1px solid #333;border-radius:8px;color:#fff;padding:6px 8px}
footer{display:flex;justify-content:flex-end;gap:10px;margin-top:12px}
.ghost{background:transparent}
</style>
