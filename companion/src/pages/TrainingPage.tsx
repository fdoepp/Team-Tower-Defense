import { useCallback, useState } from 'react';
import { Chip } from '../components/Chip';
import { TypeIcon } from '../components/TypeIcon';
import { UnitIcon } from '../components/UnitIcon';
import { WaveBadge } from '../components/WaveBadge';
import { displayName } from '../lib/names';
import {
  explainChoice,
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
  const [selected, setSelected] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  const [score, setScore] = useState({ ok: 0, total: 0 });

  const card = session[idx];

  const resetAnswer = () => {
    setSelected(null);
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
    if (!card || feedback) return;
    setSelected(id);
    const result = explainChoice(card, id, nameLang);
    setScore((s) => ({
      ok: s.ok + (result.ok ? 1 : 0),
      total: s.total + 1,
    }));
    setFeedback(result);
  };

  if (!card) {
    return (
      <div className="page">
        <p>{nameLang === 'de' ? 'Keine Karten.' : 'No cards.'}</p>
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
          {card.subject.kind === 'wave' && card.subject.waveNumber != null ? (
            <WaveBadge
              waveNumber={card.subject.waveNumber}
              creatureIcon={card.subject.icon}
              creatureName={subjectName}
              size={64}
            />
          ) : (
            <UnitIcon
              icon={card.subject.icon}
              name={subjectName}
              size={64}
              unitId={card.subject.id}
              kind={card.subject.kind === 'merc' ? 'merc' : undefined}
            />
          )}
          <div>
            <p className="training-kicker">
              {card.subject.kind === 'wave'
                ? nameLang === 'de'
                  ? 'Wellen-Frage'
                  : 'Wave question'
                : card.subject.kind === 'merc'
                  ? nameLang === 'de'
                    ? 'Söldner'
                    : 'Mercenary'
                  : nameLang === 'de'
                    ? 'Kämpfer'
                    : 'Fighter'}
            </p>
            <h2>{subjectName}</h2>
          </div>
        </div>

        <p className="prompt">{promptFor(card, nameLang)}</p>
        {hint && <p className="prompt-hint">{hint}</p>}

        <div className="chip-row chip-row--quiz">
          {card.options.map((o) => {
            const isSel = selected === o.id;
            const isCorrect =
              feedback &&
              (card.mode === 'unitRole'
                ? card.correctIds.includes(o.id)
                : card.correctIds.includes(o.id));
            const showMark = feedback && (isSel || isCorrect);
            return (
              <Chip
                key={o.id}
                active={isSel}
                className={
                  showMark
                    ? isCorrect
                      ? 'chip--correct'
                      : isSel
                        ? 'chip--wrong'
                        : ''
                    : ''
                }
                onClick={() => pick(o.id)}
                disabled={!!feedback}
              >
                <OptionContent opt={o} />
              </Chip>
            );
          })}
        </div>

        {feedback && (
          <div
            className={`feedback ${feedback.ok ? 'feedback--ok' : 'feedback--bad'}`}
          >
            <strong>
              {feedback.ok
                ? nameLang === 'de'
                  ? 'Richtig'
                  : 'Correct'
                : nameLang === 'de'
                  ? 'Falsch'
                  : 'Wrong'}
            </strong>
            <p>{feedback.text}</p>
          </div>
        )}

        <div className="cta-row mt">
          {feedback ? (
            <button type="button" className="btn btn--primary" onClick={next}>
              {nameLang === 'de' ? 'Weiter' : 'Next'}
            </button>
          ) : (
            <p className="prompt-hint" style={{ margin: 0 }}>
              {nameLang === 'de'
                ? 'Tippe eine Antwort — Erklärung erscheint sofort.'
                : 'Tap an answer — explanation appears immediately.'}
            </p>
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
