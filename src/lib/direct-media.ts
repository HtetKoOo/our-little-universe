import "server-only";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { coupleMembers, couples, mediaAssets, mediaUploadIntents } from "./db/schema";
import { getCloudinary } from "./cloudinary";
import { findMediaByHash, type MediaActor } from "./media";
import { directMediaInput, PREVIEW_TRANSFORMATION, THUMBNAIL_TRANSFORMATION } from "./direct-media-input";
import { limitedBody, MAX_MEMORY_IMAGE_BYTES } from "./media-input";
import { verifyResource, verifyOriginalBytes } from "./direct-media-validation";
import type { z } from "zod";

export async function prepareDirectMedia(actor: MediaActor, input: z.infer<typeof directMediaInput>) {
  const existing = await findMediaByHash(actor, input.hash);
  if (existing) return { asset: existing, duplicate: true as const };
  const id = randomUUID();
  // Original bytes get a new namespace so legacy resized files cannot be
  // mistaken for originals when overwrite=false reuses an existing object.
  const publicId = `original_assets/${actor.coupleId}/${input.hash}`;
  const db = getDb();
  const intent = await db.execute(sql`
    with allowed as (
      update ${couples} set photo_upload_at=now()
      where ${couples.id}=${actor.coupleId}::uuid
        and (photo_upload_at is null or photo_upload_at < now() - interval '3 seconds')
        and exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})
        and (select count(*) from ${mediaUploadIntents} where ${mediaUploadIntents.coupleId}=${actor.coupleId}::uuid and ${mediaUploadIntents.createdAt}>now()-interval '1 hour') < 120
      returning id
    )
    insert into ${mediaUploadIntents} (id,couple_id,user_id,content_hash,expected_bytes,mime,public_id)
    select ${id}::uuid,id,${actor.userId},${input.hash},${input.bytes},${input.mime},${publicId} from allowed returning id
  `);
  if (!intent.rows.length) throw new Error("upload-rate-limit");
  const cloud = getCloudinary();
  const parameters = {
    timestamp: Math.floor(Date.now() / 1000), public_id: publicId,
    type: "authenticated", overwrite: false,
    allowed_formats: "jpg,png,webp",
    // Eager preview creates a separate derivative; no incoming transformation.
    eager: [THUMBNAIL_TRANSFORMATION, PREVIEW_TRANSFORMATION].map(transformation => cloud.utils.generate_transformation_string({ transformation })).join("|"),
  };
  return {
    intentId: id,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloud.config().cloud_name}/image/upload`,
    fields: {
      ...Object.fromEntries(Object.entries(parameters).map(([key,value]) => [key,String(value)])),
      api_key: cloud.config().api_key!,
      signature: cloud.utils.api_sign_request(parameters, cloud.config().api_secret!),
    },
  };
}

export async function completeDirectMedia(actor: MediaActor, intentId: string) {
  const db = getDb();
  const [intent] = await db.select().from(mediaUploadIntents).where(and(
    eq(mediaUploadIntents.id,intentId), eq(mediaUploadIntents.coupleId,actor.coupleId), eq(mediaUploadIntents.userId,actor.userId),
  )).limit(1);
  if (!intent || Date.now()-intent.createdAt.getTime()>15*60*1000) throw new Error("upload-expired");
  const existing = await findMediaByHash(actor,intent.contentHash);
  if (existing) return { asset: existing, duplicate: true };
  const cloud = getCloudinary();
  // Never trust dimensions, size, URLs, or hash assertions returned by the browser.
  const resource = await cloud.api.resource(intent.publicId,{resource_type:"image",type:"authenticated",timeout:15000});
  const format = verifyResource(resource,intent);
  // Read the original server-to-server to verify its actual bytes. This does not
  // cross the browser↔Vercel request-body limit and prevents forged fingerprints.
  const url = cloud.utils.private_download_url(intent.publicId,format,{resource_type:"image",type:"authenticated",expires_at:Math.floor(Date.now()/1000)+60,attachment:false});
  const response = await fetch(url,{cache:"no-store",redirect:"error",signal:AbortSignal.timeout(30000)});
  if (!response.ok || !response.body) throw new Error("provider-unavailable");
  const bytes = await limitedBody(new Request("https://internal.invalid",{method:"POST",body:response.body,duplex:"half"} as RequestInit),MAX_MEMORY_IMAGE_BYTES);
  verifyOriginalBytes(bytes,intent);
  // Recheck the durable intent and membership at the actual write, so a
  // concurrent account cleanup cannot resurrect a cancelled upload.
  const created = await db.execute(sql`
    insert into ${mediaAssets} (id,couple_id,created_by,public_id,content_hash,resource_type,delivery_type,format,bytes,width,height)
    select ${randomUUID()}::uuid,${actor.coupleId}::uuid,${actor.userId},${intent.publicId},${intent.contentHash},'image','authenticated',${format},${resource.bytes},${resource.width},${resource.height}
    from ${mediaUploadIntents}
    where ${mediaUploadIntents.id}=${intentId}::uuid
      and ${mediaUploadIntents.coupleId}=${actor.coupleId}::uuid
      and ${mediaUploadIntents.userId}=${actor.userId}
      and ${mediaUploadIntents.createdAt}>now()-interval '15 minutes'
      and exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${actor.coupleId}::uuid and ${coupleMembers.userId}=${actor.userId})
    on conflict do nothing returning id
  `);
  const asset = await findMediaByHash(actor,intent.contentHash);
  if (!asset) throw new Error("save-failed");
  await db.update(mediaUploadIntents).set({completedAt:new Date()}).where(eq(mediaUploadIntents.id,intentId));
  return { asset, duplicate: created.rows.length === 0 };
}


// Retain abandoned intents for investigation; never race an in-flight upload
// by deleting a deterministic provider object from a background cleanup job.
export async function cleanupDirectMediaUploads() {
  const db = getDb();
  const result = await db.execute(sql`
    delete from ${mediaUploadIntents}
    where ${mediaUploadIntents.createdAt} < now() - interval '24 hours'
      and exists(select 1 from ${mediaAssets} where ${mediaAssets.publicId}=${mediaUploadIntents.publicId})
    returning id
  `);
  return result.rows.length;
}
