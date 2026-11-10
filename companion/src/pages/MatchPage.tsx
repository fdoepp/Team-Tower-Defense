import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FIGHTERS, FIGHTER_BY_ID } from '../data/fighters';
import { LEGIONS } from '../data/legions';
import { STRATEGIES } from '../data/strategies';
import type { LegionId, StrategyId } from '../data/types';
import { displayName } from '../lib/names';
import { saveLastPlan } from '../lib/storage';
import { useApp } from '../state/AppContext';
import { Chip } from '../components/Chip';
import { LaneGrid } from '../components/LaneGrid';
import { UnitIcon } from '../components/UnitIcon';

const BREAK_OPTIONS = [8, 10, 13, 15];
const PLAYSTYLES = ['Lock In', 'Greed', 'Chaos', 'Fiesta', 'Other'];

export function MatchPage() {
  const app = useApp();
  const {
    nameLang,
    builderMode,
    setBuilderMode,
    legionId,
    setLegionId,
    mastermindPlaystyle,
    setMastermindPlaystyle,
    pickIds,
    togglePick,
    ownedIds,
    strategies,
    toggleStrategy,
    focusWorkersUntil,
    setFocusWorkersUntil,
    focusBreakWaves,
    toggleBreakWave,
    focusCounter,
    setFocusCounter,
    currentWave,
    placements,
    refreshPlacements,
  } = app;

  useEffect(() => {
    saveLastPlan({
      builderMode,
      legionId,
      wave: currentWave,
      strategies,
      pickCount: pickIds.length,
      updatedAt: Date.now(),
    });
  }, [builderMode, legionId, currentWave, strategies, pickIds.length]);

  const pool = useMemo(() => {
    let list = FIGHTERS.filter((f) => ownedIds.has(f.id));
    if (builderMode === 'legion') {
      list = list.filter((f) => f.legion === legionId);
    }
    return list;
  }, [ownedIds, builderMode, legionId]);

  return (
    <div className="page match-page">
      <header className="page-head">
        <h1>{nameLang === 'de' ? 'Setup / Strategie' : 'Setup / Strategy'}</h1>
        <p className="muted">
          {nameLang === 'de'
            ? 'Legion oder Owned-Pool · Placement · Build Order'
            : 'Legion or owned pool · Placement · Build order'}
        </p>
      </header>

      {/* Mode */}
      <section className="panel">
        <h2>Modus</h2>
        <div className="chip-row">
          <Chip
            active={builderMode === 'mastermind'}
            onClick={() => setBuilderMode('mastermind')}
          >
            Mastermind
          </Chip>
          <Chip
            active={builderMode === 'legion'}
            onClick={() => setBuilderMode('legion')}
          >
            Legion
          </Chip>
        </div>
        {builderMode === 'mastermind' ? (
          <div className="chip-row mt">
            {PLAYSTYLES.map((p) => (
              <Chip
                key={p}
                active={mastermindPlaystyle === p}
                onClick={() => setMastermindPlaystyle(p)}
              >
                {p}
              </Chip>
            ))}
          </div>
        ) : (
          <div className="chip-row mt">
            {LEGIONS.map((l) => (
              <Chip
                key={l.id}
                active={legionId === l.id}
                onClick={() => setLegionId(l.id as LegionId)}
              >
                {nameLang === 'de' ? l.nameDe : l.nameEn}
              </Chip>
            ))}
          </div>
        )}
      </section>

      {/* Picks */}
      <section className="panel">
        <h2>Picks ({pickIds.length}/6)</h2>
        <div className="pick-tray">
          {pool.map((f) => {
            const name = displayName(nameLang, f.nameDe, f.nameEn);
            return (
              <button
                key={f.id}
                type="button"
                className={`pick-token ${pickIds.includes(f.id) ? 'is-on' : ''}`}
                onClick={() => togglePick(f.id)}
              >
                <UnitIcon icon={f.icon} name={name} size={36} unitId={f.id} />
                <span>{name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Strategies + focus */}
      <section className="panel">
        <h2>Strategie & Fokus</h2>
        <div className="chip-row">
          {STRATEGIES.map((s) => (
            <Chip
              key={s.id}
              active={strategies.includes(s.id as StrategyId)}
              onClick={() => toggleStrategy(s.id as StrategyId)}
            >
              {nameLang === 'de' ? s.labelDe : s.labelEn}
            </Chip>
          ))}
        </div>
        <div className="focus-row mt">
          <label>
            Workers bis W
            <input
              type="number"
              min={1}
              max={21}
              value={focusWorkersUntil}
              onChange={(e) => setFocusWorkersUntil(Number(e.target.value) || 1)}
            />
          </label>
          <div className="chip-row">
            <span className="tiny muted">Break</span>
            {BREAK_OPTIONS.map((n) => (
              <Chip
                key={n}
                active={focusBreakWaves.includes(n)}
                onClick={() => toggleBreakWave(n)}
              >
                W{n}
              </Chip>
            ))}
          </div>
          <label className="grow">
            Counter-Unit
            <input
              value={focusCounter}
              onChange={(e) => setFocusCounter(e.target.value)}
              placeholder="z.B. gegen Kingpin W10"
            />
          </label>
        </div>
      </section>

      {/* Lane grid */}
      <section className="panel">
        <div className="panel-head">
          <h2>Lane Placement (Opener)</h2>
          <button type="button" className="btn btn--primary" onClick={refreshPlacements}>
            Vorschlag
          </button>
        </div>
        <LaneGrid placements={placements} />
        <ul className="place-list">
          {placements.map((p) => {
            const f = FIGHTER_BY_ID[p.fighterId];
            if (!f) return null;
            return (
              <li key={`${p.fighterId}-${p.order}`}>
                <strong>{p.order}.</strong>{' '}
                {displayName(nameLang, f.nameDe, f.nameEn)} @ ({p.x},{p.y}) —{' '}
                {nameLang === 'de' ? p.reasonDe : p.reasonEn}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="panel">
        <h2>Live Copilot</h2>
        <p className="muted" style={{ marginTop: 0 }}>
          {nameLang === 'de'
            ? 'Während dem Spiel: Wave-Tipps, Sends, Workers, Gegner-Intel.'
            : 'During the game: wave tips, sends, workers, opponent intel.'}
        </p>
        <Link className="btn btn--primary" to="/live">
          {nameLang === 'de' ? 'Live Copilot öffnen' : 'Open Live Copilot'}
        </Link>
      </section>
    </div>
  );
}
