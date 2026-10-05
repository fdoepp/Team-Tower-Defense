import type { FanMix, SoloSettings, SetupConfig, TowerKind } from "./types";
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

export function adjustMix(
  mix: FanMix,
  key: keyof FanMix,
  delta: number,
): FanMix {
  const next = { ...mix, [key]: mix[key] + delta };
  if (next[key] < MIX_MIN[key] || next[key] > MIX_MAX[key]) return mix;
  if (mixSum(next) > MIX_TOTAL) return mix;
  if (mixSum(next) < MIX_TOTAL && delta < 0) {
    // allow temporary underfill while adjusting UI — caller validates
  }
  return next;
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

export function synergyBonus(mix: FanMix, tower: TowerKind): number {
  if (tower === "chor" && mix.ultras >= 4) return 1.15;
  if (tower === "bier" && mix.normalos >= 5) return 1.15;
  if (tower === "gitter" && mix.familie >= 3) return 1.1;
  if (tower === "pyro" && mix.ultras >= 4) return 1.2;
  if (tower === "schmaeh" && mix.ultras >= 3) return 1.1;
  return 1;
}

export function defaultSoloSettings(): SoloSettings {
  return {
    difficulty: "easy",
    behavior: "balanced",
    playerTeam: "ksc",
  };
}

export function defaultSetup(): SetupConfig {
  return { mix: defaultMix(), startTower: "gitter" };
}

export function teamLabel(team: "ksc" | "vfb"): string {
  return team === "ksc" ? "KSC" : "VfB";
}

export function formatMinute(minute: number): string {
  const m = Math.floor(minute);
  return `${m}′`;
}
