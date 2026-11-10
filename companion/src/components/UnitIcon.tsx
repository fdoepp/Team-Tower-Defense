import { useState } from 'react';
import { cdnIconUrl, placeholderLabel } from '../lib/icons';

interface Props {
  icon: string;
  name: string;
  size?: number;
  className?: string;
}

export function UnitIcon({ icon, name, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`unit-icon unit-icon--fallback ${className}`}
        style={{ width: size, height: size }}
        title={name}
        aria-label={name}
      >
        {placeholderLabel(name)}
      </span>
    );
  }

  return (
    <img
      className={`unit-icon ${className}`}
      src={cdnIconUrl(icon)}
      alt={name}
      width={size}
      height={size}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
