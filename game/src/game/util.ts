import type { FanKind, FanMix } from "./types";
import { MIX_MAX, MIX_MIN, MIX_TOTAL } from "./types";

export function clamp(n: number, a: number, b: number): number {
  return Math.max(a, Math.min(b, n));
}

export function mixSum(m: FanMix): number {
  return m.normalos + m.ultras + m.hooligans;
}

export function defaultMix(): FanMix {
  return { normalos: 3, ultras: 3, hooligans: 2 };
}

export function isValidMix(mix: FanMix): boolean {
  return (
    mixSum(mix) === MIX_TOTAL &&
    mix.normalos >= MIX_MIN.normalos &&
    mix.normalos <= MIX_MAX.normalos &&
    mix.ultras >= MIX_MIN.ultras &&
    mix.ultras <= MIX_MAX.ultras &&
    mix.hooligans >= MIX_MIN.hooligans &&
    mix.hooligans <= MIX_MAX.hooligans
  );
}

export function defaultSoloSettings() {
  return {
    difficulty: "easy" as const,
    behavior: "balanced" as const,
    playerTeam: "ksc" as const,
  };
}

export function defaultSetup() {
  return { mix: defaultMix() };
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
  for (let i = 0; i < mix.hooligans; i++) out.push("hooligans");
  return out;
}

export function slotKey(blockId: number, index: number): string {
  return `${blockId}:${index}`;
}
