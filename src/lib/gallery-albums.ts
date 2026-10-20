import "server-only";
import { galleryAlbumsQuery } from "./db/gallery-albums-query";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { mediaAssets, memories, memoryMedia } from "./db/schema";
import { memoryScope } from "./db/memory-scope";
import type { MediaActor } from "./media";

export async function listGalleryAlbums(actor: MediaActor, page = 1) {
  return galleryAlbumsQuery(getDb(), actor, page);
}

export async function findGalleryAlbum(actor: MediaActor, id: string) {
  const [memory] = await getDb().select({ id: memories.id, title: memories.title })
    .from(memories).where(memoryScope(actor, id)).limit(1);
  if (!memory) return null;
  const photos = await getDb().select({
    id: mediaAssets.id, width: mediaAssets.width, height: mediaAssets.height,
    createdAt: mediaAssets.createdAt, isFavorite: mediaAssets.isFavorite,
  }).from(memoryMedia).innerJoin(mediaAssets, and(
    eq(memoryMedia.assetId, mediaAssets.id), eq(mediaAssets.coupleId, actor.coupleId),
  )).where(and(eq(memoryMedia.memoryId, id), eq(memoryMedia.coupleId, actor.coupleId)))
    .orderBy(memoryMedia.position, memoryMedia.assetId);
  return { ...memory, photos };
}
