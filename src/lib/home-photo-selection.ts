// Keep the chosen order, discard removed choices, and use newest photos only
// when none of the chosen IDs still belongs to this couple.
export function selectHomePhotoIds(chosenIds: string[], rows: { id: string }[]) {
  const available = new Set(rows.map(row => row.id));
  const chosen = chosenIds.filter(id => available.has(id));
  return chosen.length ? chosen : rows.map(row => row.id);
}
