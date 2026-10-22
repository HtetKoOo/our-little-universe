import assert from "node:assert/strict";
import test from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { testCleanupTarget, testCleanupCoupleId, testCleanupPhrase } from "../scripts/test-data-cleanup-input";
const target = "postgresql://test:secret@test-branch.neon.tech/neondb";
const app = "postgresql://app:secret@real-branch-pooler.neon.tech/neondb";
test("development cleanup never falls back to the app DB and refuses deployment environments", () => {
  assert.throws(() => testCleanupTarget({ DATABASE_URL: app }), /CLEANUP_TEST_DATABASE_URL/);
  for (const env of [{ NODE_ENV: "production" }, { VERCEL: "1" }, { CI: "true" }, { GITHUB_ACTIONS: "true" }])
    assert.throws(() => testCleanupTarget({ ...env, CLEANUP_TEST_DATABASE_URL: target }), /local development terminal/);
  assert.throws(() => testCleanupTarget({ CLEANUP_TEST_DATABASE_URL: "https://example.test/db" }), /PostgreSQL/);
});
test("pooled and direct app endpoint URLs are both protected; a separate test endpoint is accepted", () => {
  for (const url of [app, "postgresql://different:secret@real-branch.neon.tech/other-db"])
    assert.throws(() => testCleanupTarget({ DATABASE_URL: app, CLEANUP_TEST_DATABASE_URL: url }), /Refusing/);
  const selected = testCleanupTarget({ DATABASE_URL: app, CLEANUP_TEST_DATABASE_URL: target });
  assert.equal(selected.host, "test-branch.neon.tech");
  assert.equal(selected.database, "neondb");
  assert.equal(testCleanupCoupleId.safeParse("all").success, false);
  assert.equal(testCleanupPhrase("fixture"), "DELETE TEST DATA fixture");
});
test("the production reset action and UI are removed while the demo reset remains", () => {
  assert.equal(existsSync(new URL("../src/app/space/settings/cleanup-actions.ts", import.meta.url)), false);
  assert.equal(existsSync(new URL("../src/components/start-fresh.tsx", import.meta.url)), false);
  const settings = readFileSync(new URL("../src/app/space/settings/page.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(settings, /StartFresh|cleanup-actions/);
  const preview = readFileSync(new URL("../src/components/preview.tsx", import.meta.url), "utf8");
  assert.match(preview, /Reset preview choices/);
});
