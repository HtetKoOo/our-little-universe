import { homePhotosQuery } from "./db/home-photos-query";
import { selectHomePhotoIds } from "./home-photo-selection";
import "server-only";
import { normalizeHomeWidgets } from "./home-widgets";
import { and, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { requireCouple } from "./authorization";
import { getDb } from "./db";
import { mediaAssets, memories, memoryMedia } from "./db/schema";
import { memoryScope } from "./db/memory-scope";
export async function listMemories(page = 1, milestonesOnly = false) {
  const actor = await requireCouple();
  return getDb()
    .select()
    .from(memories)
    .where(
      and(
        memoryScope(actor),
        milestonesOnly ? eq(memories.isMilestone, true) : undefined,
      ),
    )
    .orderBy(desc(memories.happenedOn), desc(memories.id))
    .limit(21)
    .offset((page - 1) * 20);
}

export async function listMemoryCards(page = 1, milestonesOnly = false) {
  const actor = await requireCouple();
  const rows = await getDb()
    .select()
    .from(memories)
    .where(
      and(
        memoryScope(actor),
        milestonesOnly ? eq(memories.isMilestone, true) : undefined,
      ),
    )
    .orderBy(desc(memories.happenedOn), desc(memories.id))
    .limit(21)
    .offset((page - 1) * 20);
  if (!rows.length) return [];

  const photos = await getDb()
    .select({ memoryId: memoryMedia.memoryId, assetId: mediaAssets.id })
    .from(memoryMedia)
    .innerJoin(mediaAssets, eq(memoryMedia.assetId, mediaAssets.id))
    .where(
      and(
        eq(memoryMedia.coupleId, actor.coupleId),
        inArray(
          memoryMedia.memoryId,
          rows.map((memory) => memory.id),
        ),
      ),
    )
    .orderBy(memoryMedia.position);
  const photoIdsByMemory = new Map<string, string[]>();
  for (const photo of photos) {
    const attached = photoIdsByMemory.get(photo.memoryId) ?? [];
    if (attached.length < 3) attached.push(photo.assetId);
    photoIdsByMemory.set(photo.memoryId, attached);
  }
  return rows.map((memory) => ({
    ...memory,
    photoIds: photoIdsByMemory.get(memory.id) ?? [],
  }));
}
export async function findMemory(id: string) {
  const actor = await requireCouple();
  if (!z.uuid().safeParse(id).success) return null;
  const [memory] = await getDb()
    .select()
    .from(memories)
    .where(memoryScope(actor, id))
    .limit(1);
  return memory ?? null;
}

export async function homeMemorySnapshot() {
  const actor = await requireCouple();
  const db = getDb();
  const config = normalizeHomeWidgets(actor.homeWidgets);
  const memoryWidget = config.find(widget => widget.id === "memory" && widget.visible);
  const photoWidget = config.find(widget => widget.id === "photo" && widget.visible);
  const selectedId = memoryWidget?.memoryId;
  const chosenIds = photoWidget?.photoIds ?? [];
  const cardFields = { id: memories.id, title: memories.title, body: memories.body, happenedOn: memories.happenedOn, isMilestone: memories.isMilestone };
  // Hidden widgets do no reads. Rank chosen photos first so selection and
  // newest-photo fallback share one query, including when a choice was removed.
  const [[latest], [milestone], [featured], galleryPhotos] = await Promise.all([
    memoryWidget ? db.select(cardFields).from(memories).where(memoryScope(actor))
      .orderBy(desc(memories.happenedOn), desc(memories.id)).limit(1) : Promise.resolve([]),
    memoryWidget ? db.select(cardFields).from(memories).where(and(memoryScope(actor), eq(memories.isMilestone, true)))
      .orderBy(desc(memories.happenedOn), desc(memories.id)).limit(1) : Promise.resolve([]),
    selectedId ? db.select(cardFields).from(memories).where(memoryScope(actor, selectedId)).limit(1) : Promise.resolve([]),
    photoWidget ? homePhotosQuery(db, actor, chosenIds) : Promise.resolve([]),
  ]);
  const favorite = featured ?? milestone ?? latest;
  const [favoriteCover] = favorite
    ? await db
        .select({ assetId: mediaAssets.id })
        .from(memoryMedia)
        .innerJoin(mediaAssets, eq(memoryMedia.assetId, mediaAssets.id))
        .where(
          and(
            eq(memoryMedia.coupleId, actor.coupleId),
            eq(memoryMedia.memoryId, favorite.id),
          ),
        )
        .orderBy(memoryMedia.position)
        .limit(1)
    : [];
  return {
    featured: featured ?? null,
    latest: latest ?? null,
    milestone: milestone ?? null,
    hasMemory: Boolean(latest),
    favoriteCoverId: favoriteCover?.assetId ?? null,
    galleryPhotoIds: selectHomePhotoIds(chosenIds, galleryPhotos),
  };
}
