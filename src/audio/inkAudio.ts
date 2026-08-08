/** 水墨風極輕音效（Web Audio）；玩家可靜音，並尊重系統「減少動態」 */

const MUTE_KEY = 'ink_audio_muted';

let ctx: AudioContext | null = null;
let muted = false;

try {
  if (typeof localStorage !== 'undefined') {
    muted = localStorage.getItem(MUTE_KEY) === '1';
  }
} catch {
  muted = false;
}

export function isInkAudioMuted(): boolean {
  return muted;
}

export function setInkAudioMuted(next: boolean): void {
  muted = next;
  try {
    localStorage.setItem(MUTE_KEY, next ? '1' : '0');
  } catch {
    /* ignore */
  }
}

export function toggleInkAudioMuted(): boolean {
  setInkAudioMuted(!muted);
  return muted;
}

function canPlay(): boolean {
  if (typeof window === 'undefined') return false;
  if (muted) return false;
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

export function playInkHit() {
  tone(520, 0.04, 'square', 0.018);
}

export function playInkMiss() {
  tone(260, 0.05, 'triangle', 0.012);
}

/** 翻月／翻頁：極輕紙聲 */
export function playInkPageFlip() {
  tone(480, 0.035, 'triangle', 0.014);
  setTimeout(() => tone(360, 0.04, 'sine', 0.01), 28);
}

/** 出招：短刃氣 */
export function playInkBlade() {
  tone(640, 0.03, 'square', 0.012);
  setTimeout(() => tone(280, 0.05, 'triangle', 0.01), 20);
}
