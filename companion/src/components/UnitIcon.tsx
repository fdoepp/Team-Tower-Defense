import { useState } from 'react';
import { FIGHTER_BY_ID } from '../data/fighters';
import { MERC_BY_ID } from '../data/mercs';
import {
  accentFromKey,
  cdnIconUrl,
  placeholderLabel,
  roleToKind,
  type IconKind,
} from '../lib/icons';
import { RoleGlyph } from './RoleGlyph';

interface Props {
  /** CDN icon filename without .png (e.g. Peewee → …/icons/Peewee.png) */
  icon: string;
  name: string;
  size?: number;
  className?: string;
  unitId?: string;
  kind?: IconKind;
}

function resolveKind(unitId: string | undefined, fallbackIcon: string): IconKind {
  if (unitId) {
    const f = FIGHTER_BY_ID[unitId];
    if (f) return roleToKind(f.roles);
    const m = MERC_BY_ID[unitId];
    if (m) return 'merc';
  }
  const key = fallbackIcon.toLowerCase();
  if (key.includes('snail') || key.includes('brute') || key.includes('kingpin')) {
    return 'merc';
  }
  return 'dps';
}

export function UnitIcon({
  icon,
  name,
  size = 40,
  className = '',
  unitId,
  kind: kindProp,
}: Props) {
  const [failed, setFailed] = useState(false);
  const kind = kindProp ?? resolveKind(unitId, icon);
  const accent = accentFromKey(unitId || icon || name);
  const label = placeholderLabel(name);

  if (failed || !icon) {
    return (
      <span
        className={`unit-icon unit-icon--glyph ${className}`}
        style={{ width: size, height: size }}
        title={name}
        aria-label={name}
        role="img"
      >
        <RoleGlyph kind={kind} accent={accent} label={label} />
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
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
    />
  );
}
