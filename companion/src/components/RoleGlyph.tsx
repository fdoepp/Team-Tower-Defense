import type { IconKind } from '../lib/icons';

/** Original SVG glyphs — geometric role cues, not game art. */
export function RoleGlyph({
  kind,
  accent,
  label,
}: {
  kind: IconKind;
  accent: string;
  label: string;
}) {
  const common = {
    fill: 'none',
    stroke: accent,
    strokeWidth: 2.2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  return (
    <svg viewBox="0 0 40 40" width="100%" height="100%" aria-hidden>
      <rect x="2" y="2" width="36" height="36" rx="8" fill="#0a100e" stroke="#2f463b" strokeWidth="1.5" />
      <circle cx="20" cy="20" r="13" fill={`${accent}22`} />
      {kind === 'tank' && (
        <>
          <path d="M12 14 L20 10 L28 14 V24 C28 28 24 31 20 32 C16 31 12 28 12 24 Z" {...common} fill={`${accent}33`} />
        </>
      )}
      {kind === 'dps' && (
        <path d="M14 26 L20 10 L26 26 M16.5 21 H23.5" {...common} />
      )}
      {kind === 'range' && (
        <>
          <path d="M10 20 H28" {...common} />
          <path d="M22 14 L28 20 L22 26" {...common} />
          <circle cx="12" cy="20" r="2.2" fill={accent} stroke="none" />
        </>
      )}
      {kind === 'heal' && (
        <path d="M20 12 V28 M12 20 H28" {...common} strokeWidth={3} />
      )}
      {kind === 'aura' && (
        <>
          <circle cx="20" cy="20" r="5" {...common} />
          <circle cx="20" cy="20" r="10" {...common} strokeOpacity={0.7} />
        </>
      )}
      {kind === 'aoe' && (
        <>
          <circle cx="20" cy="20" r="3" fill={accent} stroke="none" />
          <path d="M20 10 V14 M20 26 V30 M10 20 H14 M26 20 H30 M13 13 L16 16 M24 24 L27 27 M27 13 L24 16 M16 24 L13 27" {...common} />
        </>
      )}
      {kind === 'mana' && (
        <path d="M20 10 C26 16 26 22 20 30 C14 22 14 16 20 10 Z" {...common} fill={`${accent}44`} />
      )}
      {kind === 'carry' && (
        <path d="M20 9 L24 17 H32 L26 22 L28 30 L20 25 L12 30 L14 22 L8 17 H16 Z" {...common} fill={`${accent}33`} />
      )}
      {kind === 'opener' && (
        <path d="M12 26 L20 12 L28 26 Z" {...common} fill={`${accent}33`} />
      )}
      {kind === 'merc' && (
        <>
          <rect x="13" y="13" width="14" height="14" rx="3" {...common} fill={`${accent}22`} />
          <path d="M20 16 V24 M16 20 H24" {...common} />
        </>
      )}
      <text
        x="20"
        y="37"
        textAnchor="middle"
        fontSize="5.5"
        fill="#9bb0a4"
        fontFamily="Exo 2, sans-serif"
        fontWeight="700"
      >
        {label}
      </text>
    </svg>
  );
}
