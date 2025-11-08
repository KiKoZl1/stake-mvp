<script lang="ts">
  export let onClose: (() => void) | null = null;

  const overview = [
    { label: 'RTP alvo', value: '96.67%' },
    { label: 'Top win', value: '5,000x' },
    { label: 'Ways', value: '243' }
  ];

  const features = [
    {
      title: 'Free Spins - Fourth of July',
      text: '3+ scatters concedem 8/12/20 giros com Wilds sticky x2/x3/x5 e Hype até x10.'
    },
    {
      title: 'Hype Meter',
      text: 'Cada win em FS aumenta o multiplicador global em +1 (cap x10).'
    },
    {
      title: '’Murica Respin',
      text: '2 scatters + Fireworks no rolo 3 disparam respin com rolos 1-2 travados.'
    }
  ];

  const paytable = [
    {
      tier: 'Baixos',
      symbols: [
        { code: 'A', name: 'Red Cup', payout: '1.0x' },
        { code: 'B', name: 'Burger Stack', payout: '1.0x' },
        { code: 'C', name: 'Flag Shades', payout: '1.0x' },
        { code: 'D', name: 'Cowboy Hat', payout: '1.0x' }
      ]
    },
    {
      tier: 'Médios',
      symbols: [
        { code: 'E', name: 'Fireworks', payout: '2.5x' },
        { code: 'F', name: 'Guitarra', payout: '2.5x' },
        { code: 'G', name: 'Pickup Tire', payout: '2.5x' }
      ]
    },
    {
      tier: 'Altos',
      symbols: [
        { code: 'H', name: 'Bald Eagle', payout: '10x' },
        { code: 'I', name: 'Pickup V8', payout: '5x' }
      ]
    }
  ];

  const specials = [
    { code: 'W2/W3/W5', title: 'Wild xN', text: 'Substitui e multiplica cada way. Soma-se multiplicando (cap x20 base, x100 FS).' },
    { code: 'S', title: 'Scatter Freedom', text: '3/4/5 concedem 8/12/20 FS. 2+ durante bônus adicionam +5 (máx. +20).' }
  ];
</script>

<div class="overlay" role="dialog" aria-modal="true" aria-label="Info e Paytable">
  <div class="panel">
    <header>
      <div>
        <p class="eyebrow">’Merica Lore</p>
        <h2>Visão Geral do Jogo</h2>
      </div>
      <button type="button" class="icon" on:click={() => onClose?.()} aria-label="Fechar">×</button>
    </header>

    <section class="overview">
      {#each overview as item}
        <article class="pill">
          <span>{item.label}</span>
          <strong>{item.value}</strong>
        </article>
      {/each}
    </section>

    <section>
      <h3>Recursos Especiais</h3>
      <div class="feature-grid">
        {#each features as feat}
          <article class="feature">
            <div class="badge"></div>
            <div>
              <h4>{feat.title}</h4>
              <p>{feat.text}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <section>
      <h3>Tabela de Pagamento</h3>
      <div class="pay-grid">
        {#each paytable as tier}
          <article class="pay-card">
            <header>{tier.tier}</header>
            <ul>
              {#each tier.symbols as sym}
                <li>
                  <span class="code">{sym.code}</span>
                  <div class="desc">
                    <strong>{sym.name}</strong>
                    <small>5-of-a-kind</small>
                  </div>
                  <span class="payout">{sym.payout}</span>
                </li>
              {/each}
            </ul>
          </article>
        {/each}
      </div>
    </section>

    <section>
      <h3>Especiais</h3>
      <div class="specials">
        {#each specials as spec}
          <article>
            <div class="code-pill">{spec.code}</div>
            <div>
              <strong>{spec.title}</strong>
              <p>{spec.text}</p>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <footer>
      <p>Valores exibidos são multiplicadores sobre a aposta. Jogue com responsabilidade.</p>
      <button type="button" on:click={() => onClose?.()}>Fechar</button>
    </footer>
  </div>
</div>

<style>
.overlay{position:fixed;inset:0;background:rgba(3,5,9,.78);backdrop-filter:blur(8px);display:grid;place-items:center;z-index:80;padding:20px}
.panel{width:min(960px,96vw);max-height:92vh;overflow:auto;background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.08),rgba(4,5,10,.95));border:1px solid rgba(255,255,255,.08);border-radius:28px;padding:28px;box-shadow:0 40px 120px rgba(0,0,0,.65);color:#f5f8ff}
header{display:flex;justify-content:space-between;align-items:flex-start;gap:18px}
.eyebrow{text-transform:uppercase;font-size:.7rem;letter-spacing:.3em;opacity:.7;margin:0}
h2{margin:4px 0 0;font-size:1.8rem}
.icon{width:44px;height:44px;border-radius:50%;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.08);color:#fff;font-size:1.4rem;cursor:pointer}
section{margin-top:20px}
.overview{display:flex;flex-wrap:wrap;gap:12px}
.pill{flex:1;min-width:150px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:18px;padding:12px 16px}
.pill span{text-transform:uppercase;font-size:.75rem;opacity:.75;letter-spacing:.1em}
.pill strong{display:block;font-size:1.4rem}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.feature{display:flex;gap:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px 14px}
.feature .badge{width:48px;height:48px;border-radius:12px;background:linear-gradient(135deg,#ffec8a,#ff8f3b);opacity:.8}
.feature h4{margin:0;font-size:1rem}
.feature p{margin:4px 0 0;font-size:.9rem;opacity:.85}
.pay-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.pay-card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:12px 0 6px}
.pay-card header{text-align:center;text-transform:uppercase;font-size:.8rem;letter-spacing:.2em;margin-bottom:6px;opacity:.8}
.pay-card ul{list-style:none;margin:0;padding:0}
.pay-card li{display:grid;grid-template-columns:auto 1fr auto;align-items:center;padding:8px 16px;border-top:1px solid rgba(255,255,255,.06);gap:10px}
.pay-card li:first-child{border-top:none}
.code{font-weight:800;font-size:1.2rem;background:rgba(255,255,255,.08);border-radius:12px;padding:8px 12px}
.desc strong{display:block}
.desc small{opacity:.6;font-size:.8rem}
.payout{font-weight:800}
.specials{display:flex;flex-direction:column;gap:12px}
.specials article{display:flex;gap:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:12px 14px}
.code-pill{width:64px;height:64px;border-radius:16px;background:rgba(255,255,255,.08);display:grid;place-items:center;font-weight:800}
footer{display:flex;justify-content:space-between;align-items:center;margin-top:24px;gap:14px;flex-wrap:wrap}
footer p{margin:0;opacity:.75;font-size:.9rem}
footer button{background:linear-gradient(120deg,#ffec8a,#ff8f3b);border:none;border-radius:18px;padding:12px 24px;font-weight:700;color:#1c0f04}
</style>
