/** Shared LTD2 companion types. Stats are curated seed approximations — mark stubs. */

export type AttackType =
  | 'Impact'
  | 'Pierce'
  | 'Magic'
  | 'Pure'
  | 'Arcane';

export type DefenseType =
  | 'Swift'
  | 'Natural'
  | 'Magic'
  | 'Fortified'
  | 'Immaterial';

export type Role =
  | 'Tank'
  | 'DPS'
  | 'Aura'
  | 'AOE'
  | 'Heal'
  | 'Range'
  | 'Mana'
  | 'Carry'
  | 'Opener';

export type LegionId =
  | 'element'
  | 'atlantean'
  | 'beast'
  | 'forsaken'
  | 'grove'
  | 'mech'
  | 'shadow'
  | 'divine';

export interface Fighter {
  id: string;
  nameEn: string;
  nameDe: string;
  /** CDN icon filename without .png — drop-in for official icons */
  icon: string;
  legion: LegionId;
  tier: 1 | 2 | 3 | 4 | 5 | 6;
  goldCost: number;
  attackType: AttackType;
  defenseType: DefenseType;
  roles: Role[];
  strongVs: string[];
  weakVs: string[];
  /** Approx; patch-dependent — treated as medium confidence seed */
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  notes?: string;
}

export interface Mercenary {
  id: string;
  nameEn: string;
  nameDe: string;
  icon: string;
  mythiumCost: number;
  attackType: AttackType;
  defenseType: DefenseType;
  spawnClass: 'tank' | 'melee' | 'ranged';
  incomeProfile: 'income' | 'power' | 'mixed';
  roles: Role[];
  strongVs: string[];
  weakVs: string[];
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
}

export interface Wave {
  number: number;
  creatureEn: string;
  creatureDe: string;
  icon: string;
  attackType: AttackType;
  defenseType: DefenseType;
  tags: string[];
  tipDe: string;
  tipEn: string;
}

export interface LegionInfo {
  id: LegionId;
  nameEn: string;
  nameDe: string;
  summaryDe: string;
  summaryEn: string;
  strengths: string[];
  weaknesses: string[];
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
}

export type StrategyId =
  | 'hold'
  | 'worker'
  | 'aggressive'
  | 'income'
  | 'king'
  | 'save'
  | 'holdFirst';

export interface Strategy {
  id: StrategyId;
  labelDe: string;
  labelEn: string;
  summaryDe: string;
  summaryEn: string;
  levers: string[];
}

export interface Guide {
  id: string;
  titleDe: string;
  titleEn: string;
  kind: 'legion' | 'strategy' | 'mastermindFit' | 'buildOrder' | 'campaign';
  legionId?: LegionId;
  strategyIds?: StrategyId[];
  campaignMissionId?: string;
  summaryDe: string;
  summaryEn: string;
  steps: { de: string; en: string }[];
  sources: string[];
  confidence: 'high' | 'medium' | 'low' | 'uncertain';
  incomplete?: boolean;
  gameVersion: string;
}

export interface CampaignMission {
  id: string;
  chapter: number;
  order: number;
  titleDe: string;
  titleEn: string;
  recommendedLegion?: LegionId;
  recommendedStrategies: StrategyId[];
  summaryDe: string;
  summaryEn: string;
  tips: { de: string; en: string }[];
  incomplete: boolean;
  gameVersion: string;
}

export interface PlacementSuggestion {
  fighterId: string;
  x: number; // 1–9
  y: number; // 1–14
  order: number;
  reasonDe: string;
  reasonEn: string;
}

export type BuilderMode = 'mastermind' | 'legion';
export type NameLang = 'de' | 'en';
export type TabId = 'home' | 'match' | 'wiki' | 'training' | 'roster';
