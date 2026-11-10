import { useMemo, useState } from 'react';
import { CAMPAIGN_MISSIONS } from '../data/campaign';
import { GUIDES } from '../data/guides';
import { LEGIONS } from '../data/legions';
import { STRATEGIES } from '../data/strategies';
import { useApp } from '../state/AppContext';
import { Chip } from '../components/Chip';

type WikiTab = 'legions' | 'strategies' | 'mastermind' | 'builds' | 'campaign';

export function WikiPage() {
  const { nameLang } = useApp();
  const [tab, setTab] = useState<WikiTab>('legions');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const guides = useMemo(() => {
    const kindMap: Record<WikiTab, string | string[]> = {
      legions: 'legion',
      strategies: 'strategy',
      mastermind: 'mastermindFit',
      builds: 'buildOrder',
      campaign: 'campaign',
    };
    const kind = kindMap[tab];
    return GUIDES.filter((g) => g.kind === kind).filter((g) => {
      if (!q.trim()) return true;
      const hay = `${g.titleDe} ${g.titleEn} ${g.summaryDe} ${g.summaryEn}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [tab, q]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Wiki</h1>
        <p className="muted">Lernen vor dem Queue — Guides mit Quellen & Confidence</p>
      </header>

      <input
        className="search"
        placeholder="Suche Guides…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />

      <div className="chip-row mt">
        {(
          [
            ['legions', 'Legions'],
            ['strategies', 'Strategien'],
            ['mastermind', 'Mastermind'],
            ['builds', 'Build Orders'],
            ['campaign', 'Campaign'],
          ] as const
        ).map(([id, label]) => (
          <Chip key={id} active={tab === id} onClick={() => setTab(id)}>
            {label}
          </Chip>
        ))}
      </div>

      {tab === 'legions' && (
        <section className="panel mt">
          <h2>Völker</h2>
          <div className="wiki-list">
            {LEGIONS.map((l) => (
              <article key={l.id} className="wiki-card">
                <h3>{nameLang === 'de' ? l.nameDe : l.nameEn}</h3>
                <p>{nameLang === 'de' ? l.summaryDe : l.summaryEn}</p>
                <p className="tiny muted">
                  + {l.strengths.join(', ')} · − {l.weaknesses.join(', ')} ·{' '}
                  {l.confidence}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'strategies' && (
        <section className="panel mt">
          <h2>Strategie-Archetypen</h2>
          <div className="wiki-list">
            {STRATEGIES.map((s) => (
              <article key={s.id} className="wiki-card">
                <h3>{nameLang === 'de' ? s.labelDe : s.labelEn}</h3>
                <p>{nameLang === 'de' ? s.summaryDe : s.summaryEn}</p>
                <p className="tiny muted">{s.levers.join(' · ')}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'campaign' && (
        <section className="panel mt">
          <h2>Campaign — pro Mission</h2>
          <p className="muted tiny">
            Struktur locked: eine Seite je Mission. Seed-Beispiele; unvollständige
            Inhalte markiert.
          </p>
          <div className="wiki-list">
            {CAMPAIGN_MISSIONS.filter((m) => {
              if (!q.trim()) return true;
              const hay = `${m.titleDe} ${m.titleEn} ${m.summaryDe}`.toLowerCase();
              return hay.includes(q.trim().toLowerCase());
            }).map((m) => (
              <article key={m.id} className="wiki-card">
                <div className="wiki-card__top">
                  <h3>
                    Ch.{m.chapter}.{m.order}{' '}
                    {nameLang === 'de' ? m.titleDe : m.titleEn}
                  </h3>
                  {m.incomplete && <span className="badge">incomplete</span>}
                </div>
                <p>{nameLang === 'de' ? m.summaryDe : m.summaryEn}</p>
                <p className="tiny muted">
                  Legion: {m.recommendedLegion ?? '—'} · Strategies:{' '}
                  {m.recommendedStrategies.join(', ')} · {m.gameVersion}
                </p>
                <ul className="tip-list">
                  {m.tips.map((t, i) => (
                    <li key={i}>{nameLang === 'de' ? t.de : t.en}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="panel mt">
        <h2>Guides</h2>
        <div className="wiki-list">
          {guides.map((g) => {
            const open = openId === g.id;
            return (
              <article key={g.id} className="wiki-card">
                <button
                  type="button"
                  className="wiki-card__toggle"
                  onClick={() => setOpenId(open ? null : g.id)}
                >
                  <span>
                    <strong>{nameLang === 'de' ? g.titleDe : g.titleEn}</strong>
                    {g.incomplete && <span className="badge">incomplete</span>}
                  </span>
                  <span className="tiny muted">{g.confidence}</span>
                </button>
                <p>{nameLang === 'de' ? g.summaryDe : g.summaryEn}</p>
                {open && (
                  <>
                    <ol>
                      {g.steps.map((s, i) => (
                        <li key={i}>{nameLang === 'de' ? s.de : s.en}</li>
                      ))}
                    </ol>
                    <p className="tiny muted">
                      Quellen: {g.sources.join(' · ')} · {g.gameVersion}
                    </p>
                  </>
                )}
              </article>
            );
          })}
          {!guides.length && <p className="muted">Keine Guides in diesem Filter.</p>}
        </div>
      </section>
    </div>
  );
}
