<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  const props = $props<{ open?: boolean }>();

  const dispatch = createEventDispatcher();

  let count: number | 'inf' = 10;
  let stopOnBonus = true;
  let stopOnWinAbove = 0;        // em multiplos da aposta
  let stopOnBalanceBelow = 0;    // saldo em moeda

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
    if (props.open) setTimeout(() => (modalEl as HTMLDivElement)?.focus(), 0);
  });

  let modalEl: HTMLDivElement;
</script>

{#if props.open}
<div class="modal" role="dialog" aria-modal="true" aria-label="Autoplay"
     tabindex="0" on:keydown={onKey} bind:this={modalEl}
     on:click|self={close}>
  <div class="panel">
    <header>
      <div>
        <p class="eyebrow">Hands-free chaos</p>
        <h2>Autoplay</h2>
      </div>
      <span class="hero-chip">INF dopamine</span>
    </header>

    <section class="row">
      <div class="group">
        <span class="lbl">Numero de giros</span>
        <div class="list">
          <button type="button" class:active={count===10} on:click={() => count=10}>10</button>
          <button type="button" class:active={count===25} on:click={() => count=25}>25</button>
          <button type="button" class:active={count===50} on:click={() => count=50}>50</button>
          <button type="button" class:active={count===100} on:click={() => count=100}>100</button>
          <button type="button" class:active={count==='inf'} on:click={() => count='inf'}>INF</button>
        </div>
      </div>
    </section>

    <section class="rules">
      <h3>Regras de parada</h3>

      <label class="rule">
        <input type="checkbox" bind:checked={stopOnBonus}>
        <span>Parar ao entrar no bonus</span>
      </label>

      <label class="rule">
        <span>Parar se win &gt;</span>
        <input type="number" min="0" step="0.5" bind:value={stopOnWinAbove} aria-label="Parar se o ganho for maior que multiplos da aposta">
        <span>x bet</span>
      </label>

      <label class="rule">
        <span>Parar se saldo &lt;</span>
        <input type="number" min="0" step="1" bind:value={stopOnBalanceBelow} aria-label="Parar se o saldo ficar abaixo de">
        <span>moeda</span>
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
.modal{position:fixed;inset:0;background:rgba(4,6,12,.8);backdrop-filter:blur(6px);display:grid;place-items:center;z-index:50;padding:20px}
.panel{width:min(520px,94vw);background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.08),rgba(8,9,16,.95));border:1px solid rgba(255,255,255,.08);border-radius:24px;padding:24px 26px 20px;box-shadow:0 30px 120px rgba(0,0,0,.55);color:#f5f6ff}
header{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px}
.eyebrow{text-transform:uppercase;font-size:.7rem;letter-spacing:.3em;opacity:.7;margin:0}
header h2{margin:2px 0 0;font-size:1.6rem}
.hero-chip{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);border-radius:999px;padding:6px 14px;font-size:.8rem;letter-spacing:.1em;text-transform:uppercase}
.row{margin:12px 0}
.group .lbl{display:block;margin:6px 0 8px;opacity:.85;text-transform:uppercase;font-size:.75rem;letter-spacing:.08em}
.list{display:flex;gap:10px;flex-wrap:wrap}
button{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.18);border-radius:12px;padding:10px 16px;font-weight:700;color:#fff;cursor:pointer}
button.active{background:linear-gradient(120deg,#ffec8a,#ff8f3b);color:#1b0d02}
.rules{margin:14px 0 6px}
.rule{display:flex;gap:10px;align-items:center;margin:10px 0;background:rgba(255,255,255,.04);border-radius:12px;padding:8px 12px}
.rule input[type="number"]{width:100px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.15);border-radius:8px;color:#fff;padding:6px 8px}
footer{display:flex;justify-content:flex-end;gap:12px;margin-top:18px}
.ghost{background:transparent;border-color:rgba(255,255,255,.3)}
footer button{min-width:120px}
</style>
