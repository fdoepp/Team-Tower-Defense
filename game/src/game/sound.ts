/**
 * Procedural Web Audio — stadium bed + stingers (no external files).
 *
 * Reliability: AudioContext stays suspended until a user gesture; SFX during
 * that window are queued and flushed after unlock. A short confirm chirp
 * plays on first unlock so the player knows ton is live.
 *
 * Design: separate SFX / ambience buses, soft compressor on master, richer
 * layered stingers and a looping crowd bed that actually reads as a stadium.
 */
import { clubChantProfile } from "./feelPack";

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
  | "victory"
  | "prime";

type AmbienceMode = "menu" | "match" | "hype" | "off";

const MUTE_KEY = "matchday-audio-muted";
const MASTER_GAIN = 0.95;
const SFX_GAIN = 0.85;
const AMB_MENU = 0.11;
const AMB_MATCH = 0.18;
const AMB_HYPE = 0.26;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let ambGain: GainNode | null = null;
let ambNodes: AudioNode[] = [];
let compressor: DynamicsCompressorNode | null = null;
let unlocked = false;
let muted = false;
let ambience: AmbienceMode = "off";
let lastSfxAt = 0;
let lastAmbienceSwitchAt = 0;
let gestureBound = false;
let resumeWait: Promise<void> | null = null;
let pendingSfx: SfxKind[] = [];
const PENDING_MAX = 18;
let primedOnce = false;
let crowdBuf: AudioBuffer | null = null;

let clubPlayerId = "ksc";
let clubAiId = "vfb";

try {
  if (typeof localStorage !== "undefined") {
    muted = localStorage.getItem(MUTE_KEY) === "1";
  }
} catch {
  /* private mode */
}

/** Bind current match clubs for procedural chant identity. */
export function setClubSoundIdentity(playerClub: string, aiClub: string): void {
  clubPlayerId = playerClub || "ksc";
  clubAiId = aiClub || "vfb";
}

/**
 * Short club-flavoured chant burst (procedural — not a real hymn).
 */
export function playClubChant(
  side: "player" | "ai" = "player",
  intensity = 0.6,
): void {
  if (!ready()) return;
  const id = side === "player" ? clubPlayerId : clubAiId;
  const p = clubChantProfile(id);
  const g = 0.08 + intensity * 0.14;
  tone(p.baseHz, 0.28, "triangle", g, 0);
  tone(p.baseHz * (1 + p.brightness * 0.45), 0.34, "sine", g * 0.75, 0.06);
  tone(p.baseHz * 1.5, 0.22, "triangle", g * 0.55, 0.12 / p.tempo);
  tone(p.baseHz * 2, 0.16, "sine", g * 0.35, 0.18 / p.tempo);
  noiseBurst(0.4 * intensity, 0.05 + intensity * 0.07, 0.04, 450 + p.brightness * 500);
}

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
    master.gain.value = muted ? 0 : MASTER_GAIN;

    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -18;
    compressor.knee.value = 12;
    compressor.ratio.value = 3.2;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.22;

    sfxBus = ctx.createGain();
    sfxBus.gain.value = SFX_GAIN;

    ambGain = ctx.createGain();
    ambGain.gain.value = 0;

    sfxBus.connect(compressor);
    ambGain.connect(compressor);
    compressor.connect(master);
    master.connect(ctx.destination);
  }
  return ctx;
}

function queueSfx(kind: SfxKind): void {
  pendingSfx.push(kind);
  while (pendingSfx.length > PENDING_MAX) pendingSfx.shift();
}

function flushPending(): void {
  if (!isContextRunning() || muted || !unlocked) return;
  const q = pendingSfx.splice(0, pendingSfx.length);
  for (const kind of q) playSfxNow(kind);
}

function isContextRunning(): boolean {
  const c = ctx ?? ensure();
  return !!c && c.state === "running";
}

function resumeContext(): Promise<void> {
  const c = ensure();
  if (!c) return Promise.resolve();
  if (c.state === "running") return Promise.resolve();
  if (resumeWait) return resumeWait;
  resumeWait = c
    .resume()
    .catch(() => {
      /* autoplay still blocked */
    })
    .then(() => {
      resumeWait = null;
      if (c.state === "running") {
        flushPending();
        if (ambience !== "off" && ambNodes.length === 0) startAmbience(ambience);
      }
    });
  return resumeWait;
}

/** Bind once: any pointer/key unlocks audio (autoplay policies). */
export function bindAudioGestures(): void {
  if (gestureBound || typeof window === "undefined") return;
  gestureBound = true;
  const unlock = () => {
    unlockAudio();
  };
  window.addEventListener("pointerdown", unlock, { capture: true });
  window.addEventListener("keydown", unlock, { capture: true });
  window.addEventListener("touchstart", unlock, { capture: true, passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && unlocked) {
      void resumeContext();
    }
  });
}

export function unlockAudio(): void {
  bindAudioGestures();
  const c = ensure();
  if (!c) return;
  unlocked = true;
  // iOS/Safari: silent buffer + tiny click in the same gesture
  try {
    if (c.state === "running" || c.state === "suspended") {
      const buf = c.createBuffer(1, 1, c.sampleRate);
      const src = c.createBufferSource();
      src.buffer = buf;
      src.connect(c.destination);
      src.start(0);
    }
  } catch {
    /* ignore */
  }
  void resumeContext().then(() => {
    if (c.state !== "running") return;
    flushPending();
    if (!primedOnce && !muted) {
      primedOnce = true;
      playSfxNow("prime");
    }
    if (ambience !== "off" && ambNodes.length === 0) startAmbience(ambience);
    else if (ambience === "off") {
      // Default bed once unlocked — menu hum until match overrides
      startAmbience("menu");
    }
  });
  if (c.state === "running") {
    flushPending();
    if (!primedOnce && !muted) {
      primedOnce = true;
      playSfxNow("prime");
    }
    if (ambience !== "off" && ambNodes.length === 0) startAmbience(ambience);
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked && isContextRunning();
}

export function isMuted(): boolean {
  return muted;
}

/** Debug / probes */
export function audioDebugState(): {
  unlocked: boolean;
  muted: boolean;
  ctxState: string | null;
  pending: number;
  ambience: AmbienceMode;
  ambNodes: number;
  primed: boolean;
} {
  return {
    unlocked,
    muted,
    ctxState: ctx?.state ?? null,
    pending: pendingSfx.length,
    ambience,
    ambNodes: ambNodes.length,
    primed: primedOnce,
  };
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTE_KEY, m ? "1" : "0");
  } catch {
    /* ignore */
  }
  if (master) {
    master.gain.cancelScheduledValues(ctx?.currentTime ?? 0);
    master.gain.value = m ? 0 : MASTER_GAIN;
  }
  if (m) {
    pendingSfx = [];
    stopAmbienceNodes();
  } else if (unlocked) {
    flushPending();
    if (ambience !== "off") startAmbience(ambience);
    else startAmbience("menu");
  }
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function ready(): boolean {
  const c = ensure();
  if (!c || !master || !sfxBus || muted || !unlocked) return false;
  if (c.state !== "running") {
    void resumeContext();
    return false;
  }
  return true;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  gain = 0.14,
  when = 0,
  slideTo?: number,
): void {
  if (!ready() || !sfxBus) return;
  const c = ctx!;
  const t0 = c.currentTime + when;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(Math.max(20, freq), t0);
  if (slideTo != null) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, slideTo),
      t0 + dur,
    );
  }
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(Math.max(0.0001, gain), t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g);
  g.connect(sfxBus);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noiseBurst(
  dur: number,
  gain = 0.1,
  when = 0,
  hp = 400,
  lp = 8000,
): void {
  if (!ready() || !sfxBus) return;
  const c = ctx!;
  const t0 = c.currentTime + when;
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) {
    // Soften with envelope in the buffer for denser crowd hits
    const env = 1 - i / n;
    data[i] = (Math.random() * 2 - 1) * env;
  }
  const src = c.createBufferSource();
  src.buffer = buf;
  const hip = c.createBiquadFilter();
  hip.type = "highpass";
  hip.frequency.value = hp;
  const lop = c.createBiquadFilter();
  lop.type = "lowpass";
  lop.frequency.value = lp;
  const g = c.createGain();
  g.gain.setValueAtTime(Math.max(0.0001, gain), t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(hip);
  hip.connect(lop);
  lop.connect(g);
  g.connect(sfxBus);
  src.start(t0);
  src.stop(t0 + dur + 0.03);
}

/** Soft kick / thump for hits and builds */
function thump(freq: number, dur: number, gain: number, when = 0): void {
  tone(freq, dur, "sine", gain, when, freq * 0.45);
  noiseBurst(dur * 0.55, gain * 0.45, when, 80, 600);
}

function getCrowdBuffer(): AudioBuffer | null {
  const c = ensure();
  if (!c) return null;
  if (crowdBuf) return crowdBuf;
  // ~4s loop of filtered crowd murmur
  const sec = 4;
  const n = Math.floor(c.sampleRate * sec);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  let brown = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    brown = (brown + white * 0.02) * 0.986;
    // Slow amplitude swell (crowd waves)
    const swell =
      0.55 +
      0.35 * Math.sin((i / c.sampleRate) * Math.PI * 2 * 0.35) +
      0.15 * Math.sin((i / c.sampleRate) * Math.PI * 2 * 1.1);
    data[i] = (brown * 3.2 + white * 0.12) * swell * 0.55;
  }
  crowdBuf = buf;
  return buf;
}

function playSfxNow(kind: SfxKind): void {
  if (!ready()) {
    queueSfx(kind);
    return;
  }
  switch (kind) {
    case "prime":
      // Confirm ton is on — short stadium “door open”
      tone(196, 0.1, "triangle", 0.14);
      tone(294, 0.14, "sine", 0.12, 0.07);
      tone(392, 0.18, "triangle", 0.1, 0.14);
      noiseBurst(0.22, 0.06, 0.05, 500, 4000);
      break;
    case "ui":
      tone(740, 0.055, "sine", 0.11);
      tone(980, 0.05, "sine", 0.06, 0.04);
      break;
    case "build":
      thump(140, 0.12, 0.16);
      tone(260, 0.1, "triangle", 0.12, 0.04);
      tone(390, 0.12, "triangle", 0.09, 0.09);
      noiseBurst(0.12, 0.07, 0.02, 180, 2500);
      break;
    case "buy":
      tone(560, 0.07, "sine", 0.14);
      tone(840, 0.1, "sine", 0.11, 0.05);
      tone(1120, 0.08, "triangle", 0.07, 0.11);
      break;
    case "send":
      tone(200, 0.16, "sawtooth", 0.1, 0, 95);
      tone(300, 0.1, "triangle", 0.07, 0.05);
      noiseBurst(0.14, 0.06, 0.02, 300, 3000);
      break;
    case "hit":
      thump(95, 0.1, 0.18);
      noiseBurst(0.09, 0.16, 0, 120, 2200);
      tone(160, 0.07, "square", 0.06);
      break;
    case "goal":
      tone(392, 0.18, "triangle", 0.2);
      tone(523, 0.2, "triangle", 0.18, 0.1);
      tone(659, 0.28, "triangle", 0.16, 0.22);
      tone(784, 0.35, "sine", 0.12, 0.36);
      noiseBurst(0.45, 0.12, 0.08, 400, 6000);
      noiseBurst(0.55, 0.08, 0.15, 800, 9000);
      break;
    case "cheer":
      noiseBurst(0.55, 0.12, 0, 600, 7000);
      noiseBurst(0.4, 0.08, 0.12, 1200, 9000);
      tone(466, 0.2, "sine", 0.08, 0.04);
      tone(554, 0.16, "triangle", 0.06, 0.14);
      break;
    case "storm":
      tone(95, 0.55, "sawtooth", 0.16, 0, 48);
      noiseBurst(0.65, 0.16, 0, 100, 1800);
      tone(190, 0.32, "square", 0.1, 0.18);
      tone(240, 0.28, "triangle", 0.08, 0.32);
      break;
    case "beer":
      tone(200, 0.06, "sine", 0.1);
      tone(100, 0.12, "triangle", 0.08, 0.03);
      noiseBurst(0.08, 0.04, 0.02, 2000, 8000);
      break;
    case "whistle":
      // Piercing referee whistle — cut through the bed
      tone(2100, 0.22, "sine", 0.16, 0, 1650);
      tone(1900, 0.14, "sine", 0.12, 0.18);
      tone(2000, 0.08, "triangle", 0.08, 0.3);
      noiseBurst(0.06, 0.04, 0, 3000, 10000);
      break;
    case "victory":
      tone(523, 0.16, "triangle", 0.18);
      tone(659, 0.18, "triangle", 0.16, 0.12);
      tone(784, 0.28, "triangle", 0.18, 0.26);
      tone(1046, 0.35, "sine", 0.12, 0.42);
      noiseBurst(0.5, 0.1, 0.2, 500, 7000);
      break;
    case "defeat":
      tone(220, 0.32, "triangle", 0.14, 0, 110);
      tone(165, 0.42, "sine", 0.12, 0.14);
      tone(130, 0.5, "sine", 0.1, 0.28);
      noiseBurst(0.4, 0.06, 0.1, 200, 1500);
      break;
  }
}

export function sfx(kind: SfxKind): void {
  const now = performance.now();
  if (
    kind !== "goal" &&
    kind !== "victory" &&
    kind !== "storm" &&
    kind !== "whistle" &&
    kind !== "prime"
  ) {
    if (now - lastSfxAt < 35) return;
  }
  lastSfxAt = now;
  unlockAudio();
  if (!ready()) {
    queueSfx(kind);
    return;
  }
  playSfxNow(kind);
}

function stopAmbienceNodes(): void {
  for (const n of ambNodes) {
    try {
      (n as OscillatorNode).stop?.();
    } catch {
      /* already stopped */
    }
    try {
      (n as AudioBufferSourceNode).stop?.();
    } catch {
      /* ok */
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
  if (mode === ambience && ambNodes.length > 0 && mode !== "off") return;
  ambience = mode;
  const c = ensure();
  if (!c || !ambGain || !unlocked || muted) return;
  if (c.state !== "running") {
    void resumeContext().then(() => {
      if (ambience === mode && ambNodes.length === 0) startAmbience(mode);
    });
    return;
  }
  stopAmbienceNodes();
  if (mode === "off") {
    ambGain.gain.cancelScheduledValues(c.currentTime);
    ambGain.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
    return;
  }
  const target =
    mode === "hype" ? AMB_HYPE : mode === "match" ? AMB_MATCH : AMB_MENU;
  ambGain.gain.cancelScheduledValues(c.currentTime);
  ambGain.gain.setValueAtTime(Math.max(0.0001, ambGain.gain.value), c.currentTime);
  ambGain.gain.linearRampToValueAtTime(target, c.currentTime + 0.7);

  const mkPad = (f: number, type: OscillatorType, g = 0.25) => {
    const osc = c.createOscillator();
    const gain = c.createGain();
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    osc.type = type;
    osc.frequency.value = f;
    gain.gain.value = g;
    lfo.frequency.value = 0.07 + Math.random() * 0.06;
    lfoG.gain.value = f * 0.012;
    lfo.connect(lfoG);
    lfoG.connect(osc.frequency);
    osc.connect(gain);
    gain.connect(ambGain!);
    osc.start();
    lfo.start();
    ambNodes.push(osc, lfo, gain, lfoG);
  };

  const startCrowd = (gain: number, bright: number) => {
    const buf = getCrowdBuffer();
    if (!buf) return;
    const src = c.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 700 + bright * 400;
    bp.Q.value = 0.55;
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2800 + bright * 1200;
    const g = c.createGain();
    g.gain.value = gain;
    src.connect(bp);
    bp.connect(lp);
    lp.connect(g);
    g.connect(ambGain!);
    src.start();
    ambNodes.push(src, bp, lp, g);
  };

  if (mode === "menu") {
    mkPad(98, "sine", 0.2);
    mkPad(146.8, "triangle", 0.12);
    mkPad(196, "sine", 0.06);
    startCrowd(0.04, 0.35);
  } else if (mode === "match") {
    const chant = clubChantProfile(clubPlayerId);
    mkPad(chant.baseHz, "sine", 0.2);
    mkPad(chant.baseHz * 1.5, "triangle", 0.1);
    mkPad(chant.baseHz * (1 + chant.brightness * 0.8), "sine", 0.055);
    startCrowd(0.1 + chant.brightness * 0.04, chant.brightness);
    // Soft pulse “heartbeat” of the terrace
    const pulse = c.createOscillator();
    const pg = c.createGain();
    const lfo = c.createOscillator();
    const lfoG = c.createGain();
    pulse.type = "sine";
    pulse.frequency.value = chant.baseHz * 0.5;
    pg.gain.value = 0.03;
    lfo.frequency.value = 0.9 * chant.tempo;
    lfoG.gain.value = 0.025;
    lfo.connect(lfoG);
    lfoG.connect(pg.gain);
    pulse.connect(pg);
    pg.connect(ambGain);
    pulse.start();
    lfo.start();
    ambNodes.push(pulse, pg, lfo, lfoG);
  } else if (mode === "hype") {
    const chant = clubChantProfile(clubPlayerId);
    mkPad(chant.baseHz * 1.1, "sawtooth", 0.08);
    mkPad(chant.baseHz * 1.5, "triangle", 0.12);
    mkPad(chant.baseHz * 2, "sine", 0.08);
    startCrowd(0.16, 0.85);
  }
}

export function setAmbienceFromMatch(opts: {
  celebrating: boolean;
  storming: boolean;
  momentumAbs: number;
}): void {
  const want: AmbienceMode =
    opts.storming || opts.celebrating || opts.momentumAbs > 0.65
      ? "hype"
      : "match";
  if (want === ambience) {
    if (ambNodes.length === 0) startAmbience(want);
    return;
  }
  const now = performance.now();
  if (now - lastAmbienceSwitchAt < 1100) return;
  lastAmbienceSwitchAt = now;
  startAmbience(want);
}
