import type { Strategy } from './types';

/** Real LTD2 strategy archetypes from concept §3.3 */
export const STRATEGIES: Strategy[] = [
  {
    id: 'hold',
    labelDe: 'Hold / Value',
    labelEn: 'Hold / Value',
    summaryDe: 'Waves clearen, nahe Recommended Fighter Value bleiben.',
    summaryEn: 'Clear waves; stay near recommended fighter value.',
    levers: ['Value-Bar', 'Typing vs Wave'],
  },
  {
    id: 'worker',
    labelDe: 'Worker Push',
    labelEn: 'Worker Push',
    summaryDe: 'Surplus-Gold → Workers; nie auf No-Send pushen.',
    summaryEn: 'Surplus gold → workers; never push on no-send.',
    levers: ['~1 Worker / ~40 Mythium (Faustregel)', 'Leak → konservativer'],
  },
  {
    id: 'aggressive',
    labelDe: 'Aggressive Send',
    labelEn: 'Aggressive Send',
    summaryDe: 'Mythium sparen → Power-Mercs auf schwacher Gegner-Wave.',
    summaryEn: 'Bank Mythium → power mercs on weak enemy waves.',
    levers: ['Leak-Windows', 'Team-Sync'],
  },
  {
    id: 'income',
    labelDe: 'Income Send',
    labelEn: 'Income Send',
    summaryDe: 'Non-Power-Mercs (+ ggf. King Up) für Economy.',
    summaryEn: 'Non-power mercs (+ optional King Up) for economy.',
    levers: ['Snail-Linien', 'King-Income'],
  },
  {
    id: 'king',
    labelDe: 'King-Up Focus',
    labelEn: 'King-Up Focus',
    summaryDe: 'Mythium in King Attack/Regen/Spell statt Mercs.',
    summaryEn: 'Mythium into King Attack/Regen/Spell instead of mercs.',
    levers: ['Early Deny', 'High-Value-Lane'],
  },
  {
    id: 'save',
    labelDe: 'Save Mythium',
    labelEn: 'Save Mythium',
    summaryDe: 'Mehrere Waves sparen für großen Send.',
    summaryEn: 'Bank across waves for a big send.',
    levers: ['Save-Counter', 'Break-Wave wählen'],
  },
  {
    id: 'holdFirst',
    labelDe: 'Hold-First',
    labelEn: 'Hold-First',
    summaryDe: 'Eigenen King schützen; Send sekundär.',
    summaryEn: 'Protect own King; send is secondary.',
    levers: ['Defensive Spells', 'Value'],
  },
];
