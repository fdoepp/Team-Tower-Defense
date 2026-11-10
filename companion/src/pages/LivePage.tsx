import { Link } from 'react-router-dom';
import { LiveAssistPanel } from '../components/LiveAssistPanel';
import { useApp } from '../state/AppContext';

export function LivePage() {
  const { nameLang } = useApp();
  const de = nameLang === 'de';

  return (
    <div className="page live-page">
      <header className="page-head">
        <h1>Live Copilot</h1>
        <p className="muted">
          {de
            ? 'Während dem Spiel: Wave-Tipps, Sends, Workers, Gegner-Intel'
            : 'During the game: wave tips, sends, workers, opponent intel'}
        </p>
      </header>

      <p className="live-setup-link muted tiny">
        {de ? 'Vor dem Match? ' : 'Before the match? '}
        <Link to="/match">{de ? 'Setup / Strategie' : 'Setup / Strategy'}</Link>
      </p>

      <LiveAssistPanel />
    </div>
  );
}
