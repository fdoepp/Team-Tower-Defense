import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { NameToggle } from './NameToggle';

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__mark" aria-hidden />
          <div>
            <p className="app-header__title">Legions Begleitapp</p>
            <p className="app-header__sub">LTD2 Live + Wiki</p>
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
