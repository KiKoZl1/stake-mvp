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

  onMount(async () => {
    // >>>>>>>>>>> IMPORTANTE: agora é async (Pixi v8)
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
  });

  function wireEvents() {
    emitter.on('spinStart', () => {
      spinning = true;
      totalWin = 0; lastWin = 0; lastWinDisplay = 0;
      fsIndex = 0; fsTotal = 0; hype = 0;
      stage?.setFsMode(false);
      stage?.clearRespin();
      stage?.startSpin();
    });

    emitter.on('reelStop', async (e:any) => {
      stage?.setColumn(e.reel, e.symbols);
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

      if (autoCount !== null) {
        const stopBonus = autoRules.stopOnBonus && fsTotal > 0;
        const stopOnBig = autoRules.stopOnWinAbove > 0 && (totalWin >= autoRules.stopOnWinAbove * bet);
        const stopOnLow = autoRules.stopOnBalanceBelow > 0 && (balance/1_000_000 < autoRules.stopOnBalanceBelow);

        if (!stopBonus && !stopOnBig && !stopOnLow) {
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

    // --------- Fallback DEBUG (sem RGS) ----------
    await debugSpin();
  }

  async function debugSpin() {
    emitter.emit('spinStart', undefined);

    const symbolsSet = [
      ['A','E','W2'], ['E','E','G'], ['E','W3','G'], ['H','A','D'], ['I','A','D']
    ];
    for (let r=1;r<=5;r++){
      emitter.emit('reelStop', { reel:r, symbols: symbolsSet[r-1] });
      await sleep(turbo ? 40 : 160);
    }

    emitter.emit('waysWin', { ways:[
      { win: 250000 }, { win: 500000 }
    ]});
    emitter.emit('setTotalWin', { amount: 750000 });

    await sleep(turbo ? 120 : 300);
    emitter.emit('finalWin', undefined);
  }

  function onStart(){ showIntro = false; }
  function changeAudio(e:any){ ({ music, sfx, muted } = e.detail); }
  function applyAuto(e:any){
    autoCount = e.detail.count;
    autoRules = e.detail.rules;
    showAuto = false;
    if (!spinning) onSpin();
  }
  function onMode(e:any){ mode = e.detail.mode; showModes = false; }
  async function onBuy(e:any){ mode = e.detail.mode; showModes = false; if (!spinning) await onSpin(); }
</script>

<div class="wrap">
  <div class="left-mask">
    <div class="mascot"><div class="face">😉</div></div>
  </div>

  <div class="stage-holder">
    <div bind:this={viewEl} class="stage"></div>
  </div>

  <Hud
    {balance} bind:bet bind:mode bind:turbo
    lastWin={lastWinDisplay}
    {fsIndex} {fsTotal} {hype}
    {spinning}
    onSpin={onSpin}
    onInfo={() => showIntro = true}
    on:openAuto={() => showAuto = true}
    on:openSettings={() => showSettings = true}
    on:openModes={() => showModes = true}
  />
</div>

<Intro open={showIntro} on:start={onStart} />
<Settings open={showSettings} {music} {sfx} {muted} on:change={changeAudio} on:close={() => showSettings = false} />
<Autoplay open={showAuto} on:apply={applyAuto} on:close={() => showAuto = false} />
<ModePanel open={showModes} on:mode={onMode} on:buy={onBuy} on:close={() => showModes = false} />
