<!-- /src/ui/Hud.svelte -->
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

  export let onSpin: (()=>void) | null = null;
  export let onInfo: (()=>void) | null = null;

  const dispatch = createEventDispatcher();

  const pretty = (n:number)=> (n/1_000_000).toLocaleString(undefined,{minimumFractionDigits:2, maximumFractionDigits:2});

  function spin(){ onSpin?.(); }
  function info(){ onInfo?.(); }
  const modeLabel = (m:string)=> m.replace(/_/g,' ').toUpperCase();
</script>

<div class="hud" role="region" aria-label="Controles">
  <div class="row">
    <div class="group">
      <div class="cell">
        <span class="label">Balance</span>
        <output class="val" aria-live="polite">{pretty(balance)}</output>
      </div>

      <div class="cell bet">
        <span class="label">Bet</span>
        <div class="betbox" role="group" aria-label="Aposta">
          <button type="button" on:click={() => bet = Math.max(1_000_000, bet - 1_000_000)} disabled={spinning} aria-label="Diminuir aposta">-</button>
          <output class="val" aria-live="polite">{pretty(bet)}</output>
          <button type="button" on:click={() => bet = bet + 1_000_000} disabled={spinning} aria-label="Aumentar aposta">+</button>
        </div>
      </div>

      <div class="cell">
        <span class="label">Win</span>
        <output class="val" aria-live="polite">{pretty(lastWin)}</output>
      </div>

      <div class="cell">
        <input id="turbo" type="checkbox" bind:checked={turbo} disabled={spinning} />
        <label for="turbo">Turbo</label>
      </div>
    </div>

    <div class="group right">
      <div class="badge" aria-live="polite">
        🎆 FS: {fsIndex}/{fsTotal} — Hype x{hype} — Mode: {modeLabel(mode)}
      </div>

      <div class="actions" role="group" aria-label="Ações">
        <button class="spin" type="button" on:click={spin} disabled={spinning}>SPIN</button>
        <button class="info" type="button" on:click={info}>INFO</button>
        <button class="ghost" type="button" on:click={() => dispatch('openAuto')}>AUTO</button>
        <button class="ghost" type="button" on:click={() => dispatch('openModes')}>MODOS</button>
        <button class="ghost" type="button" on:click={() => dispatch('openSettings')}>⚙</button>
      </div>
    </div>
  </div>
</div>

<style>
.hud{position:absolute;left:0;right:0;bottom:0;padding:10px 18px}
.row{display:flex;justify-content:space-between;gap:14px;align-items:center}
.group{display:flex;gap:16px;align-items:center}
.group.right{margin-left:auto}
.cell{display:flex;gap:8px;align-items:center;background:#141414;border:1px solid #242424;border-radius:12px;padding:10px 12px}
.cell .label{opacity:.85}
.betbox{display:flex;gap:10px;align-items:center}
.val{font-weight:800}
.badge{background:#171717;border:1px solid #2a2a2a;border-radius:10px;padding:8px 10px}
.actions{display:flex;gap:8px}
button{background:#222;border:1px solid #383838;border-radius:10px;padding:10px 14px;font-weight:800}
button.spin{background:#2c3f7a;border-color:#3a59a8}
button[disabled]{opacity:.5;cursor:not-allowed}
.ghost{background:transparent}
</style>
