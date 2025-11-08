<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

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

type MascotMood = 'idle' | 'spin' | 'celebrate' | 'sad';

let showIntro = true;
let showSettings = false;
let showAuto = false;
let showModes = false;

  let music = 0.6, sfx = 0.9, muted = false;

  let autoCount: number | null = null;
  let autoRules = { stopOnBonus: true, stopOnWinAbove: 0, stopOnBalanceBelow: 0 };

let viewEl: HTMLDivElement;
let mascotMood: MascotMood = 'idle';
let mascotTimer: ReturnType<typeof setTimeout> | null = null;

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

  onDestroy(() => {
    if (mascotTimer) clearTimeout(mascotTimer);
  });

  function setMascotMood(mood: MascotMood, backToIdleAfter = 0) {
    mascotMood = mood;
    if (mascotTimer) {
      clearTimeout(mascotTimer);
      mascotTimer = null;
    }
    if (backToIdleAfter > 0) {
      mascotTimer = window.setTimeout(() => {
        mascotMood = 'idle';
        mascotTimer = null;
      }, backToIdleAfter);
    }
  }

  const mascotCaption: Record<MascotMood, string> = {
    idle: 'Make those reels pay!',
    spin: 'Launching freedom spin...',
    celebrate: 'USA! USA! JACKPOT!',
    sad: 'We go again, soldier.'
  };

  function wireEvents() {
    emitter.on('spinStart', () => {
      spinning = true;
      setMascotMood('spin');
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
      setMascotMood(totalWin > 0 ? 'celebrate' : 'sad', 2600);

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

<div class="bg">
  <div class="bg-stars"></div>
  <div class="bg-stripes"></div>
</div>

<div class="scene">
  <div class="hero-column">
    <div class={`mascot ${mascotMood}`}>
      <div class="mascot-glow"></div>
      <div class="mascot-figure">
        <div class="mascot-head">
          <div class="hair"></div>
          <div class="eyes"></div>
          <div class="mouth"></div>
        </div>
        <div class="mascot-body">
          <div class="suit"></div>
          <div class="tie"></div>
          <div class="flag-pin"></div>
        </div>
        <div class="mascot-prop"></div>
      </div>
      <div class="mascot-caption">{mascotCaption[mascotMood]}</div>
    </div>

    <div class="hero-card">
      <h3>'Merica: Brainrot Bonanza</h3>
      <p>243 ways + Sticky Wilds + Hype Meter + Bonus Buys.</p>
      <p class="badge">RTP alvo 96.67% | Top win 5,000x</p>
    </div>
  </div>

  <div class="game-column">
    <div class="stage-shell">
      <div class="stage-frame"></div>
      <div class="stage-holder">
        <div class="stage-shine"></div>
        <div class="stage-vignette"></div>
        <div bind:this={viewEl} class="stage"></div>
      </div>
      <div class="stage-bottom-light"></div>
    </div>

    <div class="hud-slot">
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
  </div>
</div>

<Intro open={showIntro} on:start={onStart} />
<Settings open={showSettings} {music} {sfx} {muted} on:change={changeAudio} on:close={() => (showSettings = false)} />
<Autoplay open={showAuto} on:apply={applyAuto} on:close={() => (showAuto = false)} />
<ModePanel open={showModes} on:mode={onMode} on:buy={onBuy} on:close={() => (showModes = false)} />

<style>
.bg{
  position:fixed;
  inset:0;
  overflow:hidden;
  background:linear-gradient(180deg,#0a1424,#080b10 70%,#050608);
}
.bg::before{
  content:'';
  position:absolute;
  inset:0;
  background:radial-gradient(60% 40% at 50% 30%,rgba(255,255,255,.08),transparent),
    linear-gradient(135deg,rgba(255,255,255,.06),transparent 60%);
  animation:bgGlow 12s ease-in-out infinite alternate;
}
.bg-stars,
.bg-stripes{
  position:absolute;
  inset:0;
}
.bg-stars{
  background-image:
    radial-gradient(circle at 10% 20%,rgba(255,255,255,.15) 0 2px,transparent 40px),
    radial-gradient(circle at 40% 60%,rgba(255,255,255,.1) 0 2px,transparent 30px),
    radial-gradient(circle at 80% 30%,rgba(255,255,255,.12) 0 2px,transparent 25px);
  animation:starDrift 22s linear infinite;
}
.bg-stripes{
  background:linear-gradient(120deg,rgba(255,0,0,.06) 25%,transparent 25% 50%,rgba(0,102,255,.08) 50% 75%,transparent 75%);
  background-size:260px 260px;
  animation:stripes 30s linear infinite;
}

@keyframes bgGlow{
  0%{opacity:.5; transform:scale(1);}
  100%{opacity:.8; transform:scale(1.1);}
}
@keyframes starDrift{
  0%{transform:translateY(0);}
  100%{transform:translateY(-80px);}
}
@keyframes stripes{
  0%{background-position:0 0;}
  100%{background-position:320px 0;}
}

.scene{
  position:relative;
  min-height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  gap:clamp(24px,4vw,60px);
  padding:clamp(20px,4vw,60px);
  z-index:1;
  flex-wrap:wrap;
}

.hero-column{
  width:min(320px,30vw);
  display:flex;
  flex-direction:column;
  gap:18px;
  color:#fff;
}

.mascot{
  position:relative;
  border-radius:28px;
  padding:18px;
  background:radial-gradient(circle at 20% 20%,rgba(255,255,255,.15),rgba(15,8,4,.9));
  border:1px solid rgba(255,214,153,.3);
  box-shadow:0 25px 60px rgba(0,0,0,.6);
  overflow:hidden;
  transition:transform .35s ease;
}
.mascot::after{
  content:'';
  position:absolute;
  inset:4px;
  border-radius:24px;
  border:1px solid rgba(255,255,255,.08);
  pointer-events:none;
}
.mascot.spin{transform:translateY(-4px) rotate(-1deg);}
.mascot.celebrate{transform:translateY(-6px) rotate(1deg);}
.mascot.sad{transform:translateY(2px) scale(.98);}

.mascot-glow{
  position:absolute;
  inset:-40px;
  background:radial-gradient(circle,rgba(255,190,46,.25),transparent 55%);
  filter:blur(20px);
}

.mascot-figure{
  position:relative;
  width:100%;
  aspect-ratio:3/4;
  border-radius:22px;
  background:linear-gradient(180deg,#341b0f,#120802 70%);
  border:1px solid rgba(255,165,89,.2);
  box-shadow:inset 0 0 20px rgba(0,0,0,.6);
  overflow:hidden;
}
.mascot-head{
  position:absolute;
  top:14%;
  left:50%;
  width:58%;
  transform:translateX(-50%);
  height:30%;
  background:#ffdfb4;
  border-radius:50% 50% 42% 42%;
  box-shadow:0 4px 0 #d4934c;
}
.hair{
  position:absolute;
  top:-18%;
  left:0;
  right:0;
  height:40%;
  background:linear-gradient(90deg,#ffec7a,#ffbf37);
  border-radius:60% 60% 40% 40%;
  box-shadow:0 4px 0 rgba(0,0,0,.25);
}
.eyes{
  position:absolute;
  bottom:32%;
  left:50%;
  width:46%;
  height:18%;
  transform:translateX(-50%);
  display:flex;
  justify-content:space-between;
}
.eyes::before,
.eyes::after{
  content:'';
  width:32%;
  height:100%;
  background:#fff;
  border-radius:50%;
  box-shadow:inset 0 0 0 2px rgba(0,0,0,.35);
  background:radial-gradient(circle at 50% 50%,#0c1b3c 40%,#000 60%);
}
.mouth{
  position:absolute;
  bottom:16%;
  left:50%;
  width:28%;
  height:12%;
  transform:translateX(-50%);
  border-bottom:4px solid #b0542a;
  border-radius:0 0 50% 50%;
}

.mascot-body{
  position:absolute;
  bottom:12%;
  left:50%;
  transform:translateX(-50%);
  width:70%;
  height:40%;
}
.suit{
  position:absolute;
  inset:0;
  border-radius:32px 32px 16px 16px;
  background:linear-gradient(120deg,#161f55,#0b0f2b);
  border:2px solid rgba(255,255,255,.08);
}
.tie{
  position:absolute;
  top:10%;
  left:50%;
  width:14%;
  height:70%;
  background:linear-gradient(180deg,#ff2e4f,#c0132c);
  transform:translateX(-50%);
  border-radius:40% 40% 5px 5px;
}
.flag-pin{
  position:absolute;
  top:24%;
  right:12%;
  width:18px;
  height:12px;
  background:linear-gradient(90deg,#b71c1c 0 50%,#0c47a1 50% 100%);
  border:2px solid rgba(255,255,255,.3);
  border-radius:3px;
}
.mascot-prop{
  position:absolute;
  bottom:-8%;
  left:-6%;
  width:50%;
  height:50%;
  border-radius:50%;
  background:radial-gradient(circle,#f4b455,transparent 70%);
  filter:blur(8px);
}
.mascot-caption{
  font-weight:700;
  margin-top:12px;
  text-shadow:0 2px 8px rgba(0,0,0,.5);
}

.hero-card{
  border-radius:22px;
  padding:16px 18px;
  background:rgba(11,13,22,.8);
  border:1px solid rgba(255,255,255,.08);
  backdrop-filter:blur(8px);
  box-shadow:0 12px 24px rgba(0,0,0,.4);
}
.hero-card h3{
  margin:0 0 6px;
  font-size:1.25rem;
}
.hero-card p{
  margin:4px 0;
  opacity:.85;
}
.hero-card .badge{
  font-size:.85rem;
  text-transform:uppercase;
  letter-spacing:.04em;
}

.game-column{
  position:relative;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:28px;
  width:min(92vw,1280px);
  padding-bottom:40px;
}

.stage-shell{
  position:relative;
  width:100%;
  aspect-ratio:16/9;
  border-radius:32px;
  padding:clamp(12px,2vw,28px);
  background:linear-gradient(180deg,#42220c,#1d0c05 65%,#0c0804);
  box-shadow:0 40px 80px rgba(0,0,0,.55), inset 0 0 40px rgba(255,196,109,.05);
}
.stage-frame{
  position:absolute;
  inset:12px;
  border-radius:26px;
  border:2px solid rgba(255,207,134,.35);
  pointer-events:none;
}
.stage-holder{
  position:relative;
  width:100%;
  height:100%;
  border-radius:22px;
  overflow:hidden;
  background:#04070c;
  box-shadow:inset 0 0 40px rgba(0,0,0,.9);
}
.stage-shine{
  position:absolute;
  inset:-20%;
  background:radial-gradient(circle at 50% 20%,rgba(255,255,255,.12),transparent 60%);
  pointer-events:none;
}
.stage-vignette{
  position:absolute;
  inset:0;
  background:radial-gradient(circle at 50% 100%,transparent 50%,rgba(0,0,0,.55) 100%);
  pointer-events:none;
}
.stage-bottom-light{
  position:absolute;
  left:50%;
  bottom:0;
  width:50%;
  height:18px;
  transform:translateX(-50%);
  background:radial-gradient(circle,rgba(255,190,92,.8),transparent 70%);
  filter:blur(6px);
  opacity:.4;
}
.stage{
  position:relative;
  width:100%;
  height:100%;
}

.hud-slot{
  width:100%;
  display:flex;
  justify-content:center;
  margin-top:-36px;
  position:relative;
  z-index:5;
}

@media (max-width: 1100px) {
  .scene{
    flex-direction:column;
  }
  .hero-column{
    width:100%;
    max-width:520px;
    flex-direction:row;
  }
  .mascot{
    flex:1;
  }
  .hero-card{
    flex:1;
  }
}
</style>
