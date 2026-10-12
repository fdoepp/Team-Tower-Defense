/**
 * Audio graph smoke — verifies unlock plumbing without needing speakers.
 * Uses a stubbed AudioContext if the environment has none.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function pathToFileURL(p) {
  return new URL(`file://${p}`);
}

// Minimal AudioContext stub for Node
class FakeParam {
  constructor(v = 0) {
    this.value = v;
  }
  setValueAtTime(v) {
    this.value = v;
  }
  exponentialRampToValueAtTime() {}
  linearRampToValueAtTime() {}
  cancelScheduledValues() {}
}
class FakeNode {
  connect() {
    return this;
  }
  disconnect() {}
  start() {}
  stop() {}
}
class FakeCtx {
  constructor() {
    this.state = "suspended";
    this.sampleRate = 44100;
    this.currentTime = 0;
    this.destination = new FakeNode();
  }
  createGain() {
    const n = new FakeNode();
    n.gain = new FakeParam(1);
    return n;
  }
  createOscillator() {
    const n = new FakeNode();
    n.frequency = new FakeParam(440);
    n.type = "sine";
    return n;
  }
  createBiquadFilter() {
    const n = new FakeNode();
    n.type = "lowpass";
    n.frequency = new FakeParam(1000);
    n.Q = new FakeParam(1);
    return n;
  }
  createBuffer() {
    return {
      getChannelData: () => new Float32Array(8),
    };
  }
  createBufferSource() {
    const n = new FakeNode();
    n.buffer = null;
    n.loop = false;
    return n;
  }
  createDynamicsCompressor() {
    const n = new FakeNode();
    n.threshold = new FakeParam(-24);
    n.knee = new FakeParam(30);
    n.ratio = new FakeParam(12);
    n.attack = new FakeParam(0.003);
    n.release = new FakeParam(0.25);
    return n;
  }
  resume() {
    this.state = "running";
    return Promise.resolve();
  }
}

globalThis.window = {
  AudioContext: FakeCtx,
  webkitAudioContext: FakeCtx,
  addEventListener() {},
};
globalThis.document = {
  visibilityState: "visible",
  addEventListener() {},
};
Object.assign(globalThis, globalThis.window);
globalThis.localStorage = {
  _d: {},
  getItem(k) {
    return this._d[k] ?? null;
  },
  setItem(k, v) {
    this._d[k] = String(v);
  },
};
globalThis.AudioContext = FakeCtx;
globalThis.performance = { now: () => Date.now() };

const { register } = await import("node:module");
try {
  register("tsx/esm", pathToFileURL("./"));
} catch {
  /* ok */
}

const sound = await import(pathToFileURL(path.join(root, "src/game/sound.ts")).href);

sound.bindAudioGestures();
sound.unlockAudio();
await new Promise((r) => setTimeout(r, 20));

const st = sound.audioDebugState();
if (!st.unlocked) throw new Error("expected unlocked");
if (st.ctxState !== "running") throw new Error(`ctx ${st.ctxState}`);

sound.sfx("whistle");
sound.sfx("goal");
sound.sfx("ui");
sound.startAmbience("match");
const st2 = sound.audioDebugState();
if (st2.ambience !== "match") throw new Error("ambience not match");
if (st2.ambNodes < 2) throw new Error("expected ambience nodes");

sound.setMuted(true);
if (!sound.isMuted()) throw new Error("mute");
sound.setMuted(false);
sound.sfx("build");

console.log("audio-smoke OK", sound.audioDebugState());
