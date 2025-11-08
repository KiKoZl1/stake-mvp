<script lang="ts">
  export let onClose: (() => void) | null = null;
  const lows = ['A','B','C','D'];
  const mids = ['E','F','G'];
  const highs = ['H','I'];
</script>

<div class="wrap">
  <div class="panel">
    <header>
      <h2>’MERICA: Brainrot Bonanza — Paytable</h2>
      <button on:click={() => onClose?.()}>✕</button>
    </header>

    <section>
      <h3>243 Ways</h3>
      <p>Pagamentos da esquerda para a direita. Não precisa alinhar na linha, apenas em colunas adjacentes.</p>
    </section>

    <section>
      <h3>Baixos (x5)</h3><p>{lows.join(' · ')} — 1.0×</p>
      <h3>Médios (x5)</h3><p>{mids.join(' · ')} — 2.5×</p>
      <h3>Altos (x5)</h3><p>{highs.join(' · ')} — 5× e 10× (seed)</p>
    </section>

    <section>
      <h3>Especiais</h3>
      <ul>
        <li><strong>Scatter (S)</strong> — 3+ ativam Free Spins.</li>
        <li><strong>Wild xN (W2/W3/W5)</strong> — substitui e multiplica; acumulam multiplicando.</li>
      </ul>
    </section>

    <section>
      <h3>Free Spins</h3>
      <ul>
        <li>3/4/5 scatters → 8/12/20 FS.</li>
        <li>Wilds ficam <em>sticky</em> até o fim.</li>
        <li>Hype +1 por spin ganho (até x10).</li>
        <li>Retrigger: 2+ scatters → +5 spins (máx. 20).</li>
      </ul>
    </section>
  </div>
</div>

<style>
.wrap { position:fixed; inset:0; background:rgba(0,0,0,.62); display:grid; place-items:center; z-index:50; }
.panel { width:min(760px, 92vw); max-height:84vh; overflow:auto; background:#10131a; border:1px solid #2c365e; border-radius:14px; padding:16px 18px; color:#eaeefc; }
header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
h2 { font-size:20px; margin:0; }
h3 { margin:14px 0 6px; }
button { background:#1c2444; border:1px solid #2a3a6a; color:#eaeefc; border-radius:8px; padding:6px 10px; }
p, li { line-height:1.4; }
</style>
