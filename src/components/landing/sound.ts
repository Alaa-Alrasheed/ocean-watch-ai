/**
 * Opt-in underwater ambience, synthesised with WebAudio (no audio files):
 * low-passed brown noise that slowly swells, random bubble bloops, and a
 * sonar ping with echoes for the hero's click-to-ping.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let echo: DelayNode | null = null;
let sources: AudioScheduledSourceNode[] = [];
let bubbleTimer = 0;

export const ambience = { on: false, toggle, ping };

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
  lp.frequency.value = 380;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoDepth = ctx.createGain();
  lfoDepth.gain.value = 140;
  lfo.connect(lfoDepth).connect(lp.frequency);
  const bed = ctx.createGain();
  bed.gain.value = 0.55;
  noise.connect(lp).connect(bed).connect(master);
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
  bubbles();
}

function stop() {
  ambience.on = false;
  clearTimeout(bubbleTimer);
  if (!ctx || !master) return;
  const m = master, s = sources;
  m.gain.cancelScheduledValues(ctx.currentTime);
  m.gain.setValueAtTime(m.gain.value, ctx.currentTime);
  m.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);
  setTimeout(() => { s.forEach((n) => n.stop()); m.disconnect(); }, 500);
  master = echo = null;
}

function blip(freq: number, rise: number, peak: number, dur: number, toEcho = false) {
  if (!ctx || !master) return;
  const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.frequency.setValueAtTime(freq, t);
  o.frequency.exponentialRampToValueAtTime(freq * rise, t + Math.min(0.08, dur));
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  if (toEcho && echo) g.connect(echo);
  o.start(t);
  o.stop(t + dur + 0.05);
}

function bubbles() {
  bubbleTimer = window.setTimeout(() => {
    const n = 1 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) setTimeout(() => blip(300 + Math.random() * 700, 2.2, 0.05, 0.09), i * (40 + Math.random() * 90));
    bubbles();
  }, 800 + Math.random() * 3500);
}

function ping() {
  if (ambience.on) blip(1400, 1, 0.22, 1.8, true);
}
