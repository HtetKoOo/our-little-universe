// Run with: node --conditions=react-server --import tsx scripts/cleanup-heart-photos.ts
import nextEnv from "@next/env";
nextEnv.loadEnvConfig(process.cwd());
try {
  const { cleanupHeartPhotos, photoConfigured } = await import("../src/lib/heart-photo");
  if (!process.env.DATABASE_URL || !photoConfigured()) throw new Error("not-configured");
  const count = await cleanupHeartPhotos();
  const { cleanupDirectMediaUploads } = await import("../src/lib/direct-media");
  const uploads = await cleanupDirectMediaUploads();
  console.log(`Cleaned ${uploads} expired completed direct-upload records.`);
  console.log(`Removed ${count} unreferenced heart photo(s). Run regularly to retry remaining cleanup.`);
} catch { console.error("Photo cleanup failed. Check database, migrations and media configuration. No provider details printed."); process.exitCode = 1; }
