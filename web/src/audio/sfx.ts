let audioCtx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (audioCtx) return audioCtx;
  try {
    audioCtx = new AudioContext();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

function playTone(freq: number, duration = 0.2, type: OscillatorType = 'sine', gain = 0.2) {
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  osc.connect(g).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
}

export function playWinSound(power = 1) {
  const base = 280 + 40 * power;
  playTone(base, 0.18, 'triangle', 0.15 + 0.05 * power);
  setTimeout(() => playTone(base + 80, 0.18, 'triangle', 0.12 + 0.04 * power), 90);
  setTimeout(() => playTone(base + 140, 0.22, 'square', 0.1 + 0.03 * power), 170);
}

export function playSpecialSound(kind: 'wild' | 'scatter' | 'high') {
  if (kind === 'wild') {
    playTone(460, 0.16, 'sawtooth', 0.18);
    setTimeout(() => playTone(520, 0.12, 'square', 0.16), 80);
  } else if (kind === 'scatter') {
    playTone(620, 0.2, 'triangle', 0.2);
    setTimeout(() => playTone(760, 0.2, 'triangle', 0.18), 100);
  } else {
    playTone(340, 0.18, 'square', 0.15);
  }
}
