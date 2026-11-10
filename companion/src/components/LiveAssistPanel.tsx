import { MERCS } from '../data/mercs';
import { getWave } from '../data/waves';
import { buildLiveAdvice } from '../lib/advice';
import { displayName } from '../lib/names';
import { useApp } from '../state/AppContext';
import { Chip } from './Chip';
import { TypeIcon } from './TypeIcon';
import { UnitIcon } from './UnitIcon';
import { WaveBadge } from './WaveBadge';
import { typeLabel } from '../lib/typing';

const OPPONENT_PRESETS = [
  { id: 'Kingpin', de: 'Kingpin', en: 'Kingpin' },
  { id: 'Fenix', de: 'Fenix', en: 'Fenix' },
  { id: 'Four Eyes', de: 'Vier Augen', en: 'Four Eyes' },
  { id: 'Brute', de: 'Schläger', en: 'Brute' },
  { id: 'Peewee', de: 'Peewee', en: 'Peewee' },
  { id: 'Gateguard', de: 'Torwächter', en: 'Gateguard' },
  { id: 'Yozora', de: 'Yozora', en: 'Yozora' },
];

/** In-match advice: wave tips, sends, workers, opponent intel. */
export function LiveAssistPanel() {
  const {
    nameLang,
    strategies,
    focusWorkersUntil,
    focusBreakWaves,
    focusCounter,
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
  } = useApp();

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
    <section className="panel live-panel" id="live">
      <div className="wave-header">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => setCurrentWave(Math.max(1, currentWave - 1))}
        >
          −
        </button>
        <div className="wave-meta">
          {wave ? (
            <>
              <WaveBadge
                waveNumber={wave.number}
                creatureIcon={wave.icon}
                creatureName={
                  nameLang === 'de' ? wave.creatureDe : wave.creatureEn
                }
                size={56}
              />
              <p className="wave-num">
                {nameLang === 'de' ? 'Welle' : 'Wave'} {wave.number} ·{' '}
                {nameLang === 'de' ? wave.creatureDe : wave.creatureEn}
              </p>
              <div className="type-row">
                <span className="type-chip-label" title="Attack">
                  <TypeIcon type={wave.attackType} size={18} />
                  <span>{typeLabel(wave.attackType, nameLang)}</span>
                </span>
                <span className="type-chip-label" title="Defense">
                  <TypeIcon type={wave.defenseType} size={18} />
                  <span>{typeLabel(wave.defenseType, nameLang)}</span>
                </span>
              </div>
            </>
          ) : (
            <>
              <p className="wave-num">
                {nameLang === 'de' ? 'Welle' : 'Wave'} {currentWave}
              </p>
              <p className="tiny muted">Stub / partial wave table</p>
            </>
          )}
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

      <h3 className="mt">
        {nameLang === 'de' ? 'Gegner / Sends' : 'Opponents / Sends'}
      </h3>
      <div className="chip-row">
        {OPPONENT_PRESETS.map((p) => (
          <Chip
            key={p.id}
            active={opponentChips.includes(p.id)}
            onClick={() => toggleOpponentChip(p.id)}
          >
            {nameLang === 'de' ? p.de : p.en}
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
              <UnitIcon
                icon={m.icon}
                name={name}
                size={20}
                unitId={m.id}
                kind="merc"
              />{' '}
              {name}
            </Chip>
          );
        })}
      </div>
    </section>
  );
}
