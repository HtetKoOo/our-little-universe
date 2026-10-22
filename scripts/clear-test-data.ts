// Local CLI only. Never import this file from src/ or run it against real data.
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { parseArgs } from "node:util";
import { createInterface } from "node:readline/promises";
import { TestCleanupInputError, testCleanupCoupleId, testCleanupPhrase, testCleanupTarget } from "./test-data-cleanup-input";

nextEnv.loadEnvConfig(process.cwd());
async function main() {
  const target = testCleanupTarget(process.env);
  const { values } = parseArgs({ options: { couple: { type: "string" }, apply: { type: "boolean", default: false } }, allowPositionals: false });
  const parsed = testCleanupCoupleId.safeParse(values.couple);
  if (!parsed.success) throw new TestCleanupInputError("Provide the disposable couple UUID with --couple <uuid>.");
  if (values.apply && (!process.stdin.isTTY || !process.stdout.isTTY))
    throw new TestCleanupInputError("Apply requires an interactive local terminal.");
  const id = parsed.data;
  const sql = neon(target.connection);
  const [exists] = await sql`select id from couples where id=${id}::uuid`;
  if (!exists) throw new TestCleanupInputError("That couple does not exist in the test database. Nothing changed.");
  const [summary] = await sql`
    select (select count(*)::int from memories where couple_id=${id}::uuid) as memories,
      (select count(*)::int from media_assets where couple_id=${id}::uuid) as photo_records,
      (select count(*)::int from little_question_rounds where couple_id=${id}::uuid) as question_rounds,
      (select count(*)::int from media_upload_intents where couple_id=${id}::uuid) as upload_intents`;
  console.log(`Disposable test endpoint: ${target.host}; database: ${target.database}; couple: ${id}`);
  console.log(summary);
  console.log("Scope: memories, photo records/links, upload intents, heart photos and question rounds/progress. Accounts, couple details, letters, jar notes and question bank stay intact.");
  console.log("Cloudinary files are not deleted. Use a separate test cloud if testing uploads; this command never uses Cloudinary credentials.");
  if (!values.apply) { console.log("Dry run only. To apply, rerun with --apply after stopping apps/workers using this disposable database."); return; }
  const terminal = createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (await terminal.question(`Type ${testCleanupPhrase(id)} to continue: `) !== testCleanupPhrase(id)) {
      console.log("Cancelled. Nothing changed."); return;
    }
  } finally { terminal.close(); }
  // One transaction: either all scoped fixture changes commit, or none do.
  await sql.transaction([
    sql`select id from couples where id=${id}::uuid for update`,
    sql`delete from media_upload_intents where couple_id=${id}::uuid`,
    sql`delete from memory_media where couple_id=${id}::uuid`,
    sql`delete from memories where couple_id=${id}::uuid`,
    sql`delete from media_assets where couple_id=${id}::uuid`,
    sql`delete from little_question_rounds where couple_id=${id}::uuid`,
    sql`delete from heart_photo_uploads where couple_id=${id}::uuid`,
    sql`update couples set heart_photos=null, heart_photo=null, photo_revision=photo_revision+1,
      photo_upload_at=null, home_widgets=(select coalesce(jsonb_agg(case
        when widget->>'id'='memory' then widget || '{"memoryId":null}'::jsonb
        when widget->>'id'='photo' then widget || '{"photoIds":[]}'::jsonb
        else widget end order by position), '[]'::jsonb)
        from jsonb_array_elements(coalesce(home_widgets,'[]'::jsonb)) with ordinality as entries(widget,position)),
      home_widgets_revision=home_widgets_revision+1 where id=${id}::uuid`,
  ]);
  console.log("Disposable test content cleared. Restart the test app before continuing.");
}
main().catch(error => {
  // Provider errors may contain connection details or SQL parameters.
  console.error(error instanceof TestCleanupInputError
    ? error.message : "Test cleanup failed. Check the disposable database configuration; no provider details were printed.");
  process.exitCode = 1;
});
