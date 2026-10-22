import { z } from "zod";

export class TestCleanupInputError extends Error {}

export function testCleanupTarget(env: Record<string, string | undefined>) {
  if (env.NODE_ENV === "production" || env.VERCEL || env.CI || env.GITHUB_ACTIONS)
    throw new TestCleanupInputError("Test cleanup is available only in a local development terminal.");
  const value = env.CLEANUP_TEST_DATABASE_URL;
  if (!value) throw new TestCleanupInputError("Set CLEANUP_TEST_DATABASE_URL to a separate disposable test database. DATABASE_URL is never used as a fallback.");
  let target: URL;
  try { target = new URL(value); } catch { throw new TestCleanupInputError("Invalid test database URL."); }
  if (!["postgres:", "postgresql:"].includes(target.protocol) || !target.hostname || !target.pathname.slice(1))
    throw new TestCleanupInputError("Use a complete PostgreSQL test database URL.");
  // A pooled/unpooled connection to the same endpoint is still the same target.
  const endpoint = (url: URL) => url.hostname.toLowerCase().replace(/-pooler(?=\.)/, "");
  if (env.DATABASE_URL) {
    let application: URL;
    try { application = new URL(env.DATABASE_URL); } catch { throw new TestCleanupInputError("The app database configuration could not be checked safely."); }
    if (endpoint(application) === endpoint(target)) throw new TestCleanupInputError("Refusing the application's database endpoint. Use a separate disposable test branch/database host.");
  }
  return { connection: value, host: target.hostname, database: decodeURIComponent(target.pathname.slice(1)) };
}
export const testCleanupCoupleId = z.uuid();
export const testCleanupPhrase = (coupleId: string) => `DELETE TEST DATA ${coupleId}`;
