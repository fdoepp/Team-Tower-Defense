import { useState } from 'react';
import { cdnIconUrl } from '../lib/icons';

/**
 * Official wave-creature art from CDN (Crab, Kobra, …).
 * Path: https://cdn.legiontd2.com/icons/{creatureIcon}.png
 * Small W# chip only as label — never a fighter/merc roster token.
 */
export function WaveBadge({
  waveNumber,
  creatureIcon,
  creatureName,
  size = 64,
}: {
  waveNumber: number;
  creatureIcon?: string;
  creatureName: string;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const showCreature = Boolean(creatureIcon) && !failed;

  return (
    <span
      className="wave-badge"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Wave ${waveNumber} · ${creatureName}`}
      title={`Wave ${waveNumber} · ${creatureName}`}
    >
      {showCreature ? (
        <img
          className="wave-badge__creature"
          src={cdnIconUrl(creatureIcon!)}
          alt={creatureName}
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="wave-badge__fallback" aria-hidden>
          W{waveNumber}
        </span>
      )}
      <span className="wave-badge__chip">W{waveNumber}</span>
    </span>
  );
}
