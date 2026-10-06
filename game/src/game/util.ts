import type { FanMix, FanKind } from "./types";
import { MIX_MAX, MIX_MIN, MIX_TOTAL } from "./types";

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function mixSum(m: FanMix): number {
  return m.normalos + m.ultras + m.familie;
}

export function defaultMix(): FanMix {
  return { normalos: 4, ultras: 3, familie: 3 };
}

export function isValidMix(mix: FanMix): boolean {
  return (
    mixSum(mix) === MIX_TOTAL &&
    mix.normalos >= MIX_MIN.normalos &&
    mix.normalos <= MIX_MAX.normalos &&
    mix.ultras >= MIX_MIN.ultras &&
    mix.ultras <= MIX_MAX.ultras &&
    mix.familie >= MIX_MIN.familie &&
    mix.familie <= MIX_MAX.familie
  );
}

export function defaultSoloSettings(): {
  difficulty: "easy" | "normal" | "hard";
  behavior: "patient" | "balanced" | "aggro" | "beer" | "earlywin";
  playerTeam: "ksc" | "vfb";
} {
  return {
    difficulty: "easy",
    behavior: "balanced",
    playerTeam: "ksc",
  };
}

export function defaultSetup() {
  return { mix: defaultMix(), startBier: true };
}

export function teamLabel(team: "ksc" | "vfb"): string {
  return team === "ksc" ? "KSC" : "VfB";
}

export function formatMinute(minute: number): string {
  return `${Math.floor(minute)}′`;
}

export function expandMix(mix: FanMix): FanKind[] {
  const out: FanKind[] = [];
  for (let i = 0; i < mix.ultras; i++) out.push("ultras");
  for (let i = 0; i < mix.normalos; i++) out.push("normalos");
  for (let i = 0; i < mix.familie; i++) out.push("familie");
  return out;
}
