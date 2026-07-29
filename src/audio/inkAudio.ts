/** 水墨風極輕音效（Web Audio）；尊重系統「減少動態」時靜音 */

let ctx: AudioContext | null = null;

function canPlay(): boolean {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return true;
}

function getCtx(): AudioContext | null {
  if (!canPlay()) return null;
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, dur = 0.08, type: OscillatorType = 'sine', gain = 0.03) {
  const ac = getCtx();
  if (!ac) return;
  const t0 = ac.currentTime;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

export function playInkTap() {
  // 短促「咔」感，避免拖長音拖慢手感
  tone(760, 0.022, 'square', 0.016);
  tone(420, 0.03, 'triangle', 0.012);
}

export function playInkSeal() {
  tone(220, 0.12, 'sine', 0.035);
  setTimeout(() => tone(330, 0.1, 'sine', 0.02), 40);
}

export function playInkWin() {
  tone(392, 0.1, 'sine', 0.03);
  setTimeout(() => tone(523, 0.12, 'sine', 0.025), 70);
}

export function playInkLose() {
  tone(180, 0.16, 'triangle', 0.03);
}
