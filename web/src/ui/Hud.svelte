<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let balance = 0;
  export let bet = 1_000_000;
  export let lastWin = 0;
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

  const STEP_SMALL = 1_000_000;
  const STEP_BIG = 10_000_000;

  function adjustSmall(dir: number) {
    bet = Math.max(STEP_SMALL, bet + dir * STEP_SMALL);
  }

  function adjustBig(dir: number) {
    bet = Math.max(STEP_SMALL, bet + dir * STEP_BIG);
  }

  function spin() { onSpin?.(); }
  function info() { onInfo?.(); }
  function stopAuto() { onStopAuto?.(); }
  function toggleMenu() { dispatch('toggleMenu'); }
  function openAuto() { autoActive ? stopAuto() : dispatch('openAuto'); }
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.();
    }
  }
</script>

<div class="hud" role="region" aria-label="Painel de controle do slot">
  <div class="panel">
    <button class="menu" type="button" aria-label="Abrir painel lateral" on:click={toggleMenu}>☰</button>

    <div class="stat">
      <span>Balance</span>
      <output aria-live="polite">{pretty(balance)}</output>
    </div>

    <div class="stat">
      <span>Win</span>
      <output aria-live="polite">{pretty(lastWin)}</output>
    </div>

    <div class="stat bet">
      <span>Bet</span>
      <div class="betbox" role="group" aria-label="Ajustar aposta">
        <button type="button" on:click={() => adjustSmall(-1)} disabled={spinning} aria-label="Diminuir aposta">−</button>
        <output aria-live="polite">{pretty(bet)}</output>
        <button type="button" on:click={() => adjustSmall(1)} disabled={spinning} aria-label="Aumentar aposta">+</button>
      </div>
    </div>

    <div class="stepper" aria-label="Ajuste rápido de aposta">
      <button type="button" on:click={() => adjustBig(1)} disabled={spinning} aria-label="Aumentar aposta em 10">▲</button>
      <button type="button" on:click={() => adjustBig(-1)} disabled={spinning} aria-label="Diminuir aposta em 10">▼</button>
    </div>

    <button class="spin" type="button" on:click={spin} disabled={spinning}>
      <span>Spin</span>
      <small>{spinning ? 'Rolling...' : 'Fire!'}</small>
    </button>

    <button
      class="action auto"
      type="button"
      aria-pressed={autoActive}
      class:auto-on={autoActive}
      on:click={openAuto}
      aria-label={autoActive ? 'Parar auto spin' : 'Abrir auto spin'}
    >⟳</button>

    <button class="action fullscreen" type="button" on:click={toggleFullscreen} aria-label="Alternar tela cheia">⤢</button>

    <button class="action info" type="button" on:click={info} aria-label="Info e paytable">i</button>
  </div>
</div>

<style>
  .hud {
    width: 100%;
    display: flex;
    justify-content: center;
    pointer-events: none;
  }
  .panel {
    pointer-events: auto;
    width: 100%;
    max-width: 1400px;
    background: rgba(5, 7, 14, 0.92);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 24px;
    padding: 18px clamp(16px, 4vw, 32px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.55);
    display: flex;
    align-items: center;
    gap: 18px;
    flex-wrap: wrap;
  }
  .menu {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    font-size: 1.4rem;
  }
  .stat {
    width: 180px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .stat span {
    font-size: 0.75rem;
    text-transform: uppercase;
    opacity: 0.7;
    letter-spacing: 0.05em;
  }
  .stat output {
    font-weight: 800;
    font-size: 1.15rem;
  }
  .bet .betbox {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .bet .betbox button {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
    font-weight: 700;
  }
  .stepper {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .stepper button {
    width: 48px;
    height: 24px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.08);
    color: #fff;
  }
  .spin {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: none;
    background: radial-gradient(circle at 30% 20%, #fff1a0, #ff7c38);
    color: #1c0f05;
    font-size: 1.3rem;
    font-weight: 800;
    box-shadow: 0 14px 30px rgba(255, 123, 0, 0.35);
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
  .spin small {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
  }
  .action {
    width: 60px;
    height: 60px;
    border-radius: 16px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    font-size: 1.2rem;
  }
  .auto-on {
    background: linear-gradient(120deg, #ffec8a, #ff8f3b);
    color: #1c0f04;
    border: none;
  }
  button {
    font-family: inherit;
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  @media (max-width: 1100px) {
    .panel {
      justify-content: center;
    }
  }
</style>
