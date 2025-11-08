<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  const dispatch = createEventDispatcher();
  export let open = true;

  let dontShow = false;
  const KEY = 'merica_intro_ack_v1';

  onMount(() => {
    if (localStorage.getItem(KEY) === '1') open = false;
  });

  function start() {
    if (dontShow) localStorage.setItem(KEY,'1');
    dispatch('start');
    open = false;
  }
</script>

{#if open}
<div class="intro">
  <div class="card">
    <h1>’MERICA: Brainrot Bonanza</h1>
    <p class="tag">satire • parody • memes</p>
    <div class="disclaimer">
      <strong>Aviso de Paródia</strong><br/>
      Personagens e símbolos são <em>caricaturas</em> e não representam pessoas reais de forma factual.
      Uso satírico para entretenimento — sem endosso. Jogue com responsabilidade. RTP alvo 96.67%.
    </div>

    <label class="chk">
      <input type="checkbox" bind:checked={dontShow}> não mostrar novamente
    </label>

    <button class="play" on:click={start}>PLAY</button>
  </div>
</div>
{/if}

<style>
.intro{position:fixed;inset:0;background:rgba(0,0,0,.6);display:grid;place-items:center;z-index:9000;}
.card{width:min(720px,92vw);background:#111; border:1px solid #2a2a2a; border-radius:16px; padding:28px; box-shadow:0 10px 40px rgba(0,0,0,.5)}
h1{margin:0 0 6px 0; font-size:28px}
.tag{opacity:.8;margin:0 0 14px 0}
.disclaimer{background:#181818;border:1px solid #2b2b2b;border-radius:12px;padding:14px;margin:8px 0 16px 0;line-height:1.35}
.chk{display:flex;gap:8px;align-items:center;margin-bottom:16px}
.play{width:100%;height:48px;border-radius:12px;border:0;background:#2a7; font-weight:700; font-size:16px}
.play:hover{filter:brightness(1.1); cursor:pointer}
</style>
