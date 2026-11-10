import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NameToggle } from './NameToggle';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__mark" aria-hidden>
            L
          </span>
          <div>
            <p className="app-header__title">Legions</p>
            <p className="app-header__sub">Begleitapp</p>
          </div>
        </div>
        <NameToggle />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
