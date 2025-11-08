<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let balance = 0;
  export let bet = 1_000_000;
  export let mode: string = 'base';
  export let turbo = false;
  export let lastWin = 0;

  export let fsIndex = 0;
  export let fsTotal = 0;
  export let hype = 0;

  export let spinning = false;
  export let autoActive = false;
  export let onStopAuto: (() => void) | null = null;
  export let onSpin: (() => void) | null = null;
  export let onInfo: (() => void) | null = null;

  const dispatch = createEventDispatcher();

  const pretty = (n: number) =>
    (n / 1_000_000).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  const modeLabel = (m: string) => m.replace(/_/g, ' ').toUpperCase();

  function spin() {
    onSpin?.();
  }
  function info() {
    onInfo?.();
  }
  function stopAuto() {
    onStopAuto?.();
  }
</script>

<div class="hud" role="region" aria-label="Painel de controle do slot">
  <div class="panel">
    <section class="segment stats" aria-label="Informações de aposta">
      <div class="stat-card">
        <span class="label">Balance</span>
        <output class="value" aria-live="polite">{pretty(balance)}</output>
      </div>
      <div class="stat-card bet">
        <span class="label">Bet</span>
        <div class="betbox" role="group" aria-label="Ajustar aposta">
          <button
            type="button"
            class="chip"
            on:click={() => (bet = Math.max(1_000_000, bet - 1_000_000))}
            disabled={spinning}
            aria-label="Diminuir aposta"
          >
            −
          </button>
          <output class="value" aria-live="polite">{pretty(bet)}</output>
          <button
            type="button"
            class="chip"
            on:click={() => (bet = bet + 1_000_000)}
            disabled={spinning}
            aria-label="Aumentar aposta"
          >
            +
          </button>
        </div>
      </div>
      <div class="stat-card">
        <span class="label">Win</span>
        <output class="value" aria-live="polite">{pretty(lastWin)}</output>
      </div>
    </section>

    <section class="segment actions" aria-label="Ações principais">
      <div class="mode-pill">
        <span>Mode</span>
        <strong>{modeLabel(mode)}</strong>
      </div>
      <div class="spin-stack">
        <button class="spin" type="button" on:click={spin} disabled={spinning}>
          <span>SPIN</span>
          <small>{spinning ? 'Rolling...' : 'Fire the cannons'}</small>
        </button>
        <div class="quick">
          <button type="button" class="ghost" on:click={() => dispatch('openAuto')} aria-label="Abrir autoplay">
            Auto
          </button>
          <button type="button" class="ghost" on:click={() => dispatch('openModes')} aria-label="Abrir modos e bonus buys">
            Modes
          </button>
        </div>
      </div>
      <div class="toggles">
        <label class="toggle" for="turbo">
          <input id="turbo" type="checkbox" bind:checked={turbo} disabled={spinning} />
          <span>Turbo</span>
        </label>
        {#if autoActive}
          <button class="stop" type="button" on:click={stopAuto} aria-label="Parar autoplay imediatamente">
            Stop Auto
          </button>
        {/if}
      </div>
    </section>

    <section class="segment meta" aria-label="Status extra e menus">
      <div class="badge-grid" aria-live="polite">
        <div class="badge">
          <span>FS</span>
          <strong>{fsIndex}/{fsTotal}</strong>
        </div>
        <div class="badge">
          <span>Hype</span>
          <strong>x{hype}</strong>
        </div>
      </div>
      <div class="menu-buttons" role="group" aria-label="Menus">
        <button type="button" class="icon" on:click={info} aria-label="Info e Paytable">
          i
        </button>
        <button type="button" class="icon" on:click={() => dispatch('openSettings')} aria-label="Configurações">
          ⚙
        </button>
      </div>
    </section>
  </div>
</div>

<style>
  .hud {
    width: 100%;
    display: flex;
    justify-content: center;
    padding: 0 clamp(12px, 3vw, 28px);
    pointer-events: none;
  }
  .panel {
    pointer-events: auto;
    display: flex;
    gap: 14px;
    background: rgba(5, 7, 14, 0.9);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 14px clamp(16px, 3vw, 26px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.55);
    flex-wrap: wrap;
    max-width: 760px;
  }
  .segment {
    display: flex;
    align-items: center;
    gap: 16px;
    flex: 1;
    min-width: 200px;
  }
  .segment.stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }
  .segment.actions {
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 0 12px;
  }
  .segment.meta {
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }
  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 10px 14px;
    min-width: 0;
  }
.stat-card .label {
  font-size: 0.75rem;
  text-transform: uppercase;
  opacity: 0.7;
  letter-spacing: 0.05em;
}
.stat-card .value {
  display: block;
  font-weight: 800;
  font-size: 1.1rem;
}
.bet .betbox {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 6px;
}
.chip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  font-size: 1rem;
}
.mode-pill {
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  color: #fff;
  padding: 8px 18px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: linear-gradient(120deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.01));
}
.mode-pill strong {
  display: block;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
}
.spin-stack {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
  .spin {
    width: 150px;
    height: 60px;
    border-radius: 999px;
    border: none;
    background: radial-gradient(circle at 20% 20%, #ffec8a, #ff6b3b);
    color: #1c0f05;
    font-size: 1.4rem;
    font-weight: 800;
    box-shadow: 0 8px 22px rgba(255, 123, 0, 0.32);
  }
.spin small {
  display: block;
  font-size: 0.65rem;
  letter-spacing: 0.08em;
}
  .quick {
    display: flex;
    gap: 10px;
  }
.ghost {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 8px 16px;
  font-weight: 700;
  color: #fff;
}
.toggles {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 999px;
  padding: 6px 14px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}
.toggle input {
  accent-color: #ffcf4b;
}
.stop {
  background: linear-gradient(120deg, #ff4d4d, #b4001a);
  border: none;
  color: #fff;
  border-radius: 16px;
  padding: 10px 18px;
  font-weight: 800;
}
  .badge-grid {
    display: flex;
    gap: 10px;
  }
.badge {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 8px 14px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.badge span {
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.7;
}
.badge strong {
  display: block;
  font-size: 1.1rem;
}
.menu-buttons {
  display: flex;
  gap: 10px;
}
.icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  font-size: 1rem;
  color: #fff;
}
button {
  font-family: inherit;
  cursor: pointer;
}
button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 900px) {
  .panel {
    flex-direction: column;
  }
  .segment.meta {
    align-items: flex-start;
  }
}
</style>
