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
  function toggleMenu() {
    dispatch('toggleMenu');
  }
</script>

<div class="hud" role="region" aria-label="Painel de controle do slot">
  <div class="panel">
    <button class="menu" type="button" on:click={toggleMenu} aria-label="Abrir painel lateral">☰</button>

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
        <button type="button" on:click={() => (bet = Math.max(1_000_000, bet - 1_000_000))} disabled={spinning} aria-label="Diminuir aposta">−</button>
        <output aria-live="polite">{pretty(bet)}</output>
        <button type="button" on:click={() => (bet = bet + 1_000_000)} disabled={spinning} aria-label="Aumentar aposta">+</button>
      </div>
    </div>

    <div class="stepper" aria-label="Ajuste rápido de aposta">
      <button type="button" on:click={() => (bet = bet + 1_000_000)} disabled={spinning} aria-label="Aumentar aposta rápido">▲</button>
      <button type="button" on:click={() => (bet = Math.max(1_000_000, bet - 1_000_000))} disabled={spinning} aria-label="Diminuir aposta rápido">▼</button>
    </div>

    <button class="spin" type="button" on:click={spin} disabled={spinning}>
      <span>Spin</span>
      <small>{spinning ? 'Rolling...' : 'Fire!'}</small>
    </button>

    <div class="status-pills">
      <div class="pill">
        <span>FS</span>
        <strong>{fsIndex}/{fsTotal}</strong>
      </div>
      <div class="pill">
        <span>Hype</span>
        <strong>x{hype}</strong>
      </div>
      <div class="pill">
        <span>Mode</span>
        <strong>{modeLabel(mode)}</strong>
      </div>
    </div>

    <div class="icon-group" role="group" aria-label="Ações extras">
      <button type="button" class:active={turbo} aria-pressed={turbo} on:click={() => (turbo = !turbo)}>Turbo</button>
      <button type="button" on:click={() => dispatch('openAuto')}>Auto</button>
      <button type="button" on:click={() => dispatch('openModes')}>Modes</button>
      <button type="button" on:click={info}>Info</button>
      <button type="button" on:click={() => dispatch('openSettings')}>⚙</button>
      {#if autoActive}
        <button type="button" class="stop" on:click={stopAuto}>Stop</button>
      {/if}
    </div>
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
    gap: 2px;
  }
  .spin small {
    font-size: 0.7rem;
    letter-spacing: 0.08em;
  }
  .status-pills {
    display: flex;
    gap: 10px;
  }
  .pill {
    width: 120px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 6px 10px;
    text-align: center;
  }
  .pill span {
    font-size: 0.65rem;
    text-transform: uppercase;
    opacity: 0.7;
  }
  .pill strong {
    display: block;
    font-weight: 800;
  }
  .icon-group {
    margin-left: auto;
    display: flex;
    gap: 10px;
  }
  .icon-group button {
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: #fff;
    font-weight: 600;
  }
  .icon-group button.active {
    background: linear-gradient(120deg, #ffec8a, #ff8f3b);
    color: #1c0f04;
    border: none;
  }
  .stop {
    background: linear-gradient(120deg, #ff4d4d, #b4001a);
    border: none;
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
  @media (max-width: 1100px) {
    .panel {
      flex-wrap: wrap;
      justify-content: center;
    }
    .icon-group {
      width: 100%;
      justify-content: center;
      margin-left: 0;
    }
  }
</style>

