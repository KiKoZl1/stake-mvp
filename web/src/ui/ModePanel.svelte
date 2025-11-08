<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  export let open = false;

  const dispatch = createEventDispatcher();

  const modes = [
    { key:'base', name:'Jogo Padrão',     desc:'RTP 96.67%, x1.00',        cost:1.00 },
    { key:'enhanced_spins', name:'Giros Aprimorados', desc:'+chance de bônus, x1.50', cost:1.50 },
    { key:'mult_spins', name:'Giros Multiplicadores', desc:'Pelo menos 1 multiplicador, x10.00', cost:10.00 },
    { key:'fifty_fifty', name:'Cinquenta-Cinquenta', desc:'50% chance de bônus, x100.00', cost:100.00 },
  ];

  const buys = [
    { key:'bonus_buy', name:'Bônus', desc:'Ativa Free Spins (3 scatters), x200.00', cost:200.00 },
    { key:'super_bonus', name:'Super Bônus', desc:'Ativa Free Spins (6 scatters), x600.00', cost:600.00 },
  ];

  function select(key:string){ dispatch('mode', { mode:key }); }
  function buy(key:string){ dispatch('buy', { mode:key }); }
  function close(){ dispatch('close'); }
  function onKey(e:KeyboardEvent){ if (e.key==='Escape') close(); }

  let modalEl: HTMLDivElement;
  onMount(()=>{ if(open) setTimeout(()=>modalEl?.focus(),0); });
</script>

{#if open}
<div class="modal" role="dialog" aria-modal="true" aria-label="Modos e Compras de Bônus"
     tabindex="0" bind:this={modalEl} on:keydown={onKey} on:click|self={close}>
  <div class="panel">
    <header><h2>Modos & Bônus</h2></header>

    <div class="wrap">
      <section>
        <h3>Modos de Aposta</h3>
        <div class="list">
          {#each modes as m}
            <div class="item">
              <div class="info">
                <div class="name">{m.name}</div>
                <div class="desc">{m.desc}</div>
              </div>
              <div class="actions">
                <div class="cost" aria-label="Multiplicador de custo">x{m.cost.toFixed(2)}</div>
                <button type="button" on:click={()=>select(m.key)}>Selecionar</button>
              </div>
            </div>
          {/each}
        </div>
      </section>

      <section>
        <h3>Compras de Bônus</h3>
        <div class="list">
          {#each buys as b}
            <div class="item">
              <div class="info">
                <div class="name">{b.name}</div>
                <div class="desc">{b.desc}</div>
              </div>
              <div class="actions">
                <div class="cost">x{b.cost.toFixed(2)}</div>
                <button type="button" class="buy" on:click={()=>buy(b.key)}>Comprar</button>
              </div>
            </div>
          {/each}
        </div>
      </section>
    </div>

    <footer>
      <button type="button" class="ghost" on:click={close}>Fechar</button>
    </footer>
  </div>
</div>
{/if}

<style>
.modal{position:fixed;inset:0;background:rgba(0,0,0,.55);display:grid;place-items:center;z-index:50}
.panel{width:min(720px,96vw);background:#121212;border:1px solid #2a2a2a;border-radius:14px;padding:18px;box-shadow:0 20px 80px rgba(0,0,0,.45)}
header h2{margin:0 0 12px;font-weight:800}
.wrap{display:grid;grid-template-columns:1fr;gap:14px}
h3{margin:8px 0}
.list{display:flex;flex-direction:column;gap:10px}
.item{display:flex;justify-content:space-between;gap:14px;background:#181818;border:1px solid #2a2a2a;border-radius:12px;padding:12px}
.name{font-weight:800}
.desc{opacity:.85}
.actions{display:flex;align-items:center;gap:12px}
.cost{opacity:.9}
button{background:#222;border:1px solid #383838;border-radius:10px;padding:10px 14px;font-weight:700}
.buy{background:#2c3f7a;border-color:#3a59a8}
footer{display:flex;justify-content:flex-end;margin-top:8px}
.ghost{background:transparent}
</style>
