import { FIGHTERS } from '../data/fighters';
import { MERCS } from '../data/mercs';
import { WAVES } from '../data/waves';
import type { AttackType, NameLang, Role } from '../data/types';
import { ATTACK_TYPES, DEFENSE_TYPES, DEFENSE_WEAK_TO } from './typing';

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
  /** CDN icon stem for types/mercs */
  icon?: string;
}

export interface QuizCard {
  id: string;
  mode: QuizMode;
  /** Single correct answer id (or primary); multiCorrect for multi-select modes */
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
  explainDe: string;
  explainEn: string;
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
    labelDe: id,
    labelEn: id,
    kind: 'type' as const,
    icon: id,
  }));
}

function withDistractors(correct: string, pool: string[], n = 4): string[] {
  const others = shuffle(pool.filter((x) => x !== correct));
  return shuffle([correct, ...others.slice(0, n - 1)]);
}

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
    promptDe: `Welchen Angriffstyp (Attack Type) hat ${unit.nameDe}?`,
    promptEn: `What attack type does ${unit.nameEn} have?`,
    hintDe: 'Genau eine richtige Antwort.',
    hintEn: 'Exactly one correct answer.',
    options: typeOpts(opts),
    explainDe: `${unit.nameDe} greift mit ${atk} an.`,
    explainEn: `${unit.nameEn} attacks with ${atk}.`,
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
    promptDe: `Welchen Verteidigungstyp (Defense Type) hat ${unit.nameDe}?`,
    promptEn: `What defense type does ${unit.nameEn} have?`,
    hintDe: 'Genau eine richtige Antwort.',
    hintEn: 'Exactly one correct answer.',
    options: typeOpts(opts),
    explainDe: `${unit.nameDe} hat Defense ${def}.`,
    explainEn: `${unit.nameEn} has defense ${def}.`,
  };
}

function buildUnitStrongVs(): QuizCard {
  const unit = pickRandom(FIGHTERS.filter((f) => f.strongVs.length > 0));
  // Prefer defense-type answers when available
  const defHit =
    unit.strongVs.find((s) =>
      (DEFENSE_TYPES as string[]).includes(s),
    ) ?? unit.strongVs[0]!;
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
    hintDe: 'Wähle den Defense-/Zieltyp, gegen den die Unit gut performt.',
    hintEn: 'Pick the defense/target type this unit performs well against.',
    options: opts.map((id) => ({
      id,
      labelDe: id,
      labelEn: id,
      kind: (DEFENSE_TYPES as string[]).includes(id) ? 'type' : 'tag',
      icon: (DEFENSE_TYPES as string[]).includes(id) ? id : undefined,
    })),
    explainDe: `${unit.nameDe} ist u. a. stark gegen: ${unit.strongVs.join(', ')}.`,
    explainEn: `${unit.nameEn} is strong vs: ${unit.strongVs.join(', ')}.`,
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
    hintDe: 'Eine Antwort — der typische Counter / Schwachpunkt.',
    hintEn: 'One answer — the typical counter / weakness.',
    options: opts.map((id) => ({
      id,
      labelDe: id,
      labelEn: id,
      kind: (ATTACK_TYPES as string[]).includes(id) ? 'type' : 'tag',
      icon: (ATTACK_TYPES as string[]).includes(id) ? id : undefined,
    })),
    explainDe: `${unit.nameDe} ist u. a. schwach gegen: ${unit.weakVs.join(', ')}.`,
    explainEn: `${unit.nameEn} is weak vs: ${unit.weakVs.join(', ')}.`,
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
    promptEn: `Which role best describes ${unit.nameDe}?`,
    hintDe: 'Wähle die passendste Hauptrolle (eine Antwort).',
    hintEn: 'Pick the best primary role (one answer).',
    options: opts.map((id) => ({
      id,
      labelDe: id,
      labelEn: id,
      kind: 'role',
    })),
    explainDe: `Rollen von ${unit.nameDe}: ${unit.roles.join(', ')}.`,
    explainEn: `Roles for ${unit.nameEn}: ${unit.roles.join(', ')}.`,
  };
}

function buildWaveAttack(): QuizCard {
  const wave = pickRandom(WAVES);
  const opts = withDistractors(wave.attackType, ATTACK_TYPES);
  const nameDe = `Wave ${wave.number} · ${wave.creatureDe}`;
  const nameEn = `Wave ${wave.number} · ${wave.creatureEn}`;
  return {
    id: `wa-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveAttack',
    correctIds: [wave.attackType],
    multiSelect: false,
    subject: {
      kind: 'wave',
      id: `wave-${wave.number}`,
      nameDe,
      nameEn,
      icon: wave.icon,
      waveNumber: wave.number,
    },
    promptDe: `Welchen Angriffstyp haben die Creatures auf Wave ${wave.number}?`,
    promptEn: `What attack type do the creatures on wave ${wave.number} have?`,
    hintDe: 'Genau eine richtige Antwort.',
    hintEn: 'Exactly one correct answer.',
    options: typeOpts(opts),
    explainDe: `Wave ${wave.number} (${wave.creatureDe}): Attack ${wave.attackType}.`,
    explainEn: `Wave ${wave.number} (${wave.creatureEn}): attack ${wave.attackType}.`,
  };
}

function buildWaveDefense(): QuizCard {
  const wave = pickRandom(WAVES);
  const opts = withDistractors(wave.defenseType, DEFENSE_TYPES);
  const nameDe = `Wave ${wave.number} · ${wave.creatureDe}`;
  const nameEn = `Wave ${wave.number} · ${wave.creatureEn}`;
  return {
    id: `wd-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveDefense',
    correctIds: [wave.defenseType],
    multiSelect: false,
    subject: {
      kind: 'wave',
      id: `wave-${wave.number}`,
      nameDe,
      nameEn,
      icon: wave.icon,
      waveNumber: wave.number,
    },
    promptDe: `Welchen Verteidigungstyp hat Wave ${wave.number}?`,
    promptEn: `What defense type does wave ${wave.number} have?`,
    hintDe: 'Damit weißt du, welche Attack Types gut dagegen halten.',
    hintEn: 'This tells you which attack types hold well against it.',
    options: typeOpts(opts),
    explainDe: `Wave ${wave.number}: Defense ${wave.defenseType}. Gut dagegen: ${(DEFENSE_WEAK_TO[wave.defenseType] ?? []).join(', ') || '—'}.`,
    explainEn: `Wave ${wave.number}: defense ${wave.defenseType}. Strong vs it: ${(DEFENSE_WEAK_TO[wave.defenseType] ?? []).join(', ') || '—'}.`,
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
  const nameDe = `Wave ${wave.number} · ${wave.creatureDe}`;
  const nameEn = `Wave ${wave.number} · ${wave.creatureEn}`;
  return {
    id: `wm-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveBestMerc',
    correctIds: [best.id],
    multiSelect: false,
    subject: {
      kind: 'wave',
      id: `wave-${wave.number}`,
      nameDe,
      nameEn,
      icon: wave.icon,
      waveNumber: wave.number,
    },
    promptDe: `Welchen Söldner (Merc) schickst du am ehesten mit gegen Wave ${wave.number}?`,
    promptEn: `Which mercenary would you most likely send into wave ${wave.number}?`,
    hintDe: `Wave-Defense ist ${wave.defenseType}${wave.tags.includes('break-window') ? ' · Break-Fenster' : ''}.`,
    hintEn: `Wave defense is ${wave.defenseType}${wave.tags.includes('break-window') ? ' · break window' : ''}.`,
    options: choices.map((m) => ({
      id: m.id,
      labelDe: m.nameDe,
      labelEn: m.nameEn,
      kind: 'merc' as const,
      icon: m.icon,
    })),
    explainDe: `Gegen Defense ${wave.defenseType} passt ${best.nameDe} (${best.attackType}${best.incomeProfile === 'power' ? ', Power' : best.incomeProfile === 'income' ? ', Income' : ''}) gut. Faustregel — Match-Kontext zählt.`,
    explainEn: `Vs defense ${wave.defenseType}, ${best.nameEn} (${best.attackType}${best.incomeProfile === 'power' ? ', power' : best.incomeProfile === 'income' ? ', income' : ''}) fits well. Rule of thumb — match context matters.`,
  };
}

function buildWaveTag(): QuizCard {
  const wave = pickRandom(WAVES.filter((w) => w.tags.length > 0));
  const tag = wave.tags[0]!;
  const labels: Record<string, { de: string; en: string }> = {
    flying: { de: 'Flying / fliegend', en: 'Flying' },
    'break-window': { de: 'Break-Fenster (Send lohnt)', en: 'Break window (send worth it)' },
    opener: { de: 'Frühe Opener-Wave', en: 'Early opener wave' },
    spells: { de: 'Spell-Picks relevant', en: 'Spell picks matter' },
    endgame: { de: 'Endgame', en: 'Endgame' },
    boss: { de: 'Boss-ähnlich', en: 'Boss-like' },
    'boss-ish': { de: 'Boss-ähnlich', en: 'Boss-like' },
  };
  const allTags = [
    'flying',
    'break-window',
    'opener',
    'spells',
    'endgame',
    'boss-ish',
  ];
  const opts = withDistractors(tag, allTags, 4);
  return {
    id: `wt-${wave.number}-${Math.random().toString(36).slice(2, 6)}`,
    mode: 'waveTag',
    correctIds: [tag],
    multiSelect: false,
    subject: {
      kind: 'wave',
      id: `wave-${wave.number}`,
      nameDe: `Wave ${wave.number} · ${wave.creatureDe}`,
      nameEn: `Wave ${wave.number} · ${wave.creatureEn}`,
      icon: wave.icon,
      waveNumber: wave.number,
    },
    promptDe: `Was trifft auf Wave ${wave.number} zu?`,
    promptEn: `Which statement fits wave ${wave.number}?`,
    hintDe: 'Eine Eigenschaft dieser Wave.',
    hintEn: 'One property of this wave.',
    options: opts.map((id) => ({
      id,
      labelDe: labels[id]?.de ?? id,
      labelEn: labels[id]?.en ?? id,
      kind: 'tag',
    })),
    explainDe: `Wave ${wave.number}: ${wave.tags.map((t) => labels[t]?.de ?? t).join(', ')}. ${wave.tipDe}`,
    explainEn: `Wave ${wave.number}: ${wave.tags.map((t) => labels[t]?.en ?? t).join(', ')}. ${wave.tipEn}`,
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
  // Ensure mix: at least ~40% wave-related
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

export function explainFor(card: QuizCard, lang: NameLang): string {
  return lang === 'de' ? card.explainDe : card.explainEn;
}

export function optionLabel(opt: QuizOption, lang: NameLang): string {
  return lang === 'de' ? opt.labelDe : opt.labelEn;
}

export function gradeAnswer(
  card: QuizCard,
  selected: string[],
): { ok: boolean; detail: string } {
  if (selected.length === 0) return { ok: false, detail: '' };
  if (card.mode === 'unitRole') {
    // any of the unit's roles is acceptable
    const ok = selected.some((s) => card.correctIds.includes(s));
    return { ok, detail: '' };
  }
  const ok =
    selected.length === 1 && card.correctIds.includes(selected[0]!);
  return { ok, detail: '' };
}
