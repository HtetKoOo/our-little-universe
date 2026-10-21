import assert from "node:assert/strict";
import test from "node:test";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "../src/lib/db/schema";
import { galleryPhotosQuery } from "../src/lib/db/gallery-photos-query";
import { galleryPage, parseGalleryCursor, mergeGalleryPhotos } from "../src/lib/gallery-pagination";
const id = "11111111-1111-4111-8111-111111111111";
const time = "2026-10-21T03:00:00.123456Z";
const db = drizzle(neon("postgresql://test:test@localhost/test"), { schema });
const actor = { coupleId: id, userId: "member" };

test("gallery cursor retains database microseconds and rejects invalid or excessive input", () => {
  assert.deepEqual(parseGalleryCursor(JSON.stringify({ time, id })), { time, id });
  for (const value of ["", "not-json", "x".repeat(201), JSON.stringify({ time: "yesterday", id }), JSON.stringify({ time, id: "bad" })])
    assert.equal(parseGalleryCursor(value), null);
});
test("pages return sixty photos with a cursor only if older photos remain", () => {
  const rows = Array.from({ length: 61 }, (_, index) => ({ id: index === 59 ? id : String(index), cursorTime: time, width: 500 }));
  const page = galleryPage(rows);
  assert.equal(page.assets.length, 60);
  assert.deepEqual(parseGalleryCursor(page.nextCursor!), { time, id });
  assert.equal("cursorTime" in page.assets[0], false);
  assert.equal(galleryPage(rows.slice(0, 60)).nextCursor, null);
  assert.equal(galleryPage([]).nextCursor, null);
});
test("gallery query scopes every page to a current couple member and orders ties by ID", () => {
  const query = galleryPhotosQuery(db, actor, true, { time, id }).toSQL();
  assert.match(query.sql, /"media_assets"\."couple_id" =/);
  assert.match(query.sql, /exists\(select 1 from "couple_members"/);
  assert.match(query.sql, /"media_assets"\."is_favorite" =/);
  assert.match(query.sql, /\("media_assets"\."created_at", "media_assets"\."id"\) </);
  assert.match(query.sql, /order by "media_assets"\."created_at" desc, "media_assets"\."id" desc/);
  assert.ok(query.params.includes(actor.userId));
  assert.ok(query.params.includes(actor.coupleId));
  assert.ok(query.params.includes(time));
  assert.ok(query.params.includes("image"));
  assert.equal(query.params.at(-1), 61);
  assert.doesNotMatch(query.sql, /offset/);
  assert.doesNotMatch(galleryPhotosQuery(db, actor, false, null).toSQL().sql, /"is_favorite" =/);
});
test("upload and next-page overlap cannot duplicate or overwrite existing photos", () => {
  const current = [{ id: "new", favorite: true }, { id: "a", favorite: true }];
  const incoming = [{ id: "a", favorite: false }, { id: "b", favorite: false }, { id: "b", favorite: false }];
  assert.deepEqual(mergeGalleryPhotos(current, incoming), [...current, { id: "b", favorite: false }]);
  assert.equal(current.length, 2);
});
