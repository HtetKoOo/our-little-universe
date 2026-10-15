import "server-only";
import { and, eq, lt, sql } from "drizzle-orm";
import { getAuth, authConfigured } from "./auth";
import { getDb } from "./db";
import { coupleMembers, couples, heartPhotoUploads, mediaAssets } from "./db/schema";
import { getCloudinary } from "./cloudinary";
import { uploadMemoryImage, findMediaAsset } from "./media";
import { defaultCrop, MAX_HEART_PHOTOS, type SavedHeartPhoto } from "./heart-photo-input";

export async function photoActor(headers: Headers) {
  if (!authConfigured()) return null;
  const session = await getAuth().api.getSession({ headers });
  if (!session) return null;
  const [actor] = await getDb().select({ coupleId: couples.id, photos: couples.heartPhotos, legacyPhoto: couples.heartPhoto, revision: couples.photoRevision })
    .from(couples).innerJoin(coupleMembers, eq(coupleMembers.coupleId, couples.id))
    .where(eq(coupleMembers.userId, session.user.id)).limit(1);
  return actor ? { ...actor, photos: actor.photos ?? (actor.legacyPhoto ? [actor.legacyPhoto] : []), userId: session.user.id } : null;
}
export type PhotoActor = NonNullable<Awaited<ReturnType<typeof photoActor>>>;
export function photoScope(actor: Pick<PhotoActor, "coupleId" | "userId">, revision: number) {
  return and(eq(couples.id, actor.coupleId), eq(couples.photoRevision, revision),
    sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`);
}
export const publicIdFor = (id: string) => `heart_photos/${id}`;
export function photoConfigured() {
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}
// Register legacy heart files in the shared library without copying image bytes.
// The provider supplies accurate size; a failed import leaves the old photo intact.
export async function preserveHeartPhotos(actor: { coupleId: string; userId: string }, photos: SavedHeartPhoto[]) {
  for (const photo of photos) {
    if (await findMediaAsset(actor, photo.id)) continue;
    const resource = await getCloudinary().api.resource(publicIdFor(photo.id), {
      resource_type: "image", type: "authenticated",
    });
    await getDb().insert(mediaAssets).values({
      id: photo.id, coupleId: actor.coupleId, createdBy: actor.userId,
      publicId: publicIdFor(photo.id), resourceType: "image", deliveryType: "authenticated",
      format: photo.format, width: resource.width, height: resource.height, bytes: resource.bytes,
    }).onConflictDoNothing();
  }
}

export async function uploadHeartPhoto(actor: PhotoActor, bytes: Uint8Array) {
  const asset = await uploadMemoryImage(actor, bytes);
  return { id: asset.id, width: asset.width!, height: asset.height!, format: asset.format as SavedHeartPhoto["format"], crop: defaultCrop };
}
export async function saveHeartPhotos(actor: PhotoActor, revision: number, photos: SavedHeartPhoto[]) {
  if (photos.length > MAX_HEART_PHOTOS || new Set(photos.map(photo => photo.id)).size !== photos.length) return undefined;
  await preserveHeartPhotos(actor, actor.photos);
  const verified: SavedHeartPhoto[] = [];
  for (const photo of photos) {
    const asset = await findMediaAsset(actor, photo.id);
    if (!asset || asset.resourceType !== "image" || !asset.width || !asset.height) return undefined;
    verified.push({ id: asset.id, width: asset.width, height: asset.height, format: asset.format as SavedHeartPhoto["format"], crop: photo.crop });
  }
  const [updated] = await getDb().update(couples).set({ heartPhotos: verified, heartPhoto: null, photoRevision: sql`${couples.photoRevision} + 1` })
    .where(photoScope(actor, revision))
    .returning({ revision: couples.photoRevision });
  return updated;
}
// Called after replacement/removal and by the maintenance command. Only old,
// unreferenced intents qualify; finalization expires well before this window.
export async function cleanupHeartPhotos(retiredId?: string) {
  const db = getDb();
  const candidates = await db.select({ id: heartPhotoUploads.id }).from(heartPhotoUploads)
    .where(and(retiredId ? eq(heartPhotoUploads.id, retiredId) : lt(heartPhotoUploads.createdAt, new Date(Date.now() - 60 * 60 * 1000)),
      sql`not exists(select 1 from ${mediaAssets} where ${mediaAssets.id}=${heartPhotoUploads.id}) and not exists(select 1 from ${couples} where ${couples.heartPhotos} @> jsonb_build_array(jsonb_build_object('id', ${heartPhotoUploads.id}::text)) or ${couples.heartPhoto}->>'id'=${heartPhotoUploads.id}::text)`)).limit(2);
  let removed = 0;
  for (const { id } of candidates) {
    try {
      const options = { resource_type: "image" as const, type: "authenticated" as const, invalidate: true, timeout: 5000 };
      const result = await getCloudinary().uploader.destroy(publicIdFor(id), options);
      if (result.result !== "ok" && result.result !== "not found") continue;
      // Keep recent intents for the hourly rate-limit count, even after the
      // remote asset is gone. Later cleanup receives "not found" and prunes them.
      await db.delete(heartPhotoUploads).where(and(eq(heartPhotoUploads.id, id), lt(heartPhotoUploads.createdAt, new Date(Date.now() - 60 * 60 * 1000)))); removed++;
    } catch { /* Keep the intent for a later retry. Never log provider errors. */ }
  }
  return removed;
}

// Keep existing private pages usable while this additive migration is awaiting
// application. Only missing-schema errors receive the setup fallback.
export async function readHeartPhoto(actor: {coupleId:string;userId:string}) {
  try {
    const [row] = await getDb().select({photos:couples.heartPhotos,legacyPhoto:couples.heartPhoto,revision:couples.photoRevision}).from(couples)
      .where(and(eq(couples.id,actor.coupleId),sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`)).limit(1);
    return {photos:row?.photos ?? (row?.legacyPhoto ? [row.legacyPhoto] : []),revision:row?.revision ?? 0,ready:Boolean(row)};
  } catch(error) {
    const code = (error as {code?:string;cause?:{code?:string}})?.cause?.code ?? (error as {code?:string})?.code;
    if (code === "42703" || code === "42P01") return {photo:null,revision:0,ready:false};
    throw error;
  }
}
