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
<div class="modal" role="dialog" aria-modal="true" aria-label="Modos e bonus buy"
     tabindex="-1" bind:this={modalEl} on:keydown={onKey} on:click|self={close}>
  <div class="panel">
    <header>
      <div>
        <p class="eyebrow">Choose your chaos</p>
        <h2>Modos & Bônus</h2>
      </div>
      <button type="button" class="icon" on:click={close} aria-label="Fechar painel">×</button>
    </header>

    <div class="wrap">
      <section>
        <h3>Modos de Aposta</h3>
        <div class="card-grid">
          {#each modes as m}
            <article class="card">
              <div class="info">
                <div class="name">{m.name}</div>
                <div class="desc">{m.desc}</div>
              </div>
              <div class="footer">
                <span class="cost" aria-label="Multiplicador de custo">x{m.cost.toFixed(2)}</span>
                <button type="button" on:click={()=>select(m.key)}>Selecionar</button>
              </div>
            </article>
          {/each}
        </div>
      </section>

      <section>
        <h3>Compras de Bônus</h3>
        <div class="card-grid">
          {#each buys as b}
            <article class="card">
              <div class="info">
                <div class="name">{b.name}</div>
                <div class="desc">{b.desc}</div>
              </div>
              <div class="footer">
                <span class="cost">x{b.cost.toFixed(2)}</span>
                <button type="button" class="buy" on:click={()=>buy(b.key)}>Comprar</button>
              </div>
            </article>
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
.modal{position:fixed;inset:0;background:rgba(4,6,12,.82);backdrop-filter:blur(7px);display:grid;place-items:center;z-index:50;padding:24px}
.panel{width:min(760px,96vw);background:radial-gradient(circle at 15% 15%,rgba(255,255,255,.12),rgba(5,6,12,.96));border:1px solid rgba(255,255,255,.1);border-radius:28px;padding:26px;box-shadow:0 30px 140px rgba(0,0,0,.6);color:#f7f8ff}
header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;gap:16px}
.eyebrow{text-transform:uppercase;font-size:.7rem;letter-spacing:.3em;opacity:.7;margin:0}
header h2{margin:6px 0 0;font-size:1.7rem}
.icon{width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:1.2rem;cursor:pointer}
.wrap{display:grid;grid-template-columns:1fr;gap:18px;margin-top:12px}
h3{margin:0 0 10px;text-transform:uppercase;letter-spacing:.12em;font-size:.85rem;color:#ffec8a}
.card-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:14px}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:14px 16px;display:flex;flex-direction:column;gap:14px;min-height:150px}
.name{font-weight:800;font-size:1.05rem}
.desc{opacity:.85;font-size:.9rem}
.footer{display:flex;justify-content:space-between;align-items:center;gap:12px}
.cost{font-weight:700;opacity:.9}
button{font-weight:700;border-radius:12px;padding:10px 16px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;cursor:pointer}
.buy{background:linear-gradient(120deg,#ffec8a,#ff8f3b);color:#1c0f05;border:none}
footer{display:flex;justify-content:flex-end;margin-top:18px}
.ghost{background:transparent;border-color:rgba(255,255,255,.3)}
</style>
