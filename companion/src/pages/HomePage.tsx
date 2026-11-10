import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { STRATEGIES } from '../data/strategies';
import { loadLastPlan, type LastPlanSnapshot } from '../lib/storage';
import { useApp } from '../state/AppContext';
import { UnitIcon } from '../components/UnitIcon';

type ActionCardProps = {
  to?: string;
  title: string;
  body: string;
  icon: string;
  iconName: string;
  accent?: 'primary' | 'default' | 'muted';
  cta?: string;
};

function ActionCard({
  to,
  title,
  body,
  icon,
  iconName,
  accent = 'default',
  cta,
}: ActionCardProps) {
  const className = `action-card action-card--${accent}${to ? '' : ' action-card--static'}`;
  const inner = (
    <>
      <span className="action-card__icon" aria-hidden>
        <UnitIcon icon={icon} name={iconName} size={44} />
      </span>
      <span className="action-card__body">
        <h2>{title}</h2>
        <p>{body}</p>
        {cta ? <span className="action-card__cta">{cta}</span> : null}
      </span>
      {to ? (
        <span className="chevron" aria-hidden>
          ›
        </span>
      ) : null}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {inner}
      </Link>
    );
  }

  return <div className={className}>{inner}</div>;
}

export function HomePage() {
  const { pickIds, ownedIds, nameLang } = useApp();
  const [lastPlan, setLastPlan] = useState<LastPlanSnapshot | null>(null);

  useEffect(() => {
    setLastPlan(loadLastPlan());
  }, []);

  const de = nameLang === 'de';
  const strategyLabels = (lastPlan?.strategies ?? [])
    .map((id) => {
      const s = STRATEGIES.find((x) => x.id === id);
      return s ? (de ? s.labelDe : s.labelEn) : id;
    })
    .filter(Boolean)
    .slice(0, 2);

  return (
    <div className="page home-page">
      <section
        className="action-stack"
        aria-label={de ? 'Aktionen' : 'Actions'}
      >
        <ActionCard
          to="/training"
          icon="Scorpion"
          iconName="Training"
          title="Training"
          body={
            de
              ? 'Quiz & Erklärungen zu Waves, Units, Söldnern und Typing/RPS'
              : 'Quiz & explanations for waves, units, mercs, and typing/RPS'
          }
          cta={de ? 'Drill starten' : 'Start drill'}
        />

        <ActionCard
          to="/match"
          icon="LegionLord"
          iconName="Setup"
          title={de ? 'Setup / Strategie' : 'Setup / Strategy'}
          body={
            de
              ? 'Feste Legion (z. B. Nomad) oder Setup aus Owned-Pool — dann Placement-Tipps & Build Order'
              : 'Fixed Legion (e.g. Nomad) or setup from owned pool — then placement tips & build order'
          }
          cta={de ? 'Setup öffnen' : 'Open setup'}
        />

        <ActionCard
          to="/live"
          accent="primary"
          icon="Kingpin"
          iconName="Live"
          title="Live Copilot"
          body={
            de
              ? 'Während dem Spiel: Wave-Tipps, Sends, Workers, Gegner-Intel'
              : 'During the game: wave tips, sends, workers, opponent intel'
          }
          cta={de ? 'Live öffnen' : 'Open live'}
        />

        <ActionCard
          to="/wiki"
          icon="Yozora"
          iconName="Wiki"
          title="Wiki"
          body={
            de
              ? 'Suche & Infos zu Masterminds, Waves, Strategien, Units, Söldnern'
              : 'Search & info on Masterminds, waves, strategies, units, mercs'
          }
          cta={de ? 'Wiki öffnen' : 'Open wiki'}
        />

        <ActionCard
          to="/roster"
          icon="Gateguard"
          iconName="Roster"
          title="Roster"
          body={
            de
              ? `Owned pflegen · ${ownedIds.size} owned · ${pickIds.length}/6 Picks`
              : `Manage owned · ${ownedIds.size} owned · ${pickIds.length}/6 picks`
          }
        />

        {lastPlan ? (
          <ActionCard
            to="/match"
            icon="Peewee"
            iconName="Plan"
            title={de ? 'Letzter Plan' : 'Last plan'}
            body={
              de
                ? `${lastPlan.builderMode === 'mastermind' ? 'Mastermind' : 'Legion'} · W${lastPlan.wave} · ${strategyLabels.join(', ') || '—'} · ${lastPlan.pickCount}/6 Picks`
                : `${lastPlan.builderMode === 'mastermind' ? 'Mastermind' : 'Legion'} · W${lastPlan.wave} · ${strategyLabels.join(', ') || '—'} · ${lastPlan.pickCount}/6 picks`
            }
            cta={de ? 'Plan fortsetzen' : 'Resume plan'}
          />
        ) : (
          <ActionCard
            accent="muted"
            icon="Snail"
            iconName="Plan"
            title={de ? 'Letzter Plan' : 'Last plan'}
            body={
              de
                ? 'Noch kein Plan — starte ein Setup, um später fortzusetzen.'
                : 'No plan yet — start a setup to resume later.'
            }
          />
        )}

        <ActionCard
          accent="muted"
          icon="Hopper"
          iconName="Info"
          title={de ? 'Hinweise' : 'Notes'}
          body={
            de
              ? 'Private Begleitapp · DE↔EN Namen · Icons via CDN (kein öffentlicher Redistribute)'
              : 'Private companion · DE↔EN names · CDN icons (no public redistribute)'
          }
        />
      </section>
    </div>
  );
}
