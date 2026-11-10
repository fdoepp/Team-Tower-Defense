import { useMemo } from 'react';
import { FIGHTERS, FIGHTER_BY_ID } from '../data/fighters';
import { LEGIONS } from '../data/legions';
import { MERCS } from '../data/mercs';
import { STRATEGIES } from '../data/strategies';
import { getWave } from '../data/waves';
import type { LegionId, StrategyId } from '../data/types';
import { buildLiveAdvice } from '../lib/advice';
import { displayName } from '../lib/names';
import { useApp } from '../state/AppContext';
import { Chip } from '../components/Chip';
import { LaneGrid } from '../components/LaneGrid';
import { UnitIcon } from '../components/UnitIcon';

const BREAK_OPTIONS = [8, 10, 13, 15];
const PLAYSTYLES = ['Lock In', 'Greed', 'Chaos', 'Fiesta', 'Other'];
const OPPONENT_PRESETS = [
  'Kingpin',
  'Fenix',
  'Four Eyes',
  'Brute',
  'Peewee',
  'Gateguard',
  'Yozora',
];

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
    setCurrentWave,
    leakPercent,
    setLeakPercent,
    receivedMythium,
    setReceivedMythium,
    opponentChips,
    toggleOpponentChip,
    sendChips,
    toggleSendChip,
    placements,
    refreshPlacements,
  } = app;

  const pool = useMemo(() => {
    let list = FIGHTERS.filter((f) => ownedIds.has(f.id));
    if (builderMode === 'legion') {
      list = list.filter((f) => f.legion === legionId);
    }
    return list;
  }, [ownedIds, builderMode, legionId]);

  const wave = getWave(currentWave);
  const advice = buildLiveAdvice({
    wave: currentWave,
    strategies,
    focusWorkersUntil,
    focusBreakWaves,
    leakPercent,
    receivedMythium,
    opponentChips: focusCounter
      ? [...opponentChips, focusCounter]
      : opponentChips,
  });

  return (
    <div className="page match-page">
      <header className="page-head">
        <h1>Match</h1>
        <p className="muted">Setup · Placement · Live Assist</p>
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
                <UnitIcon icon={f.icon} name={name} size={36} />
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

      {/* Live assist */}
      <section className="panel live-panel">
        <div className="wave-header">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCurrentWave(Math.max(1, currentWave - 1))}
          >
            −
          </button>
          <div>
            <p className="wave-num">Wave {currentWave}</p>
            <p className="tiny muted">
              {wave
                ? `${nameLang === 'de' ? wave.creatureDe : wave.creatureEn} · ${wave.attackType}/${wave.defenseType}`
                : 'Stub / partial wave table'}
            </p>
          </div>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => setCurrentWave(Math.min(21, currentWave + 1))}
          >
            +
          </button>
        </div>

        <article className="advice-card">
          <p className="advice-card__cat">{advice.category}</p>
          <h3>{nameLang === 'de' ? advice.titleDe : advice.titleEn}</h3>
          <p>{nameLang === 'de' ? advice.rationaleDe : advice.rationaleEn}</p>
          <p className="tiny muted">confidence: {advice.confidence}</p>
        </article>

        <div className="live-inputs">
          <label>
            Leak %
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={leakPercent}
              onChange={(e) => setLeakPercent(Number(e.target.value))}
            />
            <span>{leakPercent}%</span>
          </label>
          <label>
            Received Mythium
            <input
              type="number"
              min={0}
              value={receivedMythium}
              onChange={(e) => setReceivedMythium(Number(e.target.value) || 0)}
            />
          </label>
        </div>

        <h3 className="mt">Gegner / Sends</h3>
        <div className="chip-row">
          {OPPONENT_PRESETS.map((name) => (
            <Chip
              key={name}
              active={opponentChips.includes(name)}
              onClick={() => toggleOpponentChip(name)}
            >
              {name}
            </Chip>
          ))}
        </div>
        <div className="chip-row mt">
          {MERCS.map((m) => {
            const name = displayName(nameLang, m.nameDe, m.nameEn);
            return (
              <Chip
                key={m.id}
                active={sendChips.includes(m.id)}
                onClick={() => toggleSendChip(m.id)}
              >
                <UnitIcon icon={m.icon} name={name} size={20} /> {name}
              </Chip>
            );
          })}
        </div>
      </section>
    </div>
  );
}
