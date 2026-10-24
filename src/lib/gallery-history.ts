export type GalleryHistoryPage<T extends { id: string }> = {
  headIds: string[];
  assets: T[];
  nextCursor: string | null;
};

/** Reuse extra pages only while the server's first page still describes this list. */
export function restoreGalleryPage<T extends { id: string }>(
  assets: T[], nextCursor: string | null, cached?: GalleryHistoryPage<T>,
) {
  const sameHead = cached && cached.headIds.length === assets.length && cached.headIds.every((id, i) => id === assets[i].id);
  if (!sameHead) return { assets, nextCursor, restored: false };
  const freshIds = new Set(assets.map(asset => asset.id));
  // Fresh server metadata wins, including Favorite changes made by the partner.
  return { assets: [...assets, ...cached.assets.filter(asset => !freshIds.has(asset.id))], nextCursor: cached.nextCursor, restored: true };
}

export function rememberGalleryEntry<T>(store: Map<string, T>, key: string, entry: T) {
  store.delete(key);
  store.set(key, entry);
  if (store.size > 12) store.delete(store.keys().next().value!);
}
