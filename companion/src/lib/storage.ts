const OWNED_KEY = 'ltd2-companion-owned';
const LANG_KEY = 'ltd2-companion-name-lang';

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
