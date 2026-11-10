import { useState } from 'react';
import { cdnIconUrl } from '../lib/icons';

/** Attack / defense type icon from CDN with letter fallback. */
export function TypeIcon({
  type,
  size = 22,
  className = '',
}: {
  type: string;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span
        className={`type-icon type-icon--fallback ${className}`}
        style={{ width: size, height: size }}
        title={type}
        aria-label={type}
      >
        {type.slice(0, 1)}
      </span>
    );
  }
  return (
    <img
      className={`type-icon ${className}`}
      src={cdnIconUrl(type)}
      alt={type}
      width={size}
      height={size}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}

export function TypeChipLabel({ type }: { type: string }) {
  return (
    <span className="type-chip-label">
      <TypeIcon type={type} size={18} />
      <span>{type}</span>
    </span>
  );
}
