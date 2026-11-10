import type { Fighter, PlacementSuggestion } from '../data/types';
import { FIGHTER_BY_ID } from '../data/fighters';

/**
 * Basic opener placement: tanks front (high y), DPS back (lower y),
 * optional left/right split. Heuristic only — not a leak simulator.
 */
export function suggestOpenerPlacement(fighterIds: string[]): PlacementSuggestion[] {
  const fighters = fighterIds
    .map((id) => FIGHTER_BY_ID[id])
    .filter(Boolean) as Fighter[];

  const tanks = fighters.filter((f) => f.roles.includes('Tank') || f.roles.includes('Opener'));
  const rest = fighters.filter((f) => !tanks.includes(f));
  const ordered = [...tanks, ...rest].slice(0, 6);

  return ordered.map((f, i) => {
    const isTank = f.roles.includes('Tank') || f.roles.includes('Opener');
    const col = i % 2 === 0 ? 3 : 7; // split left/right
    const row = isTank ? 11 - Math.floor(i / 2) : 6 - Math.floor(i / 2);
    return {
      fighterId: f.id,
      x: col,
      y: Math.max(2, Math.min(13, row)),
      order: i + 1,
      reasonDe: isTank
        ? 'Tank/Opener vorne, Split für Lastverteilung'
        : 'DPS/Support hinter der Front',
      reasonEn: isTank
        ? 'Tank/opener in front, split for load'
        : 'DPS/support behind the front',
    };
  });
}
