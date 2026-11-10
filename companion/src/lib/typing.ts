import type { AttackType, DefenseType, NameLang } from '../data/types';

/**
 * LTD2 attack↔armor rock-paper-scissors heuristics (seed / community + wiki).
 * Absolute numbers are patch-dependent — treat as medium confidence.
 */
export const ATTACK_STRONG_VS: Record<AttackType, DefenseType[]> = {
  Impact: ['Swift', 'Fortified', 'Arcane'],
  Pierce: ['Fortified', 'Natural', 'Arcane'],
  Magic: ['Natural', 'Magic', 'Immaterial'],
  Pure: ['Swift', 'Natural', 'Fortified', 'Magic', 'Immaterial', 'Arcane'],
  Arcane: ['Natural', 'Magic'],
};

export const DEFENSE_WEAK_TO: Record<DefenseType, AttackType[]> = {
  Swift: ['Impact', 'Pure'],
  Natural: ['Magic', 'Pierce', 'Pure'],
  Magic: ['Pierce', 'Impact'],
  Fortified: ['Pierce', 'Impact', 'Pure'],
  Immaterial: ['Pure', 'Magic'],
  Arcane: ['Pierce', 'Impact', 'Pure'],
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
  'Arcane',
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
      ? `Schere-Stein-Papier: ${atk}-Angriff ist stark gegen ${def}-Rüstung.`
      : `Rock-paper-scissors: ${atk} attack is strong vs ${def} armor.`;
  }
  const better = (DEFENSE_WEAK_TO[defense] ?? []).map((a) => typeLabel(a, lang));
  return lang === 'de'
    ? `Schere-Stein-Papier: ${atk} ist kein starker Counter gegen ${def}. Besser: ${better.join(', ') || '—'}.`
    : `Rock-paper-scissors: ${atk} is not a strong counter to ${def}. Prefer: ${better.join(', ') || '—'}.`;
}

export function rpsHowToBeatDefense(defense: DefenseType, lang: NameLang): string {
  const good = DEFENSE_WEAK_TO[defense] ?? [];
  const def = typeLabel(defense, lang);
  return lang === 'de'
    ? `Gegen ${def}-Rüstung greifen typischerweise gut: ${good.map((a) => typeLabel(a, lang)).join(', ') || '—'}.`
    : `Usually strong vs ${def} armor: ${good.map((a) => typeLabel(a, lang)).join(', ') || '—'}.`;
}

export function compositionBlurb(
  wave: {
    formation: string;
    packing: string;
    count: number;
    boss?: boolean;
    tags: string[];
  },
  lang: NameLang,
): string {
  const bits: string[] = [];
  if (lang === 'de') {
    bits.push(
      wave.formation === 'boss'
        ? 'Formation: Boss/Einzelziel'
        : wave.formation === 'ranged'
          ? 'Formation: überwiegend Fernkampf'
          : wave.formation === 'mixed'
            ? 'Formation: Mix Nah-/Fernkampf'
            : 'Formation: überwiegend Nahkampf',
    );
    bits.push(
      wave.packing === 'clumped'
        ? 'Aufstellung: geklumpt (AOE stark)'
        : wave.packing === 'spread'
          ? 'Aufstellung: gesplittet/verteilt (Single-Target wichtiger)'
          : 'Aufstellung: Linie',
    );
    bits.push(`Anzahl ca. ${wave.count}${wave.boss ? ' (+ Boss)' : ''}`);
    if (wave.tags.includes('flying')) bits.push('Flying — Anti-Air / Range nötig');
  } else {
    bits.push(
      wave.formation === 'boss'
        ? 'Formation: boss/single target'
        : wave.formation === 'ranged'
          ? 'Formation: mostly ranged'
          : wave.formation === 'mixed'
            ? 'Formation: melee/ranged mix'
            : 'Formation: mostly melee',
    );
    bits.push(
      wave.packing === 'clumped'
        ? 'Packing: clumped (AOE strong)'
        : wave.packing === 'spread'
          ? 'Packing: spread (single-target matters more)'
          : 'Packing: line',
    );
    bits.push(`Count ~${wave.count}${wave.boss ? ' (+ boss)' : ''}`);
    if (wave.tags.includes('flying')) bits.push('Flying — need anti-air / range');
  }
  return bits.join('. ') + '.';
}
