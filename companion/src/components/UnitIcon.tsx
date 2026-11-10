import { FIGHTER_BY_ID } from '../data/fighters';
import { MERC_BY_ID } from '../data/mercs';
import {
  accentFromKey,
  placeholderLabel,
  roleToKind,
  type IconKind,
} from '../lib/icons';
import { RoleGlyph } from './RoleGlyph';

interface Props {
  /** Legacy CDN filename field — kept for data shape; unused for art. */
  icon: string;
  name: string;
  size?: number;
  className?: string;
  /** Optional fighter/merc id for role lookup */
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
  // Heuristic from legacy icon string (still no network)
  const key = fallbackIcon.toLowerCase();
  if (key.includes('snail') || key.includes('brute') || key.includes('kingpin')) return 'merc';
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
  const kind = kindProp ?? resolveKind(unitId, icon);
  const accent = accentFromKey(unitId || icon || name);
  const label = placeholderLabel(name);

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
