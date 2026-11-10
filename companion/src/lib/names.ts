import type { NameLang } from '../data/types';

export function displayName(
  lang: NameLang,
  nameDe: string,
  nameEn: string,
): string {
  return lang === 'de' ? nameDe || nameEn : nameEn || nameDe;
}
