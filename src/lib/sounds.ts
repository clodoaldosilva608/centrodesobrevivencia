/**
 * Synthesized feedback sounds using Web Audio API.
 * No external files or backend needed.
 */

const SOUND_KEY = "sh_sounds_enabled";
const VOLUME_KEY = "sh_sounds_volume";

export function isSoundEnabled(): boolean {
  return localStorage.getItem(SOUND_KEY) !== "false";
}

export function getSoundVolume(): number {
  const v = localStorage.getItem(VOLUME_KEY);
  return v !== null ? parseFloat(v) : 0.8;
}

export function setSoundVolume(vol: number) {
  localStorage.setItem(VOLUME_KEY, String(Math.max(0, Math.min(1, vol))));
}

export function setSoundEnabled(enabled: boolean) {
  localStorage.setItem(SOUND_KEY, enabled ? "true" : "false");
}

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (!isSoundEnabled()) return null;
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function vol(base: number): number {
  return base * getSoundVolume();
}

function playTone(freq: number, duration: number, type: OscillatorType = "sine", gain = 0.15) {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  g.gain.setValueAtTime(vol(gain), ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

/** Short rising chime – point discovered */
export function playDiscoverSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  [523, 659, 784].forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    g.gain.setValueAtTime(vol(0.12), t + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.3);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.3);
  });
}

/** Triumphant fanfare – achievement unlocked */
export function playAchievementSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [523, 659, 784, 1047];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, t + i * 0.12);
    g.gain.setValueAtTime(vol(0.18), t + i * 0.12);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.45);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + i * 0.12);
    osc.stop(t + i * 0.12 + 0.45);
  });
}

/** Quick double-beep – milestone reached (50%) */
export function playMilestoneSound() {
  if (!isSoundEnabled()) return;
  playTone(880, 0.15, "square", vol(0.08));
  setTimeout(() => playTone(1100, 0.2, "square", vol(0.1)), 160);
}

/** Grand completion jingle – 100% category */
export function playCompletionSound() {
  const ctx = getCtx();
  if (!ctx) return;
  const t = ctx.currentTime;
  const notes = [784, 988, 1175, 1319, 1568];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, t + i * 0.1);
    g.gain.setValueAtTime(vol(0.14), t + i * 0.1);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.1 + 0.5);
    osc.connect(g).connect(ctx.destination);
    osc.start(t + i * 0.1);
    osc.stop(t + i * 0.1 + 0.5);
  });
}

/** XP gain blip */
export function playXPSound() {
  if (!isSoundEnabled()) return;
  playTone(1200, 0.1, "sine", vol(0.08));
}
