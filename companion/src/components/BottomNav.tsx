import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/', label: 'Home', end: true },
  { to: '/match', label: 'Match' },
  { to: '/wiki', label: 'Wiki' },
  { to: '/training', label: 'Training' },
  { to: '/roster', label: 'Roster' },
] as const;

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={'end' in t ? t.end : false}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
