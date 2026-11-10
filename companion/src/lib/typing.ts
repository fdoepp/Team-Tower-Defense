import type { AttackType, DefenseType } from '../data/types';

/** Public LTD2-style heuristics: which attack tends to pressure a defense. */
export const ATTACK_STRONG_VS: Record<AttackType, DefenseType[]> = {
  Impact: ['Swift', 'Fortified'],
  Pierce: ['Fortified', 'Natural'],
  Magic: ['Natural', 'Magic'],
  Pure: ['Swift', 'Natural', 'Fortified', 'Magic', 'Immaterial'],
  Arcane: ['Natural', 'Magic'],
};

export const DEFENSE_WEAK_TO: Record<DefenseType, AttackType[]> = {
  Swift: ['Impact', 'Pure'],
  Natural: ['Magic', 'Pierce', 'Pure'],
  Magic: ['Pierce', 'Impact'],
  Fortified: ['Pierce', 'Impact', 'Pure'],
  Immaterial: ['Pure', 'Magic'],
};

export const ATTACK_TYPES: AttackType[] = [
  'Impact',
  'Pierce',
  'Magic',
  'Pure',
  'Arcane',
];

export const DEFENSE_TYPES: DefenseType[] = [
  'Swift',
  'Natural',
  'Magic',
  'Fortified',
  'Immaterial',
];
