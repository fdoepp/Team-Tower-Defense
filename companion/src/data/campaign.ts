import type { CampaignMission } from './types';

/**
 * Campaign missions — structure locked as per-mission guides.
 * Only a few seeded examples; mark incomplete. Titles are illustrative stubs
 * until full mission catalog is curated from official Campaign mode.
 */
export const CAMPAIGN_MISSIONS: CampaignMission[] = [
  {
    id: 'camp-1-1',
    chapter: 1,
    order: 1,
    titleDe: 'Erste Welle — Grundlagen',
    titleEn: 'First Wave — Basics',
    recommendedLegion: 'element',
    recommendedStrategies: ['hold', 'king'],
    summaryDe:
      'Tutorial-nahe Mission: Opener verstehen, King-Up vs. Snail, Lane-Front setzen.',
    summaryEn:
      'Tutorial-adjacent: learn openers, King-Up vs Snail, set a lane front.',
    tips: [
      {
        de: 'Gateguard/Peewee/Mudman-ähnliche Opener vorne; DPS hinten.',
        en: 'Gateguard/Peewee/Mudman-like openers in front; DPS behind.',
      },
      {
        de: 'Wave 1 oft King-Up statt Income-Snail.',
        en: 'Wave 1 often King-Up instead of income Snail.',
      },
    ],
    incomplete: false,
    gameVersion: 'v26.11',
  },
  {
    id: 'camp-1-2',
    chapter: 1,
    order: 2,
    titleDe: 'Flugdruck',
    titleEn: 'Air Pressure',
    recommendedLegion: 'mech',
    recommendedStrategies: ['hold', 'worker'],
    summaryDe: 'Flying-Wave üben — Ground-only Stacks vermeiden.',
    summaryEn: 'Practice flying waves — avoid ground-only stacks.',
    tips: [
      {
        de: 'Vor Wave 4 Range/Anti-Air Coverage sicherstellen.',
        en: 'Ensure range/anti-air coverage before wave 4.',
      },
    ],
    incomplete: true,
    gameVersion: 'v26.11',
  },
  {
    id: 'camp-2-1',
    chapter: 2,
    order: 1,
    titleDe: 'Eco-Lektion',
    titleEn: 'Eco Lesson',
    recommendedLegion: 'grove',
    recommendedStrategies: ['worker', 'income'],
    summaryDe: 'Worker-Push ohne Leak — Faustregel ~40 Mythium → 1 Worker.',
    summaryEn: 'Worker push without leaking — ~40 Mythium → 1 Worker rule of thumb.',
    tips: [
      {
        de: 'Nie Workers auf No-Send-Waves pushen.',
        en: 'Never push workers on no-send waves.',
      },
    ],
    incomplete: true,
    gameVersion: 'v26.11',
  },
  {
    id: 'camp-2-2',
    chapter: 2,
    order: 2,
    titleDe: 'Break-Fenster W8/W10',
    titleEn: 'Break Windows W8/W10',
    recommendedLegion: 'forsaken',
    recommendedStrategies: ['save', 'aggressive'],
    summaryDe: 'Mythium sparen und Power-Mercs auf schwache Gegner-Waves.',
    summaryEn: 'Bank Mythium and power-merc weak enemy waves.',
    tips: [
      {
        de: 'Save-Counter sichtbar halten; Team-Send syncen.',
        en: 'Keep save counter visible; sync team sends.',
      },
    ],
    incomplete: true,
    gameVersion: 'v26.11',
  },
  {
    id: 'camp-3-1',
    chapter: 3,
    order: 1,
    titleDe: 'Spell-Picks ab W11',
    titleEn: 'Spell Picks from W11',
    recommendedLegion: 'atlantean',
    recommendedStrategies: ['hold', 'holdFirst'],
    summaryDe: 'Legion Spells an Build-Richtung und Gegner-Druck koppeln.',
    summaryEn: 'Couple Legion Spells to build direction and enemy pressure.',
    tips: [
      {
        de: 'Inhalt Stub — konkrete Spell-Empfehlungen folgen nach API/Wiki-Abgleich.',
        en: 'Stub — concrete spell advice after API/wiki alignment.',
      },
    ],
    incomplete: true,
    gameVersion: 'v26.11',
  },
];
