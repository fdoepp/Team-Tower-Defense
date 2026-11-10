import type { StrategyId } from '../data/types';
import { getWave } from '../data/waves';

export interface LiveAdvice {
  titleDe: string;
  titleEn: string;
  rationaleDe: string;
  rationaleEn: string;
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  category: 'build' | 'worker' | 'send' | 'king';
}

export function buildLiveAdvice(opts: {
  wave: number;
  strategies: StrategyId[];
  focusWorkersUntil?: number;
  focusBreakWaves: number[];
  leakPercent: number;
  receivedMythium: number;
  opponentChips: string[];
}): LiveAdvice {
  const wave = getWave(opts.wave);
  const isBreak =
    opts.focusBreakWaves.includes(opts.wave) ||
    wave?.tags.includes('break-window');
  const wantWorkers =
    opts.strategies.includes('worker') &&
    (opts.focusWorkersUntil == null || opts.wave <= opts.focusWorkersUntil) &&
    opts.leakPercent < 20;

  if (opts.leakPercent >= 40) {
    return {
      titleDe: 'Hold-First: Value nachlegen',
      titleEn: 'Hold-First: add value',
      rationaleDe: `Leak ~${opts.leakPercent}% — Worker/Send pausieren, Typing vs ${wave?.creatureDe ?? 'Wave'} prüfen.`,
      rationaleEn: `Leak ~${opts.leakPercent}% — pause workers/sends, check typing vs ${wave?.creatureEn ?? 'wave'}.`,
      confidence: 'medium',
      category: 'build',
    };
  }

  if (isBreak && (opts.strategies.includes('aggressive') || opts.strategies.includes('save'))) {
    return {
      titleDe: 'Break-Fenster: Power-Send prüfen',
      titleEn: 'Break window: check power send',
      rationaleDe: `W${opts.wave}${opts.opponentChips.length ? ` · Gegner: ${opts.opponentChips.slice(0, 3).join(', ')}` : ''} — Mythium für Power-Mercs; Team syncen.`,
      rationaleEn: `W${opts.wave}${opts.opponentChips.length ? ` · foe: ${opts.opponentChips.slice(0, 3).join(', ')}` : ''} — Mythium for power mercs; sync team.`,
      confidence: 'medium',
      category: 'send',
    };
  }

  if (opts.strategies.includes('king') && opts.wave <= 3) {
    return {
      titleDe: 'King-Up vor Income-Snail',
      titleEn: 'King-Up over income Snail',
      rationaleDe: wave?.tipDe ?? 'Frühe Waves: King oft besser als Snail.',
      rationaleEn: wave?.tipEn ?? 'Early waves: King often better than Snail.',
      confidence: 'high',
      category: 'king',
    };
  }

  if (wantWorkers && opts.receivedMythium < 30) {
    return {
      titleDe: 'Worker Push (Surplus)',
      titleEn: 'Worker push (surplus)',
      rationaleDe: `W${opts.wave}: Faustregel ~40 Mythium → 1 Worker; Leak niedrig — 1 Worker ok.`,
      rationaleEn: `W${opts.wave}: ~40 Mythium → 1 worker rule; low leak — 1 worker ok.`,
      confidence: 'medium',
      category: 'worker',
    };
  }

  if (opts.strategies.includes('income')) {
    return {
      titleDe: 'Income-Send / Snail-Linie',
      titleEn: 'Income send / Snail line',
      rationaleDe: 'Kein Break-Fenster → Income-Mercs oder King; Power nur bei Chance.',
      rationaleEn: 'No break window → income mercs or King; power only with a chance.',
      confidence: 'medium',
      category: 'send',
    };
  }

  return {
    titleDe: wave ? `Hold: ${wave.creatureDe}` : `Hold Wave ${opts.wave}`,
    titleEn: wave ? `Hold: ${wave.creatureEn}` : `Hold wave ${opts.wave}`,
    rationaleDe: wave?.tipDe ?? 'Value nahe Recommended; Typing beachten.',
    rationaleEn: wave?.tipEn ?? 'Stay near recommended value; watch typing.',
    confidence: wave ? 'medium' : 'uncertain',
    category: 'build',
  };
}
