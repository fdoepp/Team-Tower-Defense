/** Official LTD2 CDN icon helper with placeholder fallback. */
export const CDN_ICON_BASE = 'https://cdn.legiontd2.com/icons';

export function cdnIconUrl(iconName: string): string {
  return `${CDN_ICON_BASE}/${iconName}.png`;
}

/** Initials placeholder when CDN fails / offline */
export function placeholderLabel(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
