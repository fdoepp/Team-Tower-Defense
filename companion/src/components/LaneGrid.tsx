import { FIGHTER_BY_ID } from '../data/fighters';
import { displayName } from '../lib/names';
import { useApp } from '../state/AppContext';
import { UnitIcon } from './UnitIcon';
import type { PlacementSuggestion } from '../data/types';

const COLS = 9;
const ROWS = 14;

interface Props {
  placements: PlacementSuggestion[];
}

export function LaneGrid({ placements }: Props) {
  const { nameLang } = useApp();
  const byCell = new Map<string, PlacementSuggestion>(
    placements.map((p) => [`${p.x},${p.y}`, p]),
  );

  return (
    <div className="lane-grid-wrap">
      <div
        className="lane-grid"
        style={{
          gridTemplateColumns: `repeat(${COLS}, 1fr)`,
          gridTemplateRows: `repeat(${ROWS}, 1fr)`,
        }}
        role="grid"
        aria-label="Lane placement 9 by 14"
      >
        {Array.from({ length: ROWS }, (_, rowIdx) => {
          const y = ROWS - rowIdx; // top = 14
          return Array.from({ length: COLS }, (_, colIdx) => {
            const x = colIdx + 1;
            const key = `${x},${y}`;
            const place = byCell.get(key);
            const fighter = place ? FIGHTER_BY_ID[place.fighterId] : undefined;
            return (
              <div
                key={key}
                className={`lane-cell ${place ? 'lane-cell--filled' : ''} ${
                  y >= 10 ? 'lane-cell--front' : ''
                }`}
                role="gridcell"
                title={
                  fighter
                    ? `${place!.order}. ${displayName(nameLang, fighter.nameDe, fighter.nameEn)} (${x},${y})`
                    : `(${x},${y})`
                }
              >
                {fighter && place && (
                  <>
                    <span className="lane-cell__order">{place.order}</span>
                    <UnitIcon
                      icon={fighter.icon}
                      name={displayName(nameLang, fighter.nameDe, fighter.nameEn)}
                      size={22}
                      unitId={fighter.id}
                    />
                  </>
                )}
              </div>
            );
          });
        })}
      </div>
      <p className="muted tiny">
        Grid 9×14 · oben = King-Seite (y=14) · Tanks vorne · Heuristik, kein Leak-Sim
      </p>
    </div>
  );
}
