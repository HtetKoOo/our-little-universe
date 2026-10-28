import assert from "node:assert/strict";
import test from "node:test";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { homePhotosQuery } from "../src/lib/db/home-photos-query";
import { selectHomePhotoIds } from "../src/lib/home-photo-selection";

test("Home photos keep the selected order and do not fill partial selections with unrelated photos", () => {
  const rows = [{ id: "a" }, { id: "b" }, { id: "newest" }];
  assert.deepEqual(selectHomePhotoIds(["b", "a"], rows), ["b", "a"]);
  assert.deepEqual(selectHomePhotoIds(["removed", "a"], rows), ["a"]);
  assert.deepEqual(selectHomePhotoIds(["removed"], rows), ["a", "b", "newest"]);
  assert.deepEqual(selectHomePhotoIds([], []), []);
});
test("Home photo ranking is bounded and enforces couple membership for both chosen and fallback photos", () => {
  const db = drizzle(neon("postgresql://test:test@localhost/test"), { schema });
  const actor = { coupleId: "11111111-1111-4111-8111-111111111111", userId: "member" };
  const chosen = "22222222-2222-4222-8222-222222222222";
  for (const ids of [[], [chosen]]) {
    const query = homePhotosQuery(db, actor, ids).toSQL();
    assert.match(query.sql, /"media_assets"\."couple_id" =/);
    assert.match(query.sql, /exists\(select 1 from "couple_members"/);
    assert.ok(query.params.includes(actor.coupleId));
    assert.ok(query.params.includes(actor.userId));
    assert.ok(query.params.includes("image"));
    assert.equal(query.params.at(-1), 3);
    if (ids.length) { assert.ok(query.params.includes(chosen)); assert.match(query.sql, /order by .* in .* desc/); }
  }
});
