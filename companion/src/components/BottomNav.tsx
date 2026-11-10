import { NavLink } from 'react-router-dom';

const TABS = [
  {
    to: '/',
    label: 'Home',
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
    label: 'Match',
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
    to: '/wiki',
    label: 'Wiki',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M6 4h11a2 2 0 0 1 2 2v13l-3-1.5L13 19l-3-1.5L7 19V6a2 2 0 0 1-1-2Zm2 3v9.1l1.5-.8L12 16.7l2.5-1.4 1.5.8V7H8Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
  {
    to: '/training',
    label: 'Training',
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
    to: '/roster',
    label: 'Roster',
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden>
        <path
          d="M8 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6ZM4 19a4 4 0 0 1 4-4h1.2a5.2 5.2 0 0 0 5.6 0H16a4 4 0 0 1 4 4v1H4v-1Z"
          fill="currentColor"
        />
      </svg>
    ),
  },
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
          {t.icon}
          <span>{t.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
