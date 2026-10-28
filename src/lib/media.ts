import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import type { UploadApiResponse } from "cloudinary";
import { coupleMembers, couples, mediaAssets, memoryMedia } from "./db/schema";
import { getCloudinary } from "./cloudinary";
import { getDb } from "./db";
import { PREVIEW_TRANSFORMATION, THUMBNAIL_TRANSFORMATION } from "./direct-media-input";
import { imageFormat, MAX_MEMORY_IMAGE_BYTES } from "./media-input";

export type MediaActor = { coupleId: string; userId: string };
export type MediaAsset = typeof mediaAssets.$inferSelect;

export const mediaPublicId = (id: string) => `memory_assets/${id}`;

export function mediaConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export async function listMediaAssets(actor: MediaActor, favoritesOnly = false) {
  return getDb()
    .select()
    .from(mediaAssets)
    .where(and(eq(mediaAssets.coupleId, actor.coupleId), favoritesOnly ? eq(mediaAssets.isFavorite, true) : undefined))
    .orderBy(desc(mediaAssets.createdAt))
    .limit(60);
}

// The picker needs dimensions and identifiers, not provider/storage metadata.
export async function listPickerAssets(actor: MediaActor) {
  return getDb().select({ id: mediaAssets.id, format: mediaAssets.format, width: mediaAssets.width, height: mediaAssets.height })
    .from(mediaAssets).where(and(eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image")))
    .orderBy(desc(mediaAssets.createdAt)).limit(60);
}

export async function findMediaAsset(actor: MediaActor, id: string) {
  const [asset] = await getDb()
    .select()
    .from(mediaAssets)
    .where(
      and(
        eq(mediaAssets.id, id),
        eq(mediaAssets.coupleId, actor.coupleId),
        sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
      ),
    )
    .limit(1);
  return asset ?? null;
}

export async function listMemoryMedia(actor: MediaActor, memoryId: string) {
  return getDb()
    .select({
      id: mediaAssets.id,
      resourceType: mediaAssets.resourceType,
      format: mediaAssets.format,
      width: mediaAssets.width,
      height: mediaAssets.height,
      alt: memoryMedia.alt,
      position: memoryMedia.position,
    })
    .from(memoryMedia)
    .innerJoin(mediaAssets, eq(memoryMedia.assetId, mediaAssets.id))
    .where(
      and(
        eq(memoryMedia.memoryId, memoryId),
        eq(memoryMedia.coupleId, actor.coupleId),
        sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${memoryMedia.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
      ),
    )
    .orderBy(memoryMedia.position);
}

export async function findMediaByHash(actor: MediaActor, contentHash: string) {
  const [asset] = await getDb().select().from(mediaAssets).where(and(
    eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.contentHash, contentHash),
    sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
  )).limit(1);
  return asset ?? null;
}

export async function uploadMemoryImage(actor: MediaActor, bytes: Uint8Array) {
  if (!mediaConfigured()) throw new Error("media-not-configured");
  const contentHash = createHash("sha256").update(bytes).digest("hex");
  const existing = await findMediaByHash(actor, contentHash);
  if (existing) return { ...existing, duplicate: true };
  const id = randomUUID();
  // Same couple + exact bytes always target one provider object, even across
  // simultaneous requests or a retry after a database failure.
  const publicId = `memory_assets/${actor.coupleId}/${contentHash}`;
  // The same short cooldown protects a couple from accidental repeated taps on
  // slow mobile connections. It is enforced in SQL across server instances.
  const allowed = await getDb().execute(sql`
    update ${couples} set photo_upload_at=now()
    where ${couples.id}=${actor.coupleId}::uuid
      and (photo_upload_at is null or photo_upload_at < now() - interval '3 seconds')
      and exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})
    returning id
  `);
  if (!allowed.rows.length) throw new Error("upload-rate-limit");

  let result: UploadApiResponse;
  try {
    result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = getCloudinary().uploader.upload_stream(
        {
          public_id: publicId,
          resource_type: "image",
          type: "authenticated",
          overwrite: false,
          allowed_formats: ["jpg", "png", "webp"],
          transformation: [
            { width: 2400, height: 2400, crop: "limit" },
            { flags: "strip_profile" },
          ],
          timeout: 60000,
        },
        (error, uploaded) =>
          error || !uploaded
            ? reject(new Error("upload-failed"))
            : resolve(uploaded),
      );
      stream.on("error", () => reject(new Error("upload-failed")));
      stream.end(Buffer.from(bytes));
    });
  } catch {
    throw new Error("upload-failed");
  }

  const format = imageFormat(`image/${result.format === "jpg" ? "jpeg" : result.format}`);
  if (
    result.public_id !== publicId ||
    result.type !== "authenticated" ||
    result.resource_type !== "image" ||
    !format ||
    !result.width ||
    !result.height ||
    result.width > 2400 ||
    result.height > 2400 ||
    !Number.isInteger(result.bytes) ||
    result.bytes < 1 ||
    result.bytes > MAX_MEMORY_IMAGE_BYTES
  ) {
    throw new Error("invalid-provider-result");
  }

  try {
    const [asset] = await getDb()
      .insert(mediaAssets)
      .values({
        id,
        coupleId: actor.coupleId,
        createdBy: actor.userId,
        publicId,
        contentHash,
        resourceType: "image",
        deliveryType: "authenticated",
        format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
      })
      .onConflictDoNothing()
      .returning();
    if (asset) return { ...asset, duplicate: false };
    const winner = await findMediaByHash(actor, contentHash);
    if (winner) return { ...winner, duplicate: true };
    throw new Error("save-failed");
  } catch {
    // Do not delete a deterministic object: a concurrent request may have
    // already committed a row referring to it. A retry reuses the same object.
    throw new Error("save-failed");
  }
}

// Keep original files off Vercel's response path. Only a fixed-size private
// derivative is proxied for display; originals use the download redirect.
export type MediaVariant = "thumbnail" | "preview";
export function mediaPreviewUrl(asset: Pick<MediaAsset, "publicId" | "format">, variant: MediaVariant = "preview") {
  return getCloudinary().url(asset.publicId, {
    secure:true, resource_type:"image", type:"authenticated", sign_url:true,
    format:"jpg", transformation: variant === "thumbnail" ? THUMBNAIL_TRANSFORMATION : PREVIEW_TRANSFORMATION,
  });
}

export async function fetchMediaPreview(asset: Pick<MediaAsset, "publicId" | "format">, variant: MediaVariant = "preview") {
  const url = mediaPreviewUrl(asset,variant);
  const load = () => fetch(url,{ cache:"no-store",redirect:"error",signal:AbortSignal.timeout(20000) });
  let response = await load();
  // Older assets lack these eager derivatives. Generate the fixed variant once;
  // subsequent reads use Cloudinary's cached derivative, without another API call.
  if ([400,401,403,404].includes(response.status)) {
    await response.body?.cancel();
    await getCloudinary().uploader.explicit(asset.publicId,{
      resource_type:"image",type:"authenticated",
      eager:[{ transformation: variant === "thumbnail" ? THUMBNAIL_TRANSFORMATION : PREVIEW_TRANSFORMATION, format:"jpg" }],
      timeout:30000,
    });
    response = await load();
  }
  return response;
}
