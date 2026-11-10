import { useState } from 'react';
import { cdnIconUrl } from '../lib/icons';

/**
 * Wave subject visual: large wave number + optional official creature icon.
 * Never presents as a mercenary pick token.
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
      title={`Wave ${waveNumber}`}
    >
      {showCreature ? (
        <img
          className="wave-badge__creature"
          src={cdnIconUrl(creatureIcon!)}
          alt=""
          onError={() => setFailed(true)}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className="wave-badge__fallback" aria-hidden />
      )}
      <span className="wave-badge__num">W{waveNumber}</span>
    </span>
  );
}
