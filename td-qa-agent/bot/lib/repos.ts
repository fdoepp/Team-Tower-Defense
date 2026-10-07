/** Repos this QA agent may watch via Cursor GitHub events. */
export const REPOS = ["fdoepp/Team-Tower-Defense"] as const;

export function watches(fullName: string): boolean {
  return (REPOS as readonly string[]).includes(fullName);
}
