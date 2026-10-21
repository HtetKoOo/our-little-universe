import { and, desc, eq, sql } from "drizzle-orm";
import type { getDb } from "../db";
import { coupleMembers, mediaAssets } from "./schema";
import { GALLERY_PAGE_SIZE, type GalleryCursor } from "../gallery-pagination";
export function galleryPhotosQuery(db: ReturnType<typeof getDb>, actor: { coupleId: string; userId: string }, favoritesOnly: boolean, cursor: GalleryCursor | null) {
  return db.select({
    id: mediaAssets.id, width: mediaAssets.width, height: mediaAssets.height,
    createdAt: mediaAssets.createdAt, isFavorite: mediaAssets.isFavorite,
    // Preserve database microseconds: JS Date truncation can skip tied rows.
    cursorTime: sql<string>`to_char(${mediaAssets.createdAt} at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`,
  }).from(mediaAssets).where(and(
    eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image"),
    sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
    favoritesOnly ? eq(mediaAssets.isFavorite, true) : undefined,
    cursor ? sql`(${mediaAssets.createdAt}, ${mediaAssets.id}) < (${cursor.time}::timestamptz, ${cursor.id}::uuid)` : undefined,
  )).orderBy(desc(mediaAssets.createdAt), desc(mediaAssets.id)).limit(GALLERY_PAGE_SIZE + 1);
}
