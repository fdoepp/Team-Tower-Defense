import type { Role } from '../data/types';

/**
 * Official CDN icons for private companion use only.
 * Pattern: https://cdn.legiontd2.com/icons/{Name}.png
 *
 * Waves must use official creature stems only (Crab, Wale, Hopper,
 * FlyingChicken, Scorpion, Rocko, Sludge, Kobra, Carapace, Granddaddy,
 * QuillShooter, Mantis, DrillGolem, KillerSlug, Quadrapus, Cardinal,
 * MetalDragon, WaleChief, DireToad, Maccabeus, LegionLord) — never
 * substitute buildable fighter roster art for wave symbols.
 *
 * Glyphs remain the 404 / offline fallback.
 */

export const CDN_ICON_BASE = 'https://cdn.legiontd2.com/icons';

export function cdnIconUrl(iconName: string): string {
  return `${CDN_ICON_BASE}/${iconName}.png`;
}

export type IconKind =
  | 'tank'
  | 'dps'
  | 'range'
  | 'heal'
  | 'aura'
  | 'aoe'
  | 'mana'
  | 'carry'
  | 'opener'
  | 'merc';

const ROLE_PRIORITY: Role[] = [
  'Tank',
  'Heal',
  'Aura',
  'AOE',
  'Mana',
  'Carry',
  'Range',
  'Opener',
  'DPS',
];

export function roleToKind(roles: Role[] = []): IconKind {
  for (const r of ROLE_PRIORITY) {
    if (roles.includes(r)) {
      switch (r) {
        case 'Tank':
          return 'tank';
        case 'Heal':
          return 'heal';
        case 'Aura':
          return 'aura';
        case 'AOE':
          return 'aoe';
        case 'Mana':
          return 'mana';
        case 'Carry':
          return 'carry';
        case 'Range':
          return 'range';
        case 'Opener':
          return 'opener';
        case 'DPS':
          return 'dps';
      }
    }
  }
  return 'dps';
}

/** Stable accent for glyph fallback */
export function accentFromKey(key: string): string {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const hues = [28, 48, 92, 148, 172, 198, 220, 18];
  const hue = hues[h % hues.length]!;
  return `hsl(${hue} 52% 48%)`;
}

export function placeholderLabel(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
