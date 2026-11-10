import { useMemo, useState } from 'react';
import { FIGHTERS } from '../data/fighters';
import { LEGIONS } from '../data/legions';
import type { LegionId } from '../data/types';
import { displayName } from '../lib/names';
import { useApp } from '../state/AppContext';
import { Chip } from '../components/Chip';
import { UnitIcon } from '../components/UnitIcon';

export function RosterPage() {
  const {
    nameLang,
    ownedIds,
    toggleOwned,
    selectAllOwned,
    clearOwned,
    pickIds,
    togglePick,
  } = useApp();
  const [legionFilter, setLegionFilter] = useState<LegionId | 'all'>('all');
  const [q, setQ] = useState('');

  const list = useMemo(() => {
    return FIGHTERS.filter((f) => {
      if (legionFilter !== 'all' && f.legion !== legionFilter) return false;
      if (!q.trim()) return true;
      const hay = `${f.nameEn} ${f.nameDe} ${f.roles.join(' ')}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [legionFilter, q]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Roster</h1>
        <p className="muted">Owned markieren · bis zu 6 Match-Picks</p>
      </header>

      <div className="toolbar">
        <input
          className="search"
          placeholder="Suche Fighter…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <div className="chip-row">
          <Chip active={legionFilter === 'all'} onClick={() => setLegionFilter('all')}>
            Alle
          </Chip>
          {LEGIONS.map((l) => (
            <Chip
              key={l.id}
              active={legionFilter === l.id}
              onClick={() => setLegionFilter(l.id)}
            >
              {nameLang === 'de' ? l.nameDe : l.nameEn}
            </Chip>
          ))}
        </div>
        <div className="cta-row">
          <button type="button" className="btn btn--ghost" onClick={selectAllOwned}>
            Alle owned
          </button>
          <button type="button" className="btn btn--ghost" onClick={clearOwned}>
            Clear
          </button>
        </div>
      </div>

      <p className="muted tiny">
        Picks: {pickIds.length}/6 · Owned: {ownedIds.size}/{FIGHTERS.length}
      </p>

      <div className="fighter-grid">
        {list.map((f) => {
          const name = displayName(nameLang, f.nameDe, f.nameEn);
          const owned = ownedIds.has(f.id);
          const picked = pickIds.includes(f.id);
          return (
            <article
              key={f.id}
              className={`fighter-card ${owned ? 'is-owned' : ''} ${picked ? 'is-picked' : ''}`}
            >
              <UnitIcon icon={f.icon} name={name} size={44} />
              <div className="fighter-card__body">
                <h3>{name}</h3>
                <p className="tiny muted">
                  T{f.tier} · {f.goldCost}g · {f.attackType}/{f.defenseType}
                </p>
                <p className="tiny">{f.roles.join(' · ')}</p>
              </div>
              <div className="fighter-card__actions">
                <Chip active={owned} onClick={() => toggleOwned(f.id)}>
                  Owned
                </Chip>
                <Chip active={picked} onClick={() => togglePick(f.id)}>
                  Pick
                </Chip>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
