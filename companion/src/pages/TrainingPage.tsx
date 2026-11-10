import { useCallback, useState } from 'react';
import { Chip } from '../components/Chip';
import { TypeIcon } from '../components/TypeIcon';
import { UnitIcon } from '../components/UnitIcon';
import { displayName } from '../lib/names';
import {
  explainFor,
  gradeAnswer,
  hintFor,
  makeTrainingSession,
  optionLabel,
  promptFor,
  type QuizCard,
  type QuizOption,
} from '../lib/training';
import { useApp } from '../state/AppContext';

function OptionContent({ opt }: { opt: QuizOption }) {
  const { nameLang } = useApp();
  const label = optionLabel(opt, nameLang);
  if (opt.kind === 'type' && opt.icon) {
    return (
      <span className="type-chip-label">
        <TypeIcon type={opt.icon} size={20} />
        <span>{label}</span>
      </span>
    );
  }
  if (opt.kind === 'merc' && opt.icon) {
    return (
      <span className="type-chip-label">
        <UnitIcon icon={opt.icon} name={label} size={22} unitId={opt.id} kind="merc" />
        <span>{label}</span>
      </span>
    );
  }
  return <span>{label}</span>;
}

export function TrainingPage() {
  const { nameLang } = useApp();
  const [session, setSession] = useState<QuizCard[]>(() => makeTrainingSession());
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const card = session[idx];

  const resetAnswer = () => {
    setSelected([]);
    setFeedback(null);
  };

  const next = useCallback(() => {
    resetAnswer();
    if (idx + 1 >= session.length) {
      setSession(makeTrainingSession());
      setIdx(0);
      setScore({ ok: 0, total: 0 });
    } else {
      setIdx(idx + 1);
    }
  }, [idx, session.length]);

  const pick = (id: string) => {
    if (feedback) return;
    // Single-select for all current modes
    setSelected([id]);
  };

  const check = () => {
    if (!card || selected.length === 0) return;
    const { ok } = gradeAnswer(card, selected);
    setScore((s) => ({ ok: s.ok + (ok ? 1 : 0), total: s.total + 1 }));
    setFeedback({
      ok,
      text: explainFor(card, nameLang),
    });
  };

  if (!card) {
    return (
      <div className="page">
        <p>Keine Karten.</p>
      </div>
    );
  }

  const subjectName = displayName(
    nameLang,
    card.subject.nameDe,
    card.subject.nameEn,
  );
  const hint = hintFor(card, nameLang);

  return (
    <div className="page training-page">
      <header className="page-head">
        <h1>Training</h1>
        <p className="muted">
          {nameLang === 'de' ? 'Karte' : 'Card'} {idx + 1}/{session.length} ·{' '}
          {score.ok}/{score.total}
        </p>
      </header>

      <section className="training-card panel">
        <div className="training-subject">
          <UnitIcon
            icon={card.subject.icon}
            name={subjectName}
            size={64}
            unitId={
              card.subject.kind === 'wave' ? undefined : card.subject.id
            }
            kind={card.subject.kind === 'merc' ? 'merc' : undefined}
          />
          <div>
            <p className="training-kicker">
              {card.subject.kind === 'wave'
                ? nameLang === 'de'
                  ? 'Wave-Frage'
                  : 'Wave question'
                : card.subject.kind === 'merc'
                  ? 'Mercenary'
                  : 'Fighter'}
            </p>
            <h2>{subjectName}</h2>
          </div>
        </div>

        <p className="prompt">{promptFor(card, nameLang)}</p>
        {hint && <p className="prompt-hint">{hint}</p>}

        <div className="chip-row chip-row--quiz">
          {card.options.map((o) => (
            <Chip
              key={o.id}
              active={selected.includes(o.id)}
              onClick={() => pick(o.id)}
              disabled={!!feedback}
            >
              <OptionContent opt={o} />
            </Chip>
          ))}
        </div>

        {feedback && (
          <p
            className={`feedback ${feedback.ok ? 'feedback--ok' : 'feedback--bad'}`}
          >
            <strong>
              {feedback.ok
                ? nameLang === 'de'
                  ? 'Richtig'
                  : 'Correct'
                : nameLang === 'de'
                  ? 'Nicht ganz'
                  : 'Not quite'}
            </strong>
            {' — '}
            {feedback.text}
          </p>
        )}

        <div className="cta-row mt">
          {!feedback ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={check}
              disabled={selected.length === 0}
            >
              {nameLang === 'de' ? 'Prüfen' : 'Check'}
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={next}>
              {nameLang === 'de' ? 'Weiter' : 'Next'}
            </button>
          )}
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setSession(makeTrainingSession());
              setIdx(0);
              resetAnswer();
              setScore({ ok: 0, total: 0 });
            }}
          >
            {nameLang === 'de' ? 'Neue Session' : 'New session'}
          </button>
        </div>
      </section>
    </div>
  );
}
