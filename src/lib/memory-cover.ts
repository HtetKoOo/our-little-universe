// Position zero is the memory cover across cards, albums and Home widgets.
export function setMemoryCover(ids: readonly string[], coverId: string): string[] {
  if (!ids.includes(coverId)) return [...ids];
  return [coverId, ...ids.filter(id => id !== coverId)];
}
