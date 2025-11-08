<script lang="ts">
  import { onMount } from 'svelte';

  import Intro from './ui/Intro.svelte';
  import Settings from './ui/Settings.svelte';
  import Autoplay from './ui/Autoplay.svelte';
  import ModePanel from './ui/ModePanel.svelte';
  import Hud from './ui/Hud.svelte';

  import { createStage, type StageAPI } from './stage/createStage';
  import emitter from './events/emitter';

  import { authenticate, play, endRound, getRgsUrl } from './rgs/client';

  let stage: StageAPI | null = null;

  let spinning = false;
  let turbo = false;

  let balance = 100_000_000; // 100.00
  let bet = 1_000_000;       // 1.00
  let mode = 'base';

  let totalWin = 0;
  let lastWin = 0;
  let lastWinDisplay = 0;

  let fsIndex = 0;
  let fsTotal = 0;
  let hype = 0;

  let showIntro = true;
  let showSettings = false;
  let showAuto = false;
  let showModes = false;

  let music = 0.6, sfx = 0.9, muted = false;

  let autoCount: number | null = null;
  let autoRules = { stopOnBonus: true, stopOnWinAbove: 0, stopOnBalanceBelow: 0 };

  let viewEl: HTMLDivElement;

  const sleep = (ms:number)=> new Promise(r=>setTimeout(r,ms));

  function haveRgs(): boolean {
    try { return !!getRgsUrl(); } catch { return false; }
  }

  onMount(() => {
    // IIFE assíncrona, cleanup síncrono
    (async () => {
      stage = await createStage(viewEl);

      try {
        if (haveRgs()) {
          const auth = await authenticate();
          balance = auth.balance ?? balance;
        }
      } catch (err) {
        console.warn('authenticate falhou (modo debug ok):', err);
      }

      wireEvents();
    })();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') stopAuto();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
    };
  });

  function wireEvents() {
    emitter.on('spinStart', () => {
      spinning = true;
      totalWin = 0; lastWin = 0; lastWinDisplay = 0;
      fsIndex = 0; fsTotal = 0; hype = 0;
      stage?.setFsMode(false);
      stage?.clearRespin();
      stage?.startSpin();   // ativa rolagem real
    });

    emitter.on('reelStop', async (e:any) => {
      stage?.setColumn(e.reel, e.symbols); // para a coluna
      await sleep(turbo ? 20 : 60);
    });

    emitter.on('waysWin', async (e:any) => {
      const raw = (e.ways ?? []).reduce((acc:number,w:any)=>acc+(w.win??0),0);
      lastWin = raw; totalWin += raw;
      animateTo(v => lastWinDisplay = v, lastWinDisplay, lastWin, turbo?140:220);
      await sleep(turbo ? 80 : 160);
    });

    emitter.on('setTotalWin', (e:any) => { totalWin = e.amount ?? totalWin; });

    // FS
    emitter.on('fsStart', (e:any) => { fsIndex = 0; fsTotal = e.totalSpins ?? 0; stage?.setFsMode(true); });
    emitter.on('fsSpinStart', (e:any) => { fsIndex = e.index ?? fsIndex; });
    emitter.on('stickyWildAdd', async (e:any) => { stage?.setSticky(e.reel, e.row, e.mult); await sleep(turbo?40:120); });
    emitter.on('hypeUp', async (e:any) => { hype = e.value ?? hype; stage?.setHype(hype); await sleep(turbo?40:120); });
    emitter.on('fsEnd', () => { stage?.setFsMode(false); });

    // Respin
    emitter.on('respinStart', () => { stage?.flashRespin(); });
    emitter.on('reelLock', (e:any) => { stage?.setReelLocked(e.reels ?? []); });

    // Final
    emitter.on('finalWin', async () => {
      balance += totalWin;
      try {
        if (haveRgs()) await endRound({ totalWin });
      } catch (err) {
        console.warn('endRound falhou (debug ok):', err);
      }
      spinning = false;
      stage?.endSpin();

      // autoplay loop
      if (autoCount !== null) {
        const stopBonus = autoRules.stopOnBonus && fsTotal > 0;
        const stopOnBig = autoRules.stopOnWinAbove > 0 && (totalWin >= autoRules.stopOnWinAbove * bet);
        const stopOnLow = autoRules.stopOnBalanceBelow > 0 && (balance/1_000_000 < autoRules.stopOnBalanceBelow);

        if (!stopBonus && !stopOnBig && !stopOnLow && autoCount !== null) {
          if (autoCount !== Infinity) autoCount = Math.max(0, (autoCount ?? 0) - 1);
          if (autoCount === Infinity || (autoCount ?? 0) > 0) {
            await sleep(turbo ? 100 : 350);
            void onSpin();
          } else {
            autoCount = null;
          }
        } else {
          autoCount = null;
        }
      }
    });
  }

  function animateTo(setter:(n:number)=>void, from:number, to:number, ms=350){
    const start = performance.now();
    function step(now:number){
      const t = Math.min(1,(now-start)/ms);
      setter(Math.round(from + (to-from)*t));
      if (t<1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  async function onSpin() {
    if (spinning) return;
    if (bet > balance) return;

    if (haveRgs()) {
      try {
        await play({ bet, mode });
      } catch (err) {
        console.error('play error:', err);
      }
      return;
    }

    // Fallback DEBUG
    emitter.emit('spinStart', undefined);
    const symbolsSet = [
      ['A','E','W2'], ['E','E','G'], ['E','W3','G'], ['H','A','D'], ['I','A','D']
    ];
    for (let r=1;r<=5;r++){
      await sleep(r===3 ? (turbo?120:220) : (turbo?40:140));
      emitter.emit('reelStop', { reel:r, symbols: symbolsSet[r-1] });
    }
    await sleep(turbo?80:160);
    emitter.emit('waysWin', { ways:[ { win: 250000 }, { win: 500000 } ] });
    emitter.emit('setTotalWin', { amount: 750000 });
    await sleep(turbo?120:300);
    emitter.emit('finalWin', undefined);
  }

  function onStart(){ showIntro = false; }
  function changeAudio(e:any){ ({ music, sfx, muted } = e.detail); }

  function applyAuto(e:any){
    autoCount = e.detail.count;                  // número ou Infinity
    autoRules = e.detail.rules;
    showAuto = false;
    if (!spinning) onSpin();
  }

  function stopAuto(){
    autoCount = null;                            // cancela (spin atual termina)
  }

  function onMode(e:any){ mode = e.detail.mode; showModes = false; }
  async function onBuy(e:any){ mode = e.detail.mode; showModes = false; if (!spinning) await onSpin(); }
</script>

<div class="bg"></div>

<div class="wrap">
  <div class="left-mask">
    <div class="mascot"><div class="face">🦅</div></div>
  </div>

  <div class="stage-holder">
    <div bind:this={viewEl} class="stage"></div>
  </div>

  <Hud
    {balance} bind:bet bind:mode bind:turbo
    lastWin={lastWinDisplay}
    {fsIndex} {fsTotal} {hype}
    {spinning}
    autoActive={autoCount !== null}
    onStopAuto={stopAuto}
    onSpin={onSpin}
    onInfo={() => (showIntro = true)}
    on:openAuto={() => (showAuto = true)}
    on:openSettings={() => (showSettings = true)}
    on:openModes={() => (showModes = true)}
  />
</div>

<Intro open={showIntro} on:start={onStart} />
<Settings open={showSettings} {music} {sfx} {muted} on:change={changeAudio} on:close={() => (showSettings = false)} />
<Autoplay open={showAuto} on:apply={applyAuto} on:close={() => (showAuto = false)} />
<ModePanel open={showModes} on:mode={onMode} on:buy={onBuy} on:close={() => (showModes = false)} />

<style>
.bg{
  position:fixed; inset:0;
  background:
    radial-gradient(80% 60% at 50% 40%, rgba(255,255,255,.05), transparent 60%),
    repeating-linear-gradient(45deg, rgba(255,255,255,.02) 0 8px, transparent 8px 16px),
    linear-gradient(180deg, #101318, #0b0c10 60%, #0a0a0a);
  animation: bgmove 18s linear infinite;
}
@keyframes bgmove{
  0%{ background-position: 0 0, 0 0, 0 0; }
  100%{ background-position: 0 0, 800px 0, 0 0; }
}

.wrap{
  position:relative;
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:24px;
}

.left-mask{
  position:absolute; left:0; top:0; bottom:0; width:min(22vw,280px);
  display:flex; align-items:center; justify-content:center;
  pointer-events:none;
}
.mascot{
  width:min(18vw,220px); aspect-ratio:1/1;
  border-radius:18px; background:#111; border:1px solid #222;
  display:flex; align-items:center; justify-content:center;
  box-shadow:0 10px 30px rgba(0,0,0,.4);
}
.face{font-size:min(12vw,96px)}

.stage-holder{
  width:min(92vw,1280px);
  height:min(80vh,720px);
  border-radius:20px; border:1px solid #2a2a2a; background:rgba(0,0,0,.35);
  backdrop-filter: blur(2px);
  overflow:hidden;
  display:flex; align-items:center; justify-content:center;
}

.stage{ width:100%; height:100%; }
</style>
