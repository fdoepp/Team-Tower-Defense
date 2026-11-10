import type { Role } from '../data/types';

/**
 * Original stylized stand-in icons (not LTD2 art).
 * Role → shape/color mapping for roster/training recognition.
 * CDN / official game icons are intentionally unused until licensed.
 */

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

/** Stable accent from unit id / name (not brand colors of LTD2). */
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
