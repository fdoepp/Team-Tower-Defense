import { Link } from 'react-router-dom';
import { useApp } from '../state/AppContext';

export function HomePage() {
  const { pickIds, builderMode, currentWave, strategies, nameLang } = useApp();

  return (
    <div className="page home-page">
      <section className="hero-panel">
        <p className="eyebrow">Legions</p>
        <h1>Begleitapp</h1>
        <p>
          {nameLang === 'de'
            ? 'Vor dem Match lernen. In der Build-Phase entscheiden.'
            : 'Learn before queue. Decide in the build phase.'}
        </p>
        <div className="cta-row">
          <Link className="btn btn--primary" to="/match">
            {nameLang === 'de' ? 'Neues Match' : 'New match'}
          </Link>
          <Link className="btn btn--ghost" to="/wiki">
            Wiki
          </Link>
        </div>
      </section>

      <section className="list-group">
        <Link to="/training" className="list-row">
          <div>
            <h2>Training</h2>
            <p>
              {nameLang === 'de'
                ? 'Klare Einzelfragen · Units & Waves · Types mit Icons'
                : 'Clear single questions · units & waves · typed icons'}
            </p>
          </div>
          <span className="chevron" aria-hidden>
            ›
          </span>
        </Link>
        <Link to="/roster" className="list-row">
          <div>
            <h2>Roster</h2>
            <p>
              {pickIds.length}/6 Picks · Owned
            </p>
          </div>
          <span className="chevron" aria-hidden>
            ›
          </span>
        </Link>
        <div className="list-row list-row--static">
          <div>
            <h2>{nameLang === 'de' ? 'Letzter Plan' : 'Last plan'}</h2>
            <p>
              {builderMode === 'mastermind' ? 'Mastermind' : 'Legion'} · W
              {currentWave} · {strategies.slice(0, 2).join(', ') || '—'}
            </p>
          </div>
        </div>
      </section>

      <p className="attribution muted tiny">
        Private companion. Icons © AutoAttack Games via CDN — not for public
        redistribution.
      </p>
    </div>
  );
}
