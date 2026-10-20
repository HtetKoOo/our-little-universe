import assert from "node:assert/strict";
import test from "node:test";
import * as schema from "../src/lib/db/schema";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { galleryAlbumsQuery } from "../src/lib/db/gallery-albums-query";

// Only compile SQL; no database or credentials are needed.
const db = drizzle(neon("postgresql://test:test@localhost/test"), { schema });
const actor = { coupleId: "11111111-1111-4111-8111-111111111111", userId: "member-1" };
test("album covers and counts aggregate joined attachments, not ambiguous correlated IDs", () => {
  const { sql, params } = galleryAlbumsQuery(db, actor).toSQL();
  assert.match(sql, /count\("memory_media"\."asset_id"\)/);
  assert.match(sql, /array_agg\("memory_media"\."asset_id" order by "memory_media"\."position"/);
  assert.match(sql, /inner join "memory_media" on/);
  assert.match(sql, /"memory_media"\."memory_id" = "memories"\."id"/);
  assert.match(sql, /group by "memories"\."id"/);
  assert.ok(params.includes(actor.coupleId));
  assert.ok(params.includes(actor.userId));
  assert.ok(params.includes("image"));
  assert.doesNotMatch(sql, /select count/);
});
test("album pagination fetches one extra row to determine the next page", () => {
  const { params } = galleryAlbumsQuery(db, actor, 3).toSQL();
  assert.deepEqual(params.slice(-2), [21, 40]);
});
