import assert from "node:assert/strict";
import test from "node:test";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { storageUsageQuery } from "../src/lib/db/storage-usage-query";
import { formatStorageBytes } from "../src/lib/storage-usage";

test("photo storage aggregates files once and restricts access to the current couple member", () => {
  const db = drizzle(neon("postgresql://test:test@localhost/test"), { schema });
  const actor = { coupleId: "11111111-1111-4111-8111-111111111111", userId: "member" };
  const query = storageUsageQuery(db, actor).toSQL();
  assert.match(query.sql, /count\(\*\)/);
  assert.match(query.sql, /coalesce\(sum\("bytes"\), 0\)/);
  assert.match(query.sql, /"media_assets"\."couple_id" =/);
  assert.match(query.sql, /exists\(select 1 from "couple_members"/);
  assert.ok(query.params.includes(actor.coupleId));
  assert.ok(query.params.includes(actor.userId));
  assert.ok(query.params.includes("image"));
  assert.doesNotMatch(query.sql, /join|memory_media|limit/i);
});
test("storage sizes use decimal units and handle empty, large and invalid values", () => {
  assert.equal(formatStorageBytes(0), "0 B");
  assert.equal(formatStorageBytes(999), "999 B");
  assert.equal(formatStorageBytes(1000), "1 KB");
  assert.equal(formatStorageBytes(8_388_608), "8.39 MB");
  assert.equal(formatStorageBytes(3_500_000_000), "3.5 GB");
  assert.equal(formatStorageBytes(-1), "Unavailable");
  assert.equal(formatStorageBytes(Number.NaN), "Unavailable");
});
