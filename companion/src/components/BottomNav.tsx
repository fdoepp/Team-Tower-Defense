import { NavLink } from 'react-router-dom';
import { useApp } from '../state/AppContext';

const TABS = [
  {
    to: '/',
    labelDe: 'Home',
    labelEn: 'Home',
    end: true,
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    to: '/match',
    labelDe: 'Setup',
    labelEn: 'Setup',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M12 3 4 7v5c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V7l-8-4Zm0 2.2 6 3v4.5c0 3.6-2.3 6.1-6 6.7-3.7-.6-6-3.1-6-6.7V8.2l6-3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    to: '/live',
    labelDe: 'Live',
    labelEn: 'Live',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14Zm0 2.2a4.8 4.8 0 1 0 0 9.6 4.8 4.8 0 0 0 0-9.6Zm-.9 2.1h1.8v3.2l2.2 1.3-.9 1.5-2.9-1.7V9.3Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    to: '/training',
    labelDe: 'Training',
    labelEn: 'Training',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3Zm1 4v5.2l3.4 2-1 1.7L11 13V7h2Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    to: '/wiki',
    labelDe: 'Wiki',
    labelEn: 'Wiki',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M6 4h11a2 2 0 0 1 2 2v13l-3-1.5L13 19l-3-1.5L7 19V6a2 2 0 0 1-1-2Zm2 3v9.1l1.5-.8L12 16.7l2.5-1.4 1.5.8V7H8Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
] as const;

export function BottomNav() {
  const { nameLang } = useApp();
  return (
    <nav className="bottom-nav" aria-label={nameLang === 'de' ? 'Hauptmenü' : 'Main'}>
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={'end' in t ? t.end : false}
          className={({ isActive }) =>
            `bottom-nav__item ${isActive ? 'bottom-nav__item--active' : ''}`
          }
        >
          {t.icon}
          <span>{nameLang === 'de' ? t.labelDe : t.labelEn}</span>
        </NavLink>
      ))}
    </nav>
  );
}
