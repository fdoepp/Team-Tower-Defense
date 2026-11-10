import { useCallback, useMemo, useState } from 'react';
import { FIGHTERS } from '../data/fighters';
import { MERCS } from '../data/mercs';
import type { Role } from '../data/types';
import { displayName } from '../lib/names';
import { useApp } from '../state/AppContext';
import { Chip } from '../components/Chip';
import { UnitIcon } from '../components/UnitIcon';

const ROLE_OPTIONS: Role[] = [
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

const TYPE_OPTIONS = [
  'Impact',
  'Pierce',
  'Magic',
  'Pure',
  'Swift',
  'Natural',
  'Fortified',
  'Immaterial',
];

type PromptKind = 'roles' | 'typing' | 'strongWeak';

interface Card {
  kind: 'fighter' | 'merc';
  id: string;
  prompt: PromptKind;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}

function makeSession(n = 8): Card[] {
  const cards: Card[] = [];
  for (let i = 0; i < n; i++) {
    const useMerc = Math.random() < 0.35;
    const prompt = pickRandom<PromptKind>(['roles', 'typing', 'strongWeak']);
    if (useMerc) {
      cards.push({ kind: 'merc', id: pickRandom(MERCS).id, prompt });
    } else {
      cards.push({ kind: 'fighter', id: pickRandom(FIGHTERS).id, prompt });
    }
  }
  return cards;
}

export function TrainingPage() {
  const { nameLang } = useApp();
  const [session, setSession] = useState<Card[]>(() => makeSession());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const card = session[idx];
  const subject = useMemo(() => {
    if (!card) return null;
    if (card.kind === 'merc') return MERCS.find((m) => m.id === card.id) ?? null;
    return FIGHTERS.find((f) => f.id === card.id) ?? null;
  }, [card]);

  const resetAnswer = () => {
    setSelected([]);
    setFeedback(null);
  };

  const next = useCallback(() => {
    resetAnswer();
    if (idx + 1 >= session.length) {
      setSession(makeSession());
      setIdx(0);
    } else {
      setIdx(idx + 1);
    }
  }, [idx, session.length]);

  const toggle = (v: string) => {
    setSelected((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v],
    );
  };

  const check = () => {
    if (!card || !subject) return;
    let expected: string[] = [];
    let detail = '';
    if (card.prompt === 'roles') {
      expected = subject.roles;
      detail = `Rollen: ${expected.join(', ')}`;
    } else if (card.prompt === 'typing') {
      expected = [subject.attackType, subject.defenseType];
      detail = `Atk ${subject.attackType} / Def ${subject.defenseType}`;
    } else {
      expected = [...subject.strongVs.slice(0, 2), ...subject.weakVs.slice(0, 1)];
      detail = `Stark: ${subject.strongVs.join(', ')} · Schwach: ${subject.weakVs.join(', ')}`;
    }
    const hit = expected.filter((e) =>
      selected.some((s) => s.toLowerCase() === e.toLowerCase()),
    ).length;
    const ok = hit >= Math.ceil(expected.length / 2) && selected.length > 0;
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    setFeedback(
      `${ok ? '✓' : '✗'} ${detail} · confidence: ${subject.confidence}`,
    );
  };

  if (!card || !subject) {
    return (
      <div className="page">
        <p>Keine Karten.</p>
      </div>
    );
  }

  const name = displayName(nameLang, subject.nameDe, subject.nameEn);
  const options =
    card.prompt === 'roles'
      ? ROLE_OPTIONS
      : card.prompt === 'typing'
        ? TYPE_OPTIONS
        : Array.from(
            new Set([
              ...subject.strongVs,
              ...subject.weakVs,
              'Flying',
              'Clumped',
              'Burst',
              'Sustain',
              'Fortified',
              'Swift',
              'Magic',
              'Natural',
            ]),
          );

  const promptLabel =
    card.prompt === 'roles'
      ? nameLang === 'de'
        ? 'Welche Rollen?'
        : 'Which roles?'
      : card.prompt === 'typing'
        ? nameLang === 'de'
          ? 'Attack- & Defense-Type?'
          : 'Attack & defense type?'
        : nameLang === 'de'
          ? 'Stark / schwach gegen?'
          : 'Strong / weak vs?';

  return (
    <div className="page training-page">
      <header className="page-head">
        <h1>Training</h1>
        <p className="muted">
          Karte {idx + 1}/{session.length} · Score {score.ok}/{score.total}
        </p>
      </header>

      <section className="training-card panel">
        <UnitIcon icon={subject.icon} name={name} size={72} />
        <h2>{name}</h2>
        <p className="tiny muted">
          {card.kind === 'merc' ? 'Mercenary' : 'Fighter'}
        </p>
        <p className="prompt">{promptLabel}</p>

        <div className="chip-row">
          {options.map((o) => (
            <Chip key={o} active={selected.includes(o)} onClick={() => toggle(o)}>
              {o}
            </Chip>
          ))}
        </div>

        {feedback && <p className="feedback">{feedback}</p>}

        <div className="cta-row mt">
          {!feedback ? (
            <button type="button" className="btn btn--primary" onClick={check}>
              Prüfen
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={next}>
              Weiter
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setSession(makeSession());
              setIdx(0);
              resetAnswer();
              setScore({ ok: 0, total: 0 });
            }}
          >
            Neue Session
          </button>
        </div>
      </section>
    </div>
  );
}
