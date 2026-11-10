import type { AttackType, DefenseType, NameLang } from '../data/types';

/** Public LTD2-style rock-paper-scissors heuristics (seed; patch-dependent). */
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

const TYPE_LABEL: Record<string, { de: string; en: string }> = {
  Impact: { de: 'Impact (Schlag)', en: 'Impact' },
  Pierce: { de: 'Pierce (Stich)', en: 'Pierce' },
  Magic: { de: 'Magic (Magie)', en: 'Magic' },
  Pure: { de: 'Pure', en: 'Pure' },
  Arcane: { de: 'Arcane', en: 'Arcane' },
  Swift: { de: 'Swift (flink)', en: 'Swift' },
  Natural: { de: 'Natural (natürlich)', en: 'Natural' },
  Fortified: { de: 'Fortified (gepanzert)', en: 'Fortified' },
  Immaterial: { de: 'Immaterial', en: 'Immaterial' },
};

export function typeLabel(type: string, lang: NameLang): string {
  return lang === 'de'
    ? (TYPE_LABEL[type]?.de ?? type)
    : (TYPE_LABEL[type]?.en ?? type);
}

export function rpsAttackVsDefense(
  attack: AttackType,
  defense: DefenseType,
  lang: NameLang,
): string {
  const strong = ATTACK_STRONG_VS[attack] ?? [];
  const atk = typeLabel(attack, lang);
  const def = typeLabel(defense, lang);
  if (strong.includes(defense)) {
    return lang === 'de'
      ? `Schere-Stein-Papier: ${atk} ist stark gegen ${def}.`
      : `Rock-paper-scissors: ${atk} is strong vs ${def}.`;
  }
  return lang === 'de'
    ? `Schere-Stein-Papier: ${atk} ist kein starker Counter gegen ${def} (besser: ${(DEFENSE_WEAK_TO[defense] ?? []).map((a) => typeLabel(a, lang)).join(', ') || '—'}).`
    : `Rock-paper-scissors: ${atk} is not a strong counter to ${def} (prefer: ${(DEFENSE_WEAK_TO[defense] ?? []).map((a) => typeLabel(a, lang)).join(', ') || '—'}).`;
}

export function rpsHowToBeatDefense(defense: DefenseType, lang: NameLang): string {
  const good = DEFENSE_WEAK_TO[defense] ?? [];
  const def = typeLabel(defense, lang);
  return lang === 'de'
    ? `Gegen ${def} greifen typischerweise gut: ${good.map((a) => typeLabel(a, lang)).join(', ') || '—'}.`
    : `Usually strong vs ${def}: ${good.map((a) => typeLabel(a, lang)).join(', ') || '—'}.`;
}
