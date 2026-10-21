import { and, count, eq, sql } from "drizzle-orm";
import type { getDb } from "../db";
import { coupleMembers, mediaAssets } from "./schema";

export function storageUsageQuery(db: ReturnType<typeof getDb>, actor: { coupleId: string; userId: string }) {
  // Aggregate stored assets, never attachment links: reusing a photo counts once.
  return db.select({
    photoCount: count(),
    totalBytes: sql`coalesce(sum(${mediaAssets.bytes}), 0)`.mapWith(Number),
  }).from(mediaAssets).where(and(
    eq(mediaAssets.coupleId, actor.coupleId),
    eq(mediaAssets.resourceType, "image"),
    sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
  ));
}
