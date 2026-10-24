import test from "node:test";
import assert from "node:assert/strict";
import { rememberGalleryEntry, restoreGalleryPage } from "../src/lib/gallery-history";

const first = Array.from({ length: 60 }, (_, i) => ({ id: `photo-${i}`, isFavorite: false }));
const older = Array.from({ length: 25 }, (_, i) => ({ id: `photo-${i + 60}`, isFavorite: false }));
const cached = { headIds: first.map(p => p.id), assets: [...first, ...older], nextCursor: "older-cursor" };

test("returning to an unchanged gallery retains all loaded pages and the matching cursor", () => {
  const restored = restoreGalleryPage(first, "first-cursor", cached);
  assert.equal(restored.assets.length, 85);
  assert.equal(restored.nextCursor, "older-cursor");
  assert.equal(restored.restored, true);
});
test("fresh first-page metadata overrides cached Favorite values without duplicating photos", () => {
  const fresh = first.map((p, i) => ({ ...p, isFavorite: i === 0 }));
  const restored = restoreGalleryPage(fresh, "first-cursor", cached);
  assert.equal(restored.assets[0].isFavorite, true);
  assert.equal(new Set(restored.assets.map(p => p.id)).size, restored.assets.length);
});
test("a changed, reordered or shortened first page resets old pages and their cursor", () => {
  for (const fresh of [[{ id: "new-photo", isFavorite: false }, ...first.slice(0, 59)], first.toReversed(), first.slice(0, 59), []]) {
    const restored = restoreGalleryPage(fresh, "fresh-cursor", cached);
    assert.deepEqual(restored.assets, fresh);
    assert.equal(restored.nextCursor, "fresh-cursor");
    assert.equal(restored.restored, false);
  }
});
test("gallery views have independent bounded entries, with the least recent entry evicted", () => {
  const store = new Map<string, number>();
  for (let i = 0; i < 12; i++) rememberGalleryEntry(store, `scope:view-${i}`, i);
  rememberGalleryEntry(store, "scope:view-0", 1234);
  rememberGalleryEntry(store, "scope:new-album", 55);
  assert.equal(store.size, 12);
  assert.equal(store.get("scope:view-0"), 1234);
  assert.equal(store.has("scope:view-1"), false);
  assert.equal(store.get("scope:new-album"), 55);
});
