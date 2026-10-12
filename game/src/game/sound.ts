/**
 * Procedural Web Audio bed + stingers (no external audio files).
 * Unlock on first user gesture; events call sfx()/setAmbience().
 *
 * Autoplay: AudioContext often stays "suspended" until resume() finishes.
 * SFX during that window are queued and flushed after unlock — otherwise
 * Anpfiff-whistle / first UI clicks are silently dropped.
 *
 * Club sound identity: chant profiles hashed from club ids (not licensed hymns).
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
let lastAmbienceSwitchAt = 0;
let gestureBound = false;
let resumeWait: Promise<void> | null = null;
/** SFX waiting for AudioContext running (post-gesture). */
let pendingSfx: SfxKind[] = [];
const PENDING_MAX = 14;

let clubPlayerId = "ksc";
let clubAiId = "vfb";

/** Bind current match clubs for procedural chant identity. */
export function setClubSoundIdentity(playerClub: string, aiClub: string): void {
  clubPlayerId = playerClub || "ksc";
  clubAiId = aiClub || "vfb";
}

/**
 * Short club-flavoured chant burst (procedural — not a real hymn).
 * side: player|ai picks which club profile to use.
 */
export function playClubChant(
  side: "player" | "ai" = "player",
  intensity = 0.6,
): void {
  if (!ready()) return;
  const id = side === "player" ? clubPlayerId : clubAiId;
  const p = clubChantProfile(id);
  const g = 0.05 + intensity * 0.1;
  tone(p.baseHz, 0.22, "triangle", g * 0.9);
  tone(p.baseHz * (1 + p.brightness * 0.5), 0.28, "sine", g * 0.7, 0.08);
  tone(p.baseHz * 1.5, 0.18, "triangle", g * 0.55, 0.14 / p.tempo);
  noiseBurst(0.35 * intensity, 0.04 + intensity * 0.05, 0.05, 500 + p.brightness * 400);
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
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    ambGain = ctx.createGain();
    ambGain.gain.value = 0;
    ambGain.connect(master);
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
  window.addEventListener("touchstart", unlock, { capture: true });
  // Tab back into focus — browsers often re-suspend the context
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
  // iOS/Safari: a short silent buffer in the same gesture helps leave "suspended"
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
    if (c.state === "running") {
      flushPending();
      if (ambience !== "off" && ambNodes.length === 0) startAmbience(ambience);
    }
  });
  if (c.state === "running") {
    flushPending();
    if (ambience !== "off" && ambNodes.length === 0) startAmbience(ambience);
  }
}

export function isAudioUnlocked(): boolean {
  return unlocked;
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
} {
  return {
    unlocked,
    muted,
    ctxState: ctx?.state ?? null,
    pending: pendingSfx.length,
    ambience,
    ambNodes: ambNodes.length,
  };
}

export function setMuted(m: boolean): void {
  muted = m;
  if (master) master.gain.value = m ? 0 : 0.7;
  if (m) pendingSfx = [];
  else if (unlocked) flushPending();
}

export function toggleMuted(): boolean {
  setMuted(!muted);
  return muted;
}

function ready(): boolean {
  const c = ensure();
  if (!c || !master || muted || !unlocked) return false;
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
  if (!ready()) return;
  const c = ctx!;
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
  g.connect(master!);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noiseBurst(dur: number, gain = 0.1, when = 0, hp = 400): void {
  if (!ready()) return;
  const c = ctx!;
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
  g.connect(master!);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function playSfxNow(kind: SfxKind): void {
  if (!ready()) {
    queueSfx(kind);
    return;
  }
  switch (kind) {
    case "ui":
      tone(660, 0.07, "sine", 0.09);
      break;
    case "build":
      tone(220, 0.1, "triangle", 0.14);
      tone(330, 0.12, "triangle", 0.1, 0.05);
      noiseBurst(0.1, 0.06, 0, 200);
      break;
    case "buy":
      tone(520, 0.08, "sine", 0.12);
      tone(780, 0.1, "sine", 0.09, 0.06);
      break;
    case "send":
      tone(180, 0.14, "sawtooth", 0.08, 0, 90);
      break;
    case "hit":
      noiseBurst(0.08, 0.14, 0, 180);
      tone(120, 0.09, "square", 0.07);
      break;
    case "goal":
      tone(392, 0.2, "triangle", 0.16);
      tone(523, 0.22, "triangle", 0.14, 0.12);
      tone(659, 0.3, "triangle", 0.14, 0.26);
      noiseBurst(0.28, 0.08, 0.1, 600);
      break;
    case "cheer":
      noiseBurst(0.4, 0.08, 0, 800);
      tone(440, 0.18, "sine", 0.07, 0.05);
      break;
    case "storm":
      tone(110, 0.45, "sawtooth", 0.12, 0, 55);
      noiseBurst(0.5, 0.12, 0, 150);
      tone(220, 0.28, "square", 0.08, 0.2);
      break;
    case "beer":
      tone(180, 0.06, "sine", 0.08);
      tone(90, 0.1, "triangle", 0.06, 0.04);
      break;
    case "whistle":
      tone(1800, 0.18, "sine", 0.11, 0, 1400);
      tone(1600, 0.12, "sine", 0.08, 0.16);
      break;
    case "victory":
      tone(523, 0.18, "triangle", 0.14);
      tone(659, 0.2, "triangle", 0.14, 0.14);
      tone(784, 0.32, "triangle", 0.16, 0.3);
      break;
    case "defeat":
      tone(220, 0.28, "triangle", 0.12, 0, 110);
      tone(165, 0.38, "sine", 0.1, 0.15);
      break;
  }
}

export function sfx(kind: SfxKind): void {
  const now = performance.now();
  if (
    kind !== "goal" &&
    kind !== "victory" &&
    kind !== "storm" &&
    kind !== "whistle"
  ) {
    if (now - lastSfxAt < 40) return;
  }
  lastSfxAt = now;
  unlockAudio();
  if (!ready()) {
    // Keep Anpfiff / UI / build sounds — play once context is running
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
  const target = mode === "hype" ? 0.12 : mode === "match" ? 0.08 : 0.045;
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
    mkPad(110, "sine", 0.22);
    mkPad(164.8, "triangle", 0.14);
  } else if (mode === "match") {
    const chant = clubChantProfile(clubPlayerId);
    mkPad(chant.baseHz, "sine", 0.22);
    mkPad(chant.baseHz * 1.5, "triangle", 0.11);
    mkPad(chant.baseHz * (1 + chant.brightness), "sine", 0.06);
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
    g.gain.value = 0.055;
    src.connect(bp);
    bp.connect(g);
    g.connect(ambGain);
    src.start();
    ambNodes.push(src, bp, g);
  } else if (mode === "hype") {
    mkPad(130.8, "sawtooth", 0.1);
    mkPad(196, "triangle", 0.12);
    mkPad(261.6, "sine", 0.09);
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
  // Hysteresis — avoid tearing the bed every pulse flicker
  if (want === ambience) {
    if (ambNodes.length === 0) startAmbience(want);
    return;
  }
  const now = performance.now();
  if (now - lastAmbienceSwitchAt < 1200) return;
  lastAmbienceSwitchAt = now;
  startAmbience(want);
}
