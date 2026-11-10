import { FIGHTERS } from '../data/fighters';
import { MERCS, MERC_BY_ID } from '../data/mercs';
import { WAVES } from '../data/waves';
import type { AttackType, NameLang, Role, Wave } from '../data/types';
import {
  ATTACK_STRONG_VS,
  ATTACK_TYPES,
  DEFENSE_TYPES,
  DEFENSE_WEAK_TO,
  compositionBlurb,
  rpsAttackVsDefense,
  rpsHowToBeatDefense,
  typeLabel,
} from './typing';

export type QuizMode =
  | 'unitAttack'
  | 'unitDefense'
  | 'unitStrongVsDef'
  | 'unitWeakToAtk'
  | 'unitRole'
  | 'waveAttack'
  | 'waveDefense'
  | 'waveBestMerc'
  | 'waveTag';

export type OptionKind = 'type' | 'role' | 'merc' | 'tag';

export interface QuizOption {
  id: string;
  labelDe: string;
  labelEn: string;
  kind: OptionKind;
  icon?: string;
}

export interface QuizCard {
  id: string;
  mode: QuizMode;
  correctIds: string[];
  multiSelect: boolean;
  subject: {
    kind: 'fighter' | 'merc' | 'wave';
    id: string;
    nameDe: string;
    nameEn: string;
    icon: string;
    waveNumber?: number;
  };
  promptDe: string;
  promptEn: string;
  hintDe?: string;
  hintEn?: string;
  options: QuizOption[];
  /** Context for building click explanations */
  meta?: {
    wave?: Wave;
    unitAttack?: AttackType;
    unitDefense?: string;
    correctMercId?: string;
  };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function typeOpts(ids: string[]): QuizOption[] {
  return ids.map((id) => ({
    id,
    labelDe: typeLabel(id, 'de'),
    labelEn: typeLabel(id, 'en'),
    kind: 'type' as const,
    icon: id,
  }));
}

function withDistractors(correct: string, pool: string[], n = 4): string[] {
  const others = shuffle(pool.filter((x) => x !== correct));
  return shuffle([correct, ...others.slice(0, n - 1)]);
}

const ROLE_LABEL: Record<Role, { de: string; en: string }> = {
  Tank: { de: 'Tank', en: 'Tank' },
  DPS: { de: 'DPS', en: 'DPS' },
  Aura: { de: 'Aura', en: 'Aura' },
  AOE: { de: 'Flächenschaden (AOE)', en: 'AOE' },
  Heal: { de: 'Heilung', en: 'Heal' },
  Range: { de: 'Fernkampf', en: 'Range' },
  Mana: { de: 'Mana', en: 'Mana' },
  Carry: { de: 'Carry', en: 'Carry' },
  Opener: { de: 'Opener', en: 'Opener' },
};

const ROLE_OPTS: Role[] = [
  'Tank',
  'DPS',
  'Aura',
  'AOE',
  'Heal',
  'Range',
  'Mana',
  'Carry',
  'Opener',
];

function waveSubject(wave: Wave) {
  return {
    kind: 'wave' as const,
    id: `wave-${wave.number}`,
    nameDe: `Welle ${wave.number} · ${wave.creatureDe}`,
    nameEn: `Wave ${wave.number} · ${wave.creatureEn}`,
    icon: wave.icon,
    waveNumber: wave.number,
  };
}

function buildUnitAttack(): QuizCard {
  const unit =
    Math.random() < 0.3 ? pickRandom(MERCS) : pickRandom(FIGHTERS);
  const kind = 'mythiumCost' in unit ? 'merc' : 'fighter';
  const atk = unit.attackType;
  const opts = withDistractors(atk, ATTACK_TYPES);
  return {
    id: `ua-${unit.id}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'unitAttack',
    correctIds: [atk],
    multiSelect: false,
    subject: {
      kind,
      id: unit.id,
      nameDe: unit.nameDe,
      nameEn: unit.nameEn,
      icon: unit.icon,
    },
    promptDe: `Welchen Angriffstyp hat ${unit.nameDe}?`,
    promptEn: `What attack type does ${unit.nameEn} have?`,
    hintDe: 'Eine Antwort · Schere-Stein-Papier später für Counters.',
    hintEn: 'One answer · rock-paper-scissors later for counters.',
    options: typeOpts(opts),
    meta: { unitAttack: atk, unitDefense: unit.defenseType },
  };
}

function buildUnitDefense(): QuizCard {
  const unit =
    Math.random() < 0.3 ? pickRandom(MERCS) : pickRandom(FIGHTERS);
  const kind = 'mythiumCost' in unit ? 'merc' : 'fighter';
  const def = unit.defenseType;
  const opts = withDistractors(def, DEFENSE_TYPES);
  return {
    id: `ud-${unit.id}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'unitDefense',
    correctIds: [def],
    multiSelect: false,
    subject: {
      kind,
      id: unit.id,
      nameDe: unit.nameDe,
      nameEn: unit.nameEn,
      icon: unit.icon,
    },
    promptDe: `Welchen Verteidigungstyp hat ${unit.nameDe}?`,
    promptEn: `What defense type does ${unit.nameEn} have?`,
    hintDe: 'Eine Antwort — bestimmt, welche Angriffe wehtun.',
    hintEn: 'One answer — decides which attacks hurt it.',
    options: typeOpts(opts),
    meta: { unitDefense: def, unitAttack: unit.attackType },
  };
}

function buildUnitStrongVs(): QuizCard {
  const unit = pickRandom(FIGHTERS.filter((f) => f.strongVs.length > 0));
  const defHit =
    unit.strongVs.find((s) => (DEFENSE_TYPES as string[]).includes(s)) ??
    unit.strongVs[0]!;
  const pool = Array.from(
    new Set([...DEFENSE_TYPES, ...unit.strongVs, 'Flying', 'Clumped']),
  );
  const opts = withDistractors(defHit, pool, 4);
  return {
    id: `us-${unit.id}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'unitStrongVsDef',
    correctIds: [defHit],
    multiSelect: false,
    subject: {
      kind: 'fighter',
      id: unit.id,
      nameDe: unit.nameDe,
      nameEn: unit.nameEn,
      icon: unit.icon,
    },
    promptDe: `Gegen welchen Typ ist ${unit.nameDe} besonders stark?`,
    promptEn: `Which type is ${unit.nameEn} especially strong against?`,
    hintDe: 'Denk an den Defense-Typ / Ziel, das die Unit gut knackt.',
    hintEn: 'Think defense/target type this unit cracks well.',
    options: opts.map((id) => ({
      id,
      labelDe: (DEFENSE_TYPES as string[]).includes(id)
        ? typeLabel(id, 'de')
        : id === 'Flying'
          ? 'Flying (fliegend)'
          : id === 'Clumped'
            ? 'Clumped (geklumpt)'
            : id,
      labelEn: (DEFENSE_TYPES as string[]).includes(id)
        ? typeLabel(id, 'en')
        : id,
      kind: (DEFENSE_TYPES as string[]).includes(id) ? 'type' : 'tag',
      icon: (DEFENSE_TYPES as string[]).includes(id) ? id : undefined,
    })),
    meta: { unitAttack: unit.attackType, unitDefense: unit.defenseType },
  };
}

function buildUnitWeakTo(): QuizCard {
  const unit = pickRandom(FIGHTERS.filter((f) => f.weakVs.length > 0));
  const weak =
    unit.weakVs.find((s) => (ATTACK_TYPES as string[]).includes(s)) ??
    unit.weakVs[0]!;
  const pool = Array.from(
    new Set([...ATTACK_TYPES, ...unit.weakVs, 'Burst', 'Flying']),
  );
  const opts = withDistractors(weak, pool, 4);
  return {
    id: `uw-${unit.id}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'unitWeakToAtk',
    correctIds: [weak],
    multiSelect: false,
    subject: {
      kind: 'fighter',
      id: unit.id,
      nameDe: unit.nameDe,
      nameEn: unit.nameEn,
      icon: unit.icon,
    },
    promptDe: `Wogegen ist ${unit.nameDe} besonders schwach?`,
    promptEn: `What is ${unit.nameEn} especially weak against?`,
    hintDe: 'Der typische Counter / Schwachpunkt — eine Antwort.',
    hintEn: 'The typical counter / weakness — one answer.',
    options: opts.map((id) => ({
      id,
      labelDe: (ATTACK_TYPES as string[]).includes(id)
        ? typeLabel(id, 'de')
        : id === 'Burst'
          ? 'Burst (Burst-Schaden)'
          : id === 'Flying'
            ? 'Flying (fliegend)'
            : id,
      labelEn: (ATTACK_TYPES as string[]).includes(id)
        ? typeLabel(id, 'en')
        : id,
      kind: (ATTACK_TYPES as string[]).includes(id) ? 'type' : 'tag',
      icon: (ATTACK_TYPES as string[]).includes(id) ? id : undefined,
    })),
    meta: { unitAttack: unit.attackType, unitDefense: unit.defenseType },
  };
}

function buildUnitRole(): QuizCard {
  const unit = pickRandom(FIGHTERS);
  const primary = unit.roles[0]!;
  const opts = withDistractors(primary, ROLE_OPTS, 4);
  return {
    id: `ur-${unit.id}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'unitRole',
    correctIds: unit.roles,
    multiSelect: false,
    subject: {
      kind: 'fighter',
      id: unit.id,
      nameDe: unit.nameDe,
      nameEn: unit.nameEn,
      icon: unit.icon,
    },
    promptDe: `Welche Rolle beschreibt ${unit.nameDe} am besten?`,
    promptEn: `Which role best describes ${unit.nameEn}?`,
    hintDe: 'Die passendste Hauptrolle — eine Antwort.',
    hintEn: 'Best primary role — one answer.',
    options: opts.map((id) => ({
      id,
      labelDe: ROLE_LABEL[id as Role]?.de ?? id,
      labelEn: ROLE_LABEL[id as Role]?.en ?? id,
      kind: 'role',
    })),
  };
}

function buildWaveAttack(): QuizCard {
  const wave = pickRandom(WAVES);
  const opts = withDistractors(wave.attackType, ATTACK_TYPES);
  return {
    id: `wa-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveAttack',
    correctIds: [wave.attackType],
    multiSelect: false,
    subject: waveSubject(wave),
    promptDe: `Welchen Angriffstyp haben die Kreaturen auf Welle ${wave.number}?`,
    promptEn: `What attack type do the creatures on wave ${wave.number} have?`,
    hintDe: 'Eine Antwort.',
    hintEn: 'One answer.',
    options: typeOpts(opts),
    meta: { wave },
  };
}

function buildWaveDefense(): QuizCard {
  const wave = pickRandom(WAVES);
  const opts = withDistractors(wave.defenseType, DEFENSE_TYPES);
  return {
    id: `wd-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveDefense',
    correctIds: [wave.defenseType],
    multiSelect: false,
    subject: waveSubject(wave),
    promptDe: `Welchen Verteidigungstyp hat Welle ${wave.number}?`,
    promptEn: `What defense type does wave ${wave.number} have?`,
    hintDe: 'Damit weißt du, welche Angriffe gut dagegen halten.',
    hintEn: 'This tells you which attacks hold well against it.',
    options: typeOpts(opts),
    meta: { wave },
  };
}

function buildWaveBestMerc(): QuizCard {
  const wave = pickRandom(WAVES.filter((w) => w.number >= 4));
  const preferredAtk = DEFENSE_WEAK_TO[wave.defenseType] ?? ['Pure'];
  const ranked = [...MERCS].sort((a, b) => {
    const as = preferredAtk.includes(a.attackType as AttackType) ? 1 : 0;
    const bs = preferredAtk.includes(b.attackType as AttackType) ? 1 : 0;
    if (wave.tags.includes('break-window')) {
      const ap = a.incomeProfile === 'power' ? 1 : 0;
      const bp = b.incomeProfile === 'power' ? 1 : 0;
      return bp + bs - (ap + as);
    }
    return bs - as;
  });
  const best = ranked[0]!;
  const distractors = shuffle(MERCS.filter((m) => m.id !== best.id)).slice(0, 3);
  const choices = shuffle([best, ...distractors]);
  return {
    id: `wm-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveBestMerc',
    correctIds: [best.id],
    multiSelect: false,
    subject: waveSubject(wave),
    promptDe: `Welchen Söldner schickst du am ehesten gegen Welle ${wave.number}?`,
    promptEn: `Which mercenary would you most likely send into wave ${wave.number}?`,
    hintDe: `Wellen-Defense: ${typeLabel(wave.defenseType, 'de')}${wave.tags.includes('break-window') ? ' · Break-Fenster' : ''} · ${wave.formation}/${wave.packing}.`,
    hintEn: `Wave defense: ${typeLabel(wave.defenseType, 'en')}${wave.tags.includes('break-window') ? ' · break window' : ''} · ${wave.formation}/${wave.packing}.`,
    options: choices.map((m) => ({
      id: m.id,
      labelDe: m.nameDe,
      labelEn: m.nameEn,
      kind: 'merc' as const,
      icon: m.icon,
    })),
    meta: { wave, correctMercId: best.id },
  };
}

function buildWaveTag(): QuizCard {
  const wave = pickRandom(WAVES.filter((w) => w.tags.length > 0));
  const tag = wave.tags[0]!;
  const labels: Record<string, { de: string; en: string }> = {
    flying: { de: 'Flying / fliegend', en: 'Flying' },
    'break-window': {
      de: 'Break-Fenster (Send lohnt sich)',
      en: 'Break window (send worth it)',
    },
    opener: { de: 'Frühe Opener-Welle', en: 'Early opener wave' },
    spells: { de: 'Spell-Picks relevant', en: 'Spell picks matter' },
    endgame: { de: 'Endgame', en: 'Endgame' },
    boss: { de: 'Boss', en: 'Boss' },
    'boss-ish': { de: 'Boss-Anteil', en: 'Boss component' },
    melee: { de: 'Überwiegend Nahkampf', en: 'Mostly melee' },
    ranged: { de: 'Überwiegend Fernkampf', en: 'Mostly ranged' },
    clumped: { de: 'Geklumpt (AOE stark)', en: 'Clumped (AOE strong)' },
    spread: { de: 'Gesplittet/verteilt', en: 'Spread out' },
  };
  const allTags = [
    'flying',
    'break-window',
    'opener',
    'spells',
    'endgame',
    'boss-ish',
    'melee',
    'ranged',
    'clumped',
    'spread',
  ];
  const opts = withDistractors(tag, allTags, 4);
  return {
    id: `wt-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveTag',
    correctIds: [tag],
    multiSelect: false,
    subject: waveSubject(wave),
    promptDe: `Was trifft auf Welle ${wave.number} zu?`,
    promptEn: `Which statement fits wave ${wave.number}?`,
    hintDe: 'Eine Eigenschaft dieser Welle.',
    hintEn: 'One property of this wave.',
    options: opts.map((id) => ({
      id,
      labelDe: labels[id]?.de ?? id,
      labelEn: labels[id]?.en ?? id,
      kind: 'tag',
    })),
    meta: { wave },
  };
}

const BUILDERS = [
  buildUnitAttack,
  buildUnitDefense,
  buildUnitStrongVs,
  buildUnitWeakTo,
  buildUnitRole,
  buildWaveAttack,
  buildWaveDefense,
  buildWaveBestMerc,
  buildWaveTag,
];

export function makeTrainingSession(n = 10): QuizCard[] {
  const cards: QuizCard[] = [];
  const waveBuilders = [
    buildWaveAttack,
    buildWaveDefense,
    buildWaveBestMerc,
    buildWaveTag,
  ];
  const unitBuilders = [
    buildUnitAttack,
    buildUnitDefense,
    buildUnitStrongVs,
    buildUnitWeakTo,
    buildUnitRole,
  ];
  for (let i = 0; i < n; i++) {
    const preferWave = i % 5 < 2 || Math.random() < 0.35;
    const builder = preferWave
      ? pickRandom(waveBuilders)
      : pickRandom(unitBuilders);
    try {
      cards.push(builder());
    } catch {
      cards.push(pickRandom(BUILDERS)());
    }
  }
  return cards;
}

export function promptFor(card: QuizCard, lang: NameLang): string {
  return lang === 'de' ? card.promptDe : card.promptEn;
}

export function hintFor(card: QuizCard, lang: NameLang): string | undefined {
  return lang === 'de' ? card.hintDe : card.hintEn;
}

export function optionLabel(opt: QuizOption, lang: NameLang): string {
  return lang === 'de' ? opt.labelDe : opt.labelEn;
}

function mercProfile(lang: NameLang, profile: string): string {
  if (lang === 'de') {
    if (profile === 'power') return 'Power-Söldner (für Break/Leak-Fenster)';
    if (profile === 'income') return 'Income-Söldner (Eco, wenig Break-Druck)';
    return 'Mix Income/Power';
  }
  if (profile === 'power') return 'power merc (break/leak windows)';
  if (profile === 'income') return 'income merc (eco, low break pressure)';
  return 'mixed income/power';
}

/** Immediate explanation after clicking an answer — RPS + composition + tips. */
export function explainChoice(
  card: QuizCard,
  selectedId: string,
  lang: NameLang,
): { ok: boolean; text: string } {
  const ok =
    card.mode === 'unitRole'
      ? card.correctIds.includes(selectedId)
      : card.correctIds.includes(selectedId);

  const wave = card.meta?.wave;
  const parts: string[] = [];

  if (card.mode === 'waveBestMerc' && wave) {
    const picked = MERC_BY_ID[selectedId];
    const best = MERC_BY_ID[card.meta?.correctMercId ?? card.correctIds[0]!];
    const creature = lang === 'de' ? wave.creatureDe : wave.creatureEn;

    parts.push(
      lang === 'de'
        ? `Welle ${wave.number} (${creature}): greift mit ${typeLabel(wave.attackType, 'de')} an und hat ${typeLabel(wave.defenseType, 'de')}-Rüstung.`
        : `Wave ${wave.number} (${creature}): attacks with ${typeLabel(wave.attackType, 'en')} and has ${typeLabel(wave.defenseType, 'en')} armor.`,
    );
    parts.push(compositionBlurb(wave, lang));

    if (picked) {
      parts.push(
        lang === 'de'
          ? `Deine Wahl ${picked.nameDe}: Angriff ${typeLabel(picked.attackType, 'de')}, Defense ${typeLabel(picked.defenseType, 'de')}, Spawn ${picked.spawnClass}, ${mercProfile('de', picked.incomeProfile)}.`
          : `Your pick ${picked.nameEn}: attack ${typeLabel(picked.attackType, 'en')}, defense ${typeLabel(picked.defenseType, 'en')}, spawn ${picked.spawnClass}, ${mercProfile('en', picked.incomeProfile)}.`,
      );
      parts.push(
        rpsAttackVsDefense(picked.attackType, wave.defenseType, lang),
      );
      if (wave.packing === 'clumped' && picked.roles.includes('AOE')) {
        parts.push(
          lang === 'de'
            ? 'Zusatz: geklumpte Welle → AOE-Söldner/Flächenschaden sind besonders wertvoll.'
            : 'Extra: clumped wave → AOE mercs are especially valuable.',
        );
      }
      if (wave.packing === 'spread' && picked.spawnClass === 'ranged') {
        parts.push(
          lang === 'de'
            ? 'Zusatz: gesplittete/Fernkampf-Welle → Ranged-Sends treffen oft besser als reine Tank-Front.'
            : 'Extra: spread/ranged wave → ranged sends often land better than pure tank front.',
        );
      }
      if (wave.tags.includes('flying')) {
        parts.push(
          lang === 'de'
            ? 'Flying-Welle: reine Ground-Melee-Sends sind riskant — Range/Anti-Air-Logik mitdenken.'
            : 'Flying wave: pure ground-melee sends are risky — think range/anti-air.',
        );
      }
    }

    if (best) {
      const strong =
        (ATTACK_STRONG_VS[best.attackType] ?? []).includes(wave.defenseType);
      parts.push(
        lang === 'de'
          ? `${ok ? 'Deshalb passt' : 'Bessere Wahl'}: ${best.nameDe} (${typeLabel(best.attackType, 'de')}, ${mercProfile('de', best.incomeProfile)}) — ${strong ? 'Typing matched die Wellen-Rüstung.' : rpsHowToBeatDefense(wave.defenseType, 'de')}`
          : `${ok ? 'That’s why' : 'Better pick'}: ${best.nameEn} (${typeLabel(best.attackType, 'en')}, ${mercProfile('en', best.incomeProfile)}) — ${strong ? 'typing matches the wave armor.' : rpsHowToBeatDefense(wave.defenseType, 'en')}`,
      );
    }

    if (wave.tags.includes('break-window')) {
      parts.push(
        lang === 'de'
          ? 'Tipp: Break-Fenster → Mythium eher in Power-Söldner stecken (Leak-Chance), nicht nur Income-Schnecken.'
          : 'Tip: break window → spend Mythium on power mercs (leak chance), not only income Snails.',
      );
    } else {
      parts.push(
        lang === 'de'
          ? 'Tipp: Kein klares Break-Fenster → Income/King oft sicherer als teurer Power-Send.'
          : 'Tip: no clear break window → income/King is often safer than an expensive power send.',
      );
    }
    parts.push(lang === 'de' ? wave.tipDe : wave.tipEn);
  } else if (
    (card.mode === 'waveAttack' || card.mode === 'waveDefense') &&
    wave
  ) {
    const creature = lang === 'de' ? wave.creatureDe : wave.creatureEn;
    if (card.mode === 'waveAttack') {
      parts.push(
        ok
          ? lang === 'de'
            ? `Richtig: ${creature} greifen mit ${typeLabel(wave.attackType, 'de')} an.`
            : `Correct: ${creature} attack with ${typeLabel(wave.attackType, 'en')}.`
          : lang === 'de'
            ? `Falsch: nicht ${typeLabel(selectedId, 'de')} — ${creature} greifen mit ${typeLabel(wave.attackType, 'de')} an.`
            : `Wrong: not ${typeLabel(selectedId, 'en')} — ${creature} attack with ${typeLabel(wave.attackType, 'en')}.`,
      );
      parts.push(
        lang === 'de'
          ? `Das bedeutet für deine Fighter: Rüstung gegen ${typeLabel(wave.attackType, 'de')} priorisieren, wo möglich.`
          : `For your fighters: prioritize armor that holds vs ${typeLabel(wave.attackType, 'en')} where possible.`,
      );
    } else {
      parts.push(
        ok
          ? lang === 'de'
            ? `Richtig: ${creature} haben ${typeLabel(wave.defenseType, 'de')}-Rüstung.`
            : `Correct: ${creature} have ${typeLabel(wave.defenseType, 'en')} armor.`
          : lang === 'de'
            ? `Falsch: Welle ${wave.number} hat ${typeLabel(wave.defenseType, 'de')} — nicht ${typeLabel(selectedId, 'de')}.`
            : `Wrong: wave ${wave.number} is ${typeLabel(wave.defenseType, 'en')} — not ${typeLabel(selectedId, 'en')}.`,
      );
      parts.push(rpsHowToBeatDefense(wave.defenseType, lang));
    }
    parts.push(compositionBlurb(wave, lang));
    parts.push(
      lang === 'de'
        ? `Schere-Stein-Papier-Kurz: Angriff der Welle ${typeLabel(wave.attackType, 'de')} vs. deine Defense; deine Angriffe sollten ${typeLabel(wave.defenseType, 'de')} knacken.`
        : `RPS short: wave attack ${typeLabel(wave.attackType, 'en')} vs your defense; your attacks should crack ${typeLabel(wave.defenseType, 'en')}.`,
    );
    parts.push(lang === 'de' ? wave.tipDe : wave.tipEn);
  } else if (card.mode === 'waveTag' && wave) {
    parts.push(
      ok
        ? lang === 'de'
          ? 'Richtig — das trifft auf diese Welle zu.'
          : 'Correct — that fits this wave.'
        : lang === 'de'
          ? 'Falsch — das ist nicht die zentrale Eigenschaft dieser Welle.'
          : 'Wrong — that is not this wave’s key trait.',
    );
    parts.push(compositionBlurb(wave, lang));
    parts.push(
      lang === 'de'
        ? `Typing: ${typeLabel(wave.attackType, 'de')} / ${typeLabel(wave.defenseType, 'de')}. ${rpsHowToBeatDefense(wave.defenseType, 'de')}`
        : `Typing: ${typeLabel(wave.attackType, 'en')} / ${typeLabel(wave.defenseType, 'en')}. ${rpsHowToBeatDefense(wave.defenseType, 'en')}`,
    );
    parts.push(lang === 'de' ? wave.tipDe : wave.tipEn);
  } else if (card.mode === 'unitAttack' || card.mode === 'unitDefense') {
    const correct = card.correctIds[0]!;
    if (ok) {
      parts.push(
        lang === 'de'
          ? `Genau: ${typeLabel(correct, 'de')}.`
          : `Correct: ${typeLabel(correct, 'en')}.`,
      );
    } else {
      parts.push(
        lang === 'de'
          ? `Nicht ${typeLabel(selectedId, 'de')} — richtig ist ${typeLabel(correct, 'de')}.`
          : `Not ${typeLabel(selectedId, 'en')} — correct is ${typeLabel(correct, 'en')}.`,
      );
    }
    if (card.mode === 'unitDefense' && card.meta?.unitDefense) {
      parts.push(
        rpsHowToBeatDefense(
          card.meta.unitDefense as (typeof DEFENSE_TYPES)[number],
          lang,
        ),
      );
      parts.push(
        lang === 'de'
          ? 'Merke: Unit-Defense sagt, welche Angriffstypen sie knacken — das gleiche Prinzip wie bei Wellen-Rüstung.'
          : 'Remember: unit defense tells you which attack types crack it — same principle as wave armor.',
      );
    }
    if (card.mode === 'unitAttack' && card.meta?.unitAttack) {
      const vs = ATTACK_STRONG_VS[card.meta.unitAttack] ?? [];
      parts.push(
        lang === 'de'
          ? `${typeLabel(card.meta.unitAttack, 'de')} ist typischerweise stark gegen: ${vs.map((d) => typeLabel(d, 'de')).join(', ') || '—'}. Schwach gegen andere Rüstungen — Counters wählen.`
          : `${typeLabel(card.meta.unitAttack, 'en')} is typically strong vs: ${vs.map((d) => typeLabel(d, 'en')).join(', ') || '—'}. Weak vs other armors — pick counters.`,
      );
    }
  } else if (card.mode === 'unitStrongVsDef' || card.mode === 'unitWeakToAtk') {
    const correct = card.correctIds[0]!;
    if (ok) {
      parts.push(
        lang === 'de'
          ? `Stimmt: ${typeLabel(correct, 'de') || correct}.`
          : `Yes: ${typeLabel(correct, 'en') || correct}.`,
      );
    } else {
      parts.push(
        lang === 'de'
          ? `Deine Wahl (${typeLabel(selectedId, 'de') || selectedId}) passt nicht — erwartet: ${typeLabel(correct, 'de') || correct}.`
          : `Your pick (${typeLabel(selectedId, 'en') || selectedId}) doesn’t fit — expected: ${typeLabel(correct, 'en') || correct}.`,
      );
    }
    if (
      card.meta?.unitAttack &&
      (DEFENSE_TYPES as string[]).includes(correct)
    ) {
      parts.push(
        rpsAttackVsDefense(
          card.meta.unitAttack,
          correct as (typeof DEFENSE_TYPES)[number],
          lang,
        ),
      );
    }
    if (card.mode === 'unitWeakToAtk' && card.meta?.unitDefense) {
      parts.push(
        lang === 'de'
          ? `Die Unit selbst hat ${typeLabel(String(card.meta.unitDefense), 'de')}-Defense — Angriffe, die diese Rüstung knacken, sind gefährlich für sie.`
          : `The unit itself has ${typeLabel(String(card.meta.unitDefense), 'en')} defense — attacks that crack that armor are dangerous to it.`,
      );
    }
  } else if (card.mode === 'unitRole') {
    parts.push(
      ok
        ? lang === 'de'
          ? `Passt — gültige Rollen: ${card.correctIds.map((r) => ROLE_LABEL[r as Role]?.de ?? r).join(', ')}. Rolle steuert Placement (Tank vorne, Range/AOE hinten) und welche Wellen-Komposition sie löst.`
          : `Fits — valid roles: ${card.correctIds.map((r) => ROLE_LABEL[r as Role]?.en ?? r).join(', ')}. Role drives placement (tank front, range/AOE back) and which wave compositions it solves.`
        : lang === 'de'
          ? `Besser eine von: ${card.correctIds.map((r) => ROLE_LABEL[r as Role]?.de ?? r).join(', ')}. Denk Placement + Typing, nicht nur den Namen.`
          : `Prefer one of: ${card.correctIds.map((r) => ROLE_LABEL[r as Role]?.en ?? r).join(', ')}. Think placement + typing, not just the name.`,
    );
  }

  return {
    ok,
    text: parts.filter(Boolean).join(' '),
  };
}
