import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  children: ReactNode;
}

export function Chip({ active, children, className = '', ...rest }: Props) {
  return (
    <button
      type="button"
      className={`chip ${active ? 'chip--active' : ''} ${className}`}
      aria-pressed={!!active}
      {...rest}
    >
      {children}
    </button>
  );
}
