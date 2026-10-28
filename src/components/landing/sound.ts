/**
 * Opt-in underwater ambience, synthesised with WebAudio (no audio files):
 * Brighter surface wash and frequent bubbles fade into low, sparse deep-water
 * pulses as the page descends.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let echo: DelayNode | null = null;
let bed: GainNode | null = null;
let bedFilter: BiquadFilterNode | null = null;
let surfaceWash: GainNode | null = null;
let deepPulseGain: GainNode | null = null;
let sources: AudioScheduledSourceNode[] = [];
let bubbleTimer = 0;
let deepPulseTimer = 0;
let depth = 0;

export const ambience = { on: false, toggle, ping, setDepth };

const clamp = (n: number) => Math.min(1, Math.max(0, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

/** Update the mix without restarting the user's audio. `depth` is 0..1. */
function setDepth(nextDepth: number) {
  depth = clamp(nextDepth);
  if (!ctx || !master || !bedFilter || !bed || !surfaceWash || !deepPulseGain) return;
  const t = ctx.currentTime;
  // Surface water carries more bright movement; deep water is mostly low rumble.
  bedFilter.frequency.setTargetAtTime(mix(760, 125, depth), t, 0.45);
  bed.gain.setTargetAtTime(mix(0.34, 0.62, depth), t, 0.45);
  surfaceWash.gain.setTargetAtTime(mix(0.2, 0.015, depth), t, 0.45);
  deepPulseGain.gain.setTargetAtTime(mix(0.01, 0.16, depth), t, 0.8);
}

function toggle(): boolean {
  if (ambience.on) stop(); else start();
  return ambience.on;
}

function start() {
  ctx ??= new AudioContext();
  void ctx.resume();
  const t = ctx.currentTime;
  master = ctx.createGain();
  master.gain.setValueAtTime(0, t);
  master.gain.linearRampToValueAtTime(1, t + 1.5);
  master.connect(ctx.destination);

  // the rumble: brown noise -> low-pass whose cutoff drifts (swell)
  const len = ctx.sampleRate * 4, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = last * 3.5; }
  const noise = ctx.createBufferSource();
  noise.buffer = buf;
  noise.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 760;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 220;
  lfo.connect(lfoDepth).connect(lp.frequency);
  bed = ctx.createGain();
  bedFilter = lp;
  bed.gain.value = 0.34;
  noise.connect(lp).connect(bed).connect(master);

  // A second, airier layer gives the surface a sense of swell and current.
  const washFilter = ctx.createBiquadFilter();
  washFilter.type = "bandpass";
  washFilter.frequency.value = 900;
  washFilter.Q.value = 0.45;
  surfaceWash = ctx.createGain();
  surfaceWash.gain.value = 0.2;
  noise.connect(washFilter).connect(surfaceWash).connect(master);

  // This node is quiet near the surface and becomes a distant, slow deep-water
  // resonance farther down the page.
  deepPulseGain = ctx.createGain();
  deepPulseGain.gain.value = 0.01;
  deepPulseGain.connect(master);
  noise.start();
  lfo.start();
  sources = [noise, lfo];

  // echo line for the sonar ping
  echo = ctx.createDelay(1);
  echo.delayTime.value = 0.34;
  const fb = ctx.createGain();
  fb.gain.value = 0.38;
  const tone = ctx.createBiquadFilter();
  tone.type = "lowpass";
  tone.frequency.value = 1800;
  echo.connect(fb).connect(echo);
  echo.connect(tone).connect(master);

  ambience.on = true;
  setDepth(depth);
  bubbles();
  deepPulses();
}

function stop() {
  ambience.on = false;
  clearTimeout(bubbleTimer);
  clearTimeout(deepPulseTimer);
  if (!ctx || !master) return;
  const m = master, s = sources;
  m.gain.cancelScheduledValues(ctx.currentTime);
  m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
  m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  setTimeout(() => { s.forEach((n) => n.stop()); m.disconnect(); }, 500);
  master = echo = bed = bedFilter = surfaceWash = deepPulseGain = null;
}

function blip(freq: number, rise: number, peak: number, dur: number, toEcho = false, deep = false) {
  if (!ctx || !master) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * rise, t + Math.min(0.08, dur));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(deep && deepPulseGain ? deepPulseGain : master);
  if (toEcho && echo) g.connect(echo);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function bubbles() {
  bubbleTimer = window.setTimeout(() => {
    const n = 1 + Math.floor(Math.random() * (depth < 0.45 ? 4 : 2));
    const base = mix(520, 180, depth);
    for (let i = 0; i < n; i++) {
      setTimeout(() => blip(base + Math.random() * mix(680, 220, depth), 2.2, mix(0.05, 0.025, depth), 0.09), i * (40 + Math.random() * 90));
    }
    bubbles();
  }, mix(900, 5200, depth) + Math.random() * mix(900, 3500, depth));
}

function deepPulses() {
  deepPulseTimer = window.setTimeout(() => {
    if (depth > 0.35) {
      const freq = mix(150, 58, depth) * (0.9 + Math.random() * 0.2);
      blip(freq, 0.72, mix(0.015, 0.075, depth), mix(1.8, 4.2, depth), false, true);
    }
    deepPulses();
  }, mix(5200, 12000, depth) + Math.random() * 3500);
}

function ping() {
  if (ambience.on) blip(1400, 1, 0.22, 1.8, true);
}
