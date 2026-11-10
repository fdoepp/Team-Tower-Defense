import { FIGHTERS } from '../data/fighters';
import { MERCS, MERC_BY_ID } from '../data/mercs';
import { WAVES } from '../data/waves';
import type {
  AttackType,
  DefenseType,
  NameLang,
  Role,
  Wave,
} from '../data/types';
import {
  ATTACK_STRONG_VS,
  ATTACK_TYPES,
  DEFENSE_TYPES,
  DEFENSE_WEAK_TO,
  compositionBlurb,
  rpsAttackVsDefense,
  rpsHoldVsAttack,
  rpsHowToBeatDefense,
  typeLabel,
  weilEmpfehlung,
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

function waveRpsBlock(wave: Wave, lang: NameLang): string[] {
  // Most important first: wave attack → your armor, then wave armor → your attack.
  return [
    rpsHoldVsAttack(wave.attackType, lang),
    rpsHowToBeatDefense(wave.defenseType, lang),
    compositionBlurb(wave, lang),
  ];
}

/** Immediate explanation after clicking an answer — always „Weil X folgt Empfehlung Y.“ */
export function explainChoice(
  card: QuizCard,
  selectedId: string,
  lang: NameLang,
): { ok: boolean; text: string } {
  const ok = card.correctIds.includes(selectedId);
  const wave = card.meta?.wave;
  const parts: string[] = [];

  if (card.mode === 'waveBestMerc' && wave) {
    const picked = MERC_BY_ID[selectedId];
    const best = MERC_BY_ID[card.meta?.correctMercId ?? card.correctIds[0]!];
    const creature = lang === 'de' ? wave.creatureDe : wave.creatureEn;

    if (!ok) {
      parts.push(
        lang === 'de'
          ? `Nicht ideal für Welle ${wave.number} (${creature}).`
          : `Not ideal for wave ${wave.number} (${creature}).`,
      );
    }

    // Merc tip first when answering merc question, then full RPS both ways.
    if (best) {
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? `die Welle ${typeLabel(wave.defenseType, 'de')}-Rüstung hat und ${mercProfile('de', best.incomeProfile)} passt`
            : `the wave has ${typeLabel(wave.defenseType, 'en')} armor and ${mercProfile('en', best.incomeProfile)} fits`,
          lang === 'de'
            ? `${best.nameDe} (${typeLabel(best.attackType, 'de')}-Angriff)`
            : `${best.nameEn} (${typeLabel(best.attackType, 'en')} attack)`,
          lang,
        ),
      );
    }

    parts.push(...waveRpsBlock(wave, lang));

    if (picked) {
      parts.push(
        rpsAttackVsDefense(picked.attackType, wave.defenseType, lang),
      );
      if (wave.packing === 'clumped' && picked.roles.includes('AOE')) {
        parts.push(
          weilEmpfehlung(
            lang === 'de'
              ? 'die Welle geklumpt ist und dein Send AOE mitbringt'
              : 'the wave is clumped and your send brings AOE',
            lang === 'de'
              ? 'diesen Flächenschaden gegen die Klumpen priorisieren'
              : 'prioritize that AOE into the clumps',
            lang,
          ),
        );
      }
      if (wave.packing === 'spread' && picked.spawnClass === 'ranged') {
        parts.push(
          weilEmpfehlung(
            lang === 'de'
              ? 'die Welle gesplittet ist und dein Send Ranged ist'
              : 'the wave is spread and your send is ranged',
            lang === 'de'
              ? 'Ranged-Sends statt reiner Tank-Front'
              : 'ranged sends over a pure tank front',
            lang,
          ),
        );
      }
    }

    if (wave.tags.includes('break-window')) {
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? 'ein Break-Fenster offen ist'
            : 'a break window is open',
          lang === 'de'
            ? 'Mythium in Power-Söldner (Leak-Chance), nicht nur Income-Schnecken'
            : 'Mythium into power mercs (leak chance), not only income Snails',
          lang,
        ),
      );
    } else {
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? 'kein klares Break-Fenster da ist'
            : 'there is no clear break window',
          lang === 'de'
            ? 'Income/King statt teurem Power-Send'
            : 'income/King over an expensive power send',
          lang,
        ),
      );
    }
  } else if (
    (card.mode === 'waveAttack' || card.mode === 'waveDefense') &&
    wave
  ) {
    const creature = lang === 'de' ? wave.creatureDe : wave.creatureEn;
    if (card.mode === 'waveAttack') {
      if (!ok) {
        parts.push(
          lang === 'de'
            ? `Nicht ${typeLabel(selectedId, 'de')} — ${creature} greifen mit ${typeLabel(wave.attackType, 'de')} an.`
            : `Not ${typeLabel(selectedId, 'en')} — ${creature} attack with ${typeLabel(wave.attackType, 'en')}.`,
        );
      }
      // Attack question: hold-vs-attack first, then crack wave armor, then formation.
      parts.push(rpsHoldVsAttack(wave.attackType, lang));
      parts.push(rpsHowToBeatDefense(wave.defenseType, lang));
      parts.push(compositionBlurb(wave, lang));
    } else {
      if (!ok) {
        parts.push(
          lang === 'de'
            ? `Nicht ${typeLabel(selectedId, 'de')} — ${creature} haben ${typeLabel(wave.defenseType, 'de')}-Rüstung.`
            : `Not ${typeLabel(selectedId, 'en')} — ${creature} have ${typeLabel(wave.defenseType, 'en')} armor.`,
        );
      }
      // Defense question: crack armor first, then hold vs wave attack, then formation.
      parts.push(rpsHowToBeatDefense(wave.defenseType, lang));
      parts.push(rpsHoldVsAttack(wave.attackType, lang));
      parts.push(compositionBlurb(wave, lang));
    }
  } else if (card.mode === 'waveTag' && wave) {
    if (!ok) {
      parts.push(
        lang === 'de'
          ? 'Das ist nicht die zentrale Eigenschaft dieser Welle.'
          : 'That is not this wave’s key trait.',
      );
    }
    parts.push(compositionBlurb(wave, lang));
    parts.push(rpsHoldVsAttack(wave.attackType, lang));
    parts.push(rpsHowToBeatDefense(wave.defenseType, lang));
  } else if (card.mode === 'unitAttack' || card.mode === 'unitDefense') {
    const correct = card.correctIds[0]!;
    if (!ok) {
      parts.push(
        lang === 'de'
          ? `Nicht ${typeLabel(selectedId, 'de')} — richtig ist ${typeLabel(correct, 'de')}.`
          : `Not ${typeLabel(selectedId, 'en')} — correct is ${typeLabel(correct, 'en')}.`,
      );
    }
    if (card.mode === 'unitAttack' && card.meta?.unitAttack) {
      const vs = ATTACK_STRONG_VS[card.meta.unitAttack] ?? [];
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? `die Unit ${typeLabel(card.meta.unitAttack, 'de')} angreift`
            : `the unit attacks with ${typeLabel(card.meta.unitAttack, 'en')}`,
          lang === 'de'
            ? `sie gegen ${vs.map((d) => typeLabel(d, 'de')).join(', ') || '—'}-Rüstung einsetzen`
            : `use it into ${vs.map((d) => typeLabel(d, 'en')).join(', ') || '—'} armor`,
          lang,
        ),
      );
    }
    if (card.mode === 'unitDefense' && card.meta?.unitDefense) {
      const def = card.meta.unitDefense as DefenseType;
      const weakTo = DEFENSE_WEAK_TO[def] ?? [];
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? `die Unit ${typeLabel(def, 'de')}-Rüstung hat`
            : `the unit has ${typeLabel(def, 'en')} armor`,
          lang === 'de'
            ? `sie vor ${weakTo.map((a) => typeLabel(a, 'de')).join(', ') || '—'}-Angriff schützen bzw. selbst ${weakTo.map((a) => typeLabel(a, 'de')).join(', ') || '—'} gegen diese Rüstung nutzen`
            : `protect it from ${weakTo.map((a) => typeLabel(a, 'en')).join(', ') || '—'} attack, or use those attacks into this armor`,
          lang,
        ),
      );
    }
  } else if (card.mode === 'unitStrongVsDef' || card.mode === 'unitWeakToAtk') {
    const correct = card.correctIds[0]!;
    if (!ok) {
      parts.push(
        lang === 'de'
          ? `Nicht ${typeLabel(selectedId, 'de') || selectedId} — erwartet: ${typeLabel(correct, 'de') || correct}.`
          : `Not ${typeLabel(selectedId, 'en') || selectedId} — expected: ${typeLabel(correct, 'en') || correct}.`,
      );
    }
    if (
      card.meta?.unitAttack &&
      (DEFENSE_TYPES as string[]).includes(correct)
    ) {
      parts.push(
        rpsAttackVsDefense(
          card.meta.unitAttack,
          correct as DefenseType,
          lang,
        ),
      );
    }
    if (card.mode === 'unitWeakToAtk' && card.meta?.unitDefense) {
      const def = String(card.meta.unitDefense) as DefenseType;
      parts.push(
        weilEmpfehlung(
          lang === 'de'
            ? `die Unit ${typeLabel(def, 'de')}-Rüstung hat`
            : `the unit has ${typeLabel(def, 'en')} armor`,
          lang === 'de'
            ? `${(DEFENSE_WEAK_TO[def] ?? []).map((a) => typeLabel(a, 'de')).join(', ') || '—'}-Angriff als Gefahr behandeln`
            : `treat ${(DEFENSE_WEAK_TO[def] ?? []).map((a) => typeLabel(a, 'en')).join(', ') || '—'} attack as a threat`,
          lang,
        ),
      );
    }
  } else if (card.mode === 'unitRole') {
    const roles = card.correctIds
      .map((r) => ROLE_LABEL[r as Role]?.[lang] ?? r)
      .join(', ');
    parts.push(
      weilEmpfehlung(
        lang === 'de'
          ? `die Unit die Rolle ${roles} erfüllt`
          : `the unit fills the ${roles} role`,
        lang === 'de'
          ? 'Placement danach ausrichten (Tank vorne, Range/AOE hinten)'
          : 'place accordingly (tank front, range/AOE back)',
        lang,
      ),
    );
  }

  return {
    ok,
    text: parts.filter(Boolean).join('\n\n'),
  };
}
