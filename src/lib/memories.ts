import "server-only";
import { normalizeHomeWidgets } from "./home-widgets";
import { and, count, desc, eq, inArray } from "drizzle-orm";
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
  const selectedId = config.find(widget => widget.id === "memory")?.memoryId;
  const chosenIds = config.find(widget => widget.id === "photo")?.photoIds ?? [];
  // These reads share request-scoped authorization, but do not depend on one another.
  const [[latest], [milestone], [total], [featured], galleryPhotos, chosenPhotos] = await Promise.all([
    db.select().from(memories).where(memoryScope(actor))
      .orderBy(desc(memories.happenedOn), desc(memories.id)).limit(1),
    db.select().from(memories).where(and(memoryScope(actor), eq(memories.isMilestone, true)))
      .orderBy(desc(memories.happenedOn), desc(memories.id)).limit(1),
    db.select({ value: count() }).from(memories).where(memoryScope(actor)),
    selectedId ? db.select().from(memories).where(memoryScope(actor, selectedId)).limit(1) : Promise.resolve([]),
    db.select({ id: mediaAssets.id }).from(mediaAssets).where(eq(mediaAssets.coupleId, actor.coupleId))
      .orderBy(desc(mediaAssets.createdAt)).limit(3),
    chosenIds.length ? db.select({ id: mediaAssets.id }).from(mediaAssets)
      .where(and(eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image"), inArray(mediaAssets.id, chosenIds))) : Promise.resolve([]),
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
  const orderedChosen = chosenIds.filter(id => chosenPhotos.some(photo => photo.id === id));
  return {
    featured: featured ?? null,
    latest: latest ?? null,
    milestone: milestone ?? null,
    total: total?.value ?? 0,
    favoriteCoverId: favoriteCover?.assetId ?? null,
    galleryPhotoIds: orderedChosen.length ? orderedChosen : galleryPhotos.map(({ id }) => id),
  };
}
