import { Link } from 'react-router-dom';
import { useApp } from '../state/AppContext';

export function HomePage() {
  const { pickIds, builderMode, currentWave, strategies } = useApp();

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <h1>Legions Begleitapp</h1>
        <p>
          Mobile Companion für Legion TD 2 — vor dem Match lernen, in der Build-Phase
          entscheiden.
        </p>
        <div className="cta-row">
          <Link className="btn btn--primary" to="/match">
            Neues Match
          </Link>
          <Link className="btn btn--ghost" to="/wiki">
            Wiki öffnen
          </Link>
        </div>
      </section>

      <section className="quick-grid">
        <Link to="/training" className="quick-card">
          <h2>Training</h2>
          <p>Types, Rollen, Stark/Schwach — kurze Sessions.</p>
        </Link>
        <Link to="/roster" className="quick-card">
          <h2>Roster</h2>
          <p>{pickIds.length}/6 Picks · Owned pflegen.</p>
        </Link>
        <div className="quick-card quick-card--static">
          <h2>Letzter Plan</h2>
          <p>
            {builderMode === 'mastermind' ? 'Mastermind' : 'Legion'} · W{currentWave} ·{' '}
            {strategies.slice(0, 2).join(', ') || '—'}
          </p>
        </div>
      </section>

      <p className="attribution muted tiny">
        Private companion only. Fighter/Merc icons via cdn.legiontd2.com © AutoAttack
        Games — not for public redistribution. Glyph fallback if an icon 404s.
      </p>
    </div>
  );
}
