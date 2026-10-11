/**
 * Procedural Web Audio bed + stingers (no external audio files).
 * Unlock on first user gesture; events call sfx()/setAmbience().
 */

export type SfxKind =
  | "ui"
  | "build"
  | "buy"
  | "send"
  | "hit"
  | "goal"
  | "cheer"
  | "storm"
  | "beer"
  | "whistle"
  | "defeat"
  | "victory";

type AmbienceMode = "menu" | "match" | "hype" | "off";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let ambGain: GainNode | null = null;
let ambNodes: AudioNode[] = [];
let unlocked = false;
let muted = false;
let ambience: AmbienceMode = "off";
let lastSfxAt = 0;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;
    master.connect(ctx.destination);
    ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    ambGain.connect(master);
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = ensure();
  if (!c) return;
  if (c.state === "suspended") void c.resume();
  unlocked = true;
  if (ambience !== "off") startAmbience(ambience);
}

export function isAudioUnlocked(): boolean {
  return unlocked;
}

export function setMuted(m: boolean): void {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.55;
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain = 0.12,
  when = 0,
  slideTo?: number,
): void {
  const c = ensure();
  if (!c || !master || muted || !unlocked) return;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, slideTo),
      t0 + dur,
    );
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur: number, gain = 0.08, when = 0, hp = 400): void {
  const c = ensure();
  if (!c || !master || muted || !unlocked) return;
  const t0 = c.currentTime + when;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const filter = c.createBiquadFilter();
  filter.type = "highpass";
  filter.frequency.value = hp;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter);
  filter.connect(g);
  g.connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

export function sfx(kind: SfxKind): void {
  const now = performance.now();
  if (kind !== "goal" && kind !== "victory" && kind !== "storm") {
    if (now - lastSfxAt < 40) return;
  }
  lastSfxAt = now;
  unlockAudio();
  switch (kind) {
    case "ui":
      tone(660, 0.06, "sine", 0.06);
      break;
    case "build":
      tone(220, 0.08, "triangle", 0.1);
      tone(330, 0.1, "triangle", 0.07, 0.05);
      noiseBurst(0.08, 0.04, 0, 200);
      break;
    case "buy":
      tone(520, 0.07, "sine", 0.08);
      tone(780, 0.09, "sine", 0.06, 0.06);
      break;
    case "send":
      tone(180, 0.12, "sawtooth", 0.05, 0, 90);
      break;
    case "hit":
      noiseBurst(0.07, 0.1, 0, 180);
      tone(120, 0.08, "square", 0.05);
      break;
    case "goal":
      tone(392, 0.18, "triangle", 0.12);
      tone(523, 0.2, "triangle", 0.1, 0.12);
      tone(659, 0.28, "triangle", 0.1, 0.26);
      noiseBurst(0.25, 0.06, 0.1, 600);
      break;
    case "cheer":
      noiseBurst(0.35, 0.05, 0, 800);
      tone(440, 0.15, "sine", 0.04, 0.05);
      break;
    case "storm":
      tone(110, 0.4, "sawtooth", 0.08, 0, 55);
      noiseBurst(0.45, 0.09, 0, 150);
      tone(220, 0.25, "square", 0.05, 0.2);
      break;
    case "beer":
      tone(180, 0.05, "sine", 0.05);
      tone(90, 0.08, "triangle", 0.04, 0.04);
      break;
    case "whistle":
      tone(1800, 0.15, "sine", 0.07, 0, 1400);
      break;
    case "victory":
      tone(523, 0.16, "triangle", 0.1);
      tone(659, 0.18, "triangle", 0.1, 0.14);
      tone(784, 0.28, "triangle", 0.12, 0.3);
      break;
    case "defeat":
      tone(220, 0.25, "triangle", 0.08, 0, 110);
      tone(165, 0.35, "sine", 0.07, 0.15);
      break;
  }
}

function stopAmbienceNodes(): void {
  for (const n of ambNodes) {
    try {
      (n as OscillatorNode).stop?.();
    } catch {
      /* already stopped */
    }
    try {
      n.disconnect();
    } catch {
      /* ok */
    }
  }
  ambNodes = [];
}

export function startAmbience(mode: AmbienceMode): void {
  // Avoid tearing down the bed every frame when match loop re-applies the same mode.
  if (mode === ambience && ambNodes.length > 0 && mode !== "off") return;
  ambience = mode;
  const c = ensure();
  if (!c || !ambGain || !unlocked || muted) return;
  stopAmbienceNodes();
  if (mode === "off") {
    ambGain.gain.cancelScheduledValues(c.currentTime);
    ambGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    return;
  }
  const target = mode === "hype" ? 0.09 : mode === "match" ? 0.055 : 0.03;
  ambGain.gain.cancelScheduledValues(c.currentTime);
  ambGain.gain.linearRampToValueAtTime(target, c.currentTime + 0.6);

  const mkPad = (f: number, type: OscillatorType, g = 0.25) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.value = g;
    lfo.frequency.value = 0.08 + Math.random() * 0.05;
    lfoG.gain.value = f * 0.01;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ambGain!);
    osc.start();
    lfo.start();
    ambNodes.push(osc, lfo, gain, lfoG);
  };

  if (mode === "menu") {
    mkPad(110, "sine", 0.2);
    mkPad(164.8, "triangle", 0.12);
  } else if (mode === "match") {
    mkPad(98, "sine", 0.22);
    mkPad(146.8, "triangle", 0.1);
    mkPad(196, "sine", 0.06);
    // soft crowd hiss
    const n = Math.floor(c.sampleRate * 2);
    const buf = c.createBuffer(1, n, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * 0.35;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 900;
    bp.Q.value = 0.7;
    const g = c.createGain();
    g.gain.value = 0.04;
    src.connect(bp);
    bp.connect(g);
    g.connect(ambGain);
    src.start();
    ambNodes.push(src, bp, g);
  } else if (mode === "hype") {
    mkPad(130.8, "sawtooth", 0.08);
    mkPad(196, "triangle", 0.1);
    mkPad(261.6, "sine", 0.07);
  }
}

export function setAmbienceFromMatch(opts: {
  celebrating: boolean;
  storming: boolean;
  momentumAbs: number;
}): void {
  if (opts.storming || opts.celebrating || opts.momentumAbs > 0.65) {
    startAmbience("hype");
  } else {
    startAmbience("match");
  }
}
