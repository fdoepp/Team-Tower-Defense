const OWNED_KEY = 'ltd2-companion-owned';
const LANG_KEY = 'ltd2-companion-name-lang';
const PLAN_KEY = 'ltd2-companion-last-plan';

export type LastPlanSnapshot = {
  builderMode: 'mastermind' | 'legion';
  legionId: string;
  wave: number;
  strategies: string[];
  pickCount: number;
  updatedAt: number;
};

export function loadOwned(): string[] {
  try {
    const raw = localStorage.getItem(OWNED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function saveOwned(ids: string[]) {
  localStorage.setItem(OWNED_KEY, JSON.stringify(ids));
}

export function loadNameLang(): 'de' | 'en' {
  const v = localStorage.getItem(LANG_KEY);
  return v === 'en' ? 'en' : 'de';
}

export function saveNameLang(lang: 'de' | 'en') {
  localStorage.setItem(LANG_KEY, lang);
}

export function loadLastPlan(): LastPlanSnapshot | null {
  try {
    const raw = localStorage.getItem(PLAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LastPlanSnapshot;
    if (!parsed || typeof parsed.updatedAt !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLastPlan(plan: LastPlanSnapshot) {
  localStorage.setItem(PLAN_KEY, JSON.stringify(plan));
}

export function clearLastPlan() {
  localStorage.removeItem(PLAN_KEY);
}
