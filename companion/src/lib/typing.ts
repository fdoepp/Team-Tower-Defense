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

/**
 * Short type names for compound recommendations
 * („Swift-/Magic-/Immaterial-Rüstung“, not parenthetical clutter).
 */
function joinTypesForNoun(types: string[], lang: NameLang): string {
  if (types.length === 0) return '—';
  if (lang === 'de') {
    if (types.length === 1) return types[0]!;
    return types
      .map((t, i) => (i < types.length - 1 ? `${t}-` : t))
      .join('/');
  }
  const labels = types.map((t) => typeLabel(t, lang));
  if (labels.length === 1) return labels[0]!;
  if (labels.length === 2) return `${labels[0]} or ${labels[1]}`;
  return `${labels.slice(0, -1).join(', ')}, or ${labels[labels.length - 1]}`;
}

/** „Weil X folgt Empfehlung Y.“ — preferred quiz explanation schema. */
export function weilEmpfehlung(
  reason: string,
  recommendation: string,
  lang: NameLang,
): string {
  return lang === 'de'
    ? `Weil ${reason}, folgt Empfehlung ${recommendation}.`
    : `Because ${reason}, follow recommendation ${recommendation}.`;
}

/** Armor types that do not list this attack as a crack (hold vs that attack). */
export function defensesThatHoldVs(attack: AttackType): DefenseType[] {
  return DEFENSE_TYPES.filter(
    (d) => !(DEFENSE_WEAK_TO[d] ?? []).includes(attack),
  );
}

export function attacksThatCrack(defense: DefenseType): AttackType[] {
  return DEFENSE_WEAK_TO[defense] ?? [];
}

/** Wave attack → which armor you should build. */
export function rpsHoldVsAttack(attack: AttackType, lang: NameLang): string {
  const hold = defensesThatHoldVs(attack);
  return weilEmpfehlung(
    lang === 'de'
      ? `die Welle mit ${attack} angreift`
      : `the wave attacks with ${attack}`,
    lang === 'de'
      ? `Fighter mit ${joinTypesForNoun(hold, lang)}-Rüstung`
      : `fighters with ${joinTypesForNoun(hold, lang)} armor`,
    lang,
  );
}

/** Wave armor → which attack types you should use. */
export function rpsHowToBeatDefense(
  defense: DefenseType,
  lang: NameLang,
): string {
  const good = attacksThatCrack(defense);
  return weilEmpfehlung(
    lang === 'de'
      ? `die Welle ${defense}-Rüstung hat`
      : `the wave has ${defense} armor`,
    lang === 'de'
      ? `${joinTypesForNoun(good, lang)}-Angriff`
      : `${joinTypesForNoun(good, lang)} attack`,
    lang,
  );
}

/** Your merc/unit attack vs wave armor. */
export function rpsAttackVsDefense(
  attack: AttackType,
  defense: DefenseType,
  lang: NameLang,
): string {
  const strong = (ATTACK_STRONG_VS[attack] ?? []).includes(defense);
  const atk = typeLabel(attack, lang);
  const def = typeLabel(defense, lang);
  if (strong) {
    return weilEmpfehlung(
      lang === 'de'
        ? `${atk}-Angriff stark gegen ${def}-Rüstung ist`
        : `${atk} attack is strong vs ${def} armor`,
      lang === 'de'
        ? `diesen Angriffstyp gegen die Welle priorisieren`
        : `prioritize this attack type into the wave`,
      lang,
    );
  }
  const better = joinTypesForNoun(attacksThatCrack(defense), lang);
  return weilEmpfehlung(
    lang === 'de'
      ? `${atk} kein starker Counter gegen ${def} ist`
      : `${atk} is not a strong counter to ${def}`,
    lang === 'de'
      ? `stattdessen ${better}-Angriff`
      : `instead use ${better} attack`,
    lang,
  );
}

/** Enemy wave composition → player board recommendation (always labeled). */
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
  const parts: string[] = [];

  if (wave.formation === 'boss' || wave.boss) {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle Boss-/Einzelziel-Druck hat'
          : 'the wave has boss/single-target pressure',
        lang === 'de'
          ? 'hohe Single-Target-DPS und Fokusfeuer, nicht nur Flächenschaden'
          : 'high single-target DPS and focus fire, not only AOE',
        lang,
      ),
    );
  } else if (wave.formation === 'ranged') {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle überwiegend Fernkampf ist'
          : 'the wave is mostly ranged',
        lang === 'de'
          ? 'Fronttank halten und Range-DPS hinter der Linie stellen'
          : 'hold a front tank and place ranged DPS behind the line',
        lang,
      ),
    );
  } else if (wave.formation === 'mixed') {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle gemischt Nah-/Fernkampf aufgestellt ist'
          : 'the wave is a melee/ranged mix',
        lang === 'de'
          ? 'Tank vorne, Range/AOE dahinter — nicht alles auf eine Linie'
          : 'tank front, range/AOE behind — not everything on one line',
        lang,
      ),
    );
  } else {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle überwiegend Nahkampf ist'
          : 'the wave is mostly melee',
        lang === 'de'
          ? 'eine stabile Melee-Front und DPS dahinter'
          : 'a stable melee front with DPS behind',
        lang,
      ),
    );
  }

  if (wave.packing === 'clumped') {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle geklumpt läuft'
          : 'the wave packs clumped',
        lang === 'de'
          ? 'AOE-Fighter hinter der Front priorisieren'
          : 'prioritize AOE fighters behind the front',
        lang,
      ),
    );
  } else if (wave.packing === 'spread') {
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? 'die Welle gesplittet/verteilt aufgestellt ist'
          : 'the wave is spread out',
        lang === 'de'
          ? 'Single-Target-DPS und gutes Kiting — reine AOE-Abhängigkeit vermeiden'
          : 'single-target DPS and solid kiting — avoid pure AOE dependence',
        lang,
      ),
    );
  } else {
    parts.push(
      weilEmpfehlung(
        lang === 'de' ? 'die Welle in Linie kommt' : 'the wave arrives in a line',
        lang === 'de'
          ? 'Frontbreite halten und DPS gestaffelt platzieren'
          : 'hold front width and stagger DPS placement',
        lang,
      ),
    );
  }

  if (wave.tags.includes('flying')) {
    parts.push(
      weilEmpfehlung(
        lang === 'de' ? 'die Welle Flying hat' : 'the wave has flying units',
        lang === 'de'
          ? 'Range/Anti-Air mitplanen — reine Ground-Melee-Stacks sind riskant'
          : 'plan range/anti-air — pure ground-melee stacks are risky',
        lang,
      ),
    );
  }

  return parts.join('\n\n');
}
