// Emberfall sounds: tiny WebAudio synth, no audio files, no network.
// Every blip is an oscillator envelope; mute toggles with M.
let ctx = null;
let muted = false;

export function isMuted() { return muted; }
export function toggleMute() { muted = !muted; return muted; }

function audio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (muted) return;
  const ac = audio();
  if (!ac) return;
  const t0 = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export const sfx = {
  click() { tone(660, 0.07, 'triangle', 0.12); },
  select() { tone(520, 0.09, 'sine', 0.14); tone(780, 0.09, 'sine', 0.1, 0.05); },
  play() { tone(392, 0.12, 'triangle', 0.16); tone(523, 0.14, 'triangle', 0.14, 0.07); },
  hit() { tone(180, 0.16, 'sawtooth', 0.16, 0, 90); },
  heal() { tone(523, 0.2, 'sine', 0.12); tone(659, 0.2, 'sine', 0.12, 0.08); tone(784, 0.26, 'sine', 0.12, 0.16); },
  draw() { tone(880, 0.08, 'sine', 0.08); },
  turn() { tone(330, 0.1, 'triangle', 0.12); tone(440, 0.12, 'triangle', 0.12, 0.08); },
  win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.3, 'triangle', 0.16, i * 0.13)); },
  lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.32, 'sine', 0.14, i * 0.15)); },
};
