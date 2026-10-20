import { and, desc, eq, sql } from "drizzle-orm";
import type { getDb } from "../db";
import { mediaAssets, memories, memoryMedia } from "./schema";
import { memoryScope } from "./memory-scope";
import type { MediaActor } from "../media";

// Albums are views of memory attachments: no extra files or album records.
export function galleryAlbumsQuery(db: ReturnType<typeof getDb>, actor: MediaActor, page = 1) {
  return db.select({
    id: memories.id,
    title: memories.title,
    happenedOn: memories.happenedOn,
    photoCount: sql<number>`count(${memoryMedia.assetId})::int`,
    coverId: sql<string>`(array_agg(${memoryMedia.assetId} order by ${memoryMedia.position}, ${memoryMedia.assetId}))[1]`,
  }).from(memories).innerJoin(memoryMedia, and(
    eq(memoryMedia.memoryId, memories.id), eq(memoryMedia.coupleId, actor.coupleId),
  )).innerJoin(mediaAssets, and(
    eq(mediaAssets.id, memoryMedia.assetId), eq(mediaAssets.coupleId, actor.coupleId),
    eq(mediaAssets.resourceType, "image"),
  )).where(memoryScope(actor)).groupBy(memories.id)
    .orderBy(desc(memories.happenedOn), desc(memories.id)).limit(21).offset((page - 1) * 20);
}

