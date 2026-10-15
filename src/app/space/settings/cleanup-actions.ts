"use server";

import { createHmac, randomInt, randomUUID, timingSafeEqual } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getAuth } from "@/lib/auth";
import { requireCouple } from "@/lib/authorization";
import { getCloudinary } from "@/lib/cloudinary";
import { getDb } from "@/lib/db";
import { couples, heartPhotoUploads, littleQuestionRounds, mediaAssets, memories, memoryMedia, mediaUploadIntents, user, verification } from "@/lib/db/schema";
import { sendCleanupCode } from "@/lib/email";
import { photoConfigured, publicIdFor } from "@/lib/heart-photo";

export type StartFreshState = { message: string; stage?: "otp"; complete?: boolean };
const confirmation = "DELETE OUR TEST DATA";
const expiresInMs = 10 * 60 * 1000;
const codeIdentifier = (coupleId: string, userId: string) => `start-fresh:${coupleId}:${userId}`;
const hashCode = (identifier: string, code: string) =>
  createHmac("sha256", process.env.BETTER_AUTH_SECRET!).update(`${identifier}:${code}`).digest("hex");

async function clearTestData(actor: Awaited<ReturnType<typeof requireCouple>>) {
  const db = getDb();
  const [couple] = await db.select({ photos: couples.heartPhotos, legacyPhoto: couples.heartPhoto }).from(couples).where(eq(couples.id, actor.coupleId)).limit(1);
  const assets = await db.select({ publicId: mediaAssets.publicId, resourceType: mediaAssets.resourceType }).from(mediaAssets).where(eq(mediaAssets.coupleId, actor.coupleId));
  const heartIds = [...(couple?.photos ?? []), ...(couple?.legacyPhoto ? [couple.legacyPhoto] : [])].map((photo) => photo.id);
  try {
    await db.delete(mediaUploadIntents).where(eq(mediaUploadIntents.coupleId, actor.coupleId));
    await db.delete(memoryMedia).where(eq(memoryMedia.coupleId, actor.coupleId));
    await db.delete(memories).where(eq(memories.coupleId, actor.coupleId));
    await db.delete(mediaAssets).where(eq(mediaAssets.coupleId, actor.coupleId));
    await db.delete(littleQuestionRounds).where(eq(littleQuestionRounds.coupleId, actor.coupleId));
    await db.delete(heartPhotoUploads).where(eq(heartPhotoUploads.coupleId, actor.coupleId));
    await db.update(couples).set({ heartPhotos: null, heartPhoto: null }).where(eq(couples.id, actor.coupleId));
  } catch {
    return "We couldn’t finish clearing the test data. Please try again.";
  }
  if (photoConfigured()) {
    const cloudinary = getCloudinary();
    const results = await Promise.allSettled([
      ...assets.map((asset) => cloudinary.uploader.destroy(asset.publicId, { resource_type: asset.resourceType, type: "authenticated", invalidate: true })),
      ...heartIds.map((id) => cloudinary.uploader.destroy(publicIdFor(id), { resource_type: "image", type: "authenticated", invalidate: true })),
    ]);
    if (results.some((result) => result.status === "rejected")) return "Your app data is cleared. A storage cleanup could not finish.";
  }
  revalidatePath("/space", "layout");
  return "A fresh start is ready. Your account and couple settings are still here.";
}

export async function startFresh(_previous: StartFreshState, form: FormData): Promise<StartFreshState> {
  const actor = await requireCouple();
  if (actor.role !== "owner") return { message: "Only the owner can start fresh." };
  const intent = form.get("intent");
  const identifier = codeIdentifier(actor.coupleId, actor.userId);
  const db = getDb();

  if (intent === "request") {
    if (form.get("confirmation") !== confirmation) return { message: `Type ${confirmation} exactly to continue.` };
    const password = String(form.get("password") ?? "");
    if (!password) return { message: "Enter your password to continue." };
    try {
      const verified = await getAuth().api.verifyPassword({ body: { password }, headers: await headers() });
      if (!verified.status) return { message: "That password is not correct." };
    } catch {
      return { message: "That password is not correct." };
    }
    const [owner] = await db.select({ email: user.email }).from(user).where(eq(user.id, actor.userId)).limit(1);
    if (!owner) return { message: "Your account could not be confirmed." };
    const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
    await db.delete(verification).where(eq(verification.identifier, identifier));
    await db.insert(verification).values({ id: randomUUID(), identifier, value: hashCode(identifier, code), expiresAt: new Date(Date.now() + expiresInMs) });
    try {
      await sendCleanupCode({ to: owner.email, code });
    } catch {
      await db.delete(verification).where(eq(verification.identifier, identifier));
      return { message: "We couldn’t send the confirmation code. Please try again." };
    }
    return { message: "A 6-digit code is in your email. It expires in 10 minutes.", stage: "otp" };
  }

  if (intent !== "confirm") return { message: "Please begin again." };
  const code = String(form.get("code") ?? "");
  if (!/^\d{6}$/.test(code)) return { message: "Enter the 6-digit code from your email.", stage: "otp" };
  const [stored] = await db.select({ value: verification.value }).from(verification).where(and(eq(verification.identifier, identifier), gt(verification.expiresAt, new Date()))).limit(1);
  const expected = hashCode(identifier, code);
  if (!stored || !timingSafeEqual(Buffer.from(stored.value), Buffer.from(expected))) return { message: "That code is not valid or has expired. Begin again to receive a new code.", stage: "otp" };
  const consumed = await db.delete(verification).where(and(eq(verification.identifier, identifier), eq(verification.value, stored.value), gt(verification.expiresAt, new Date()))).returning({ id: verification.id });
  if (!consumed.length) return { message: "That code is no longer valid. Begin again.", stage: "otp" };
  return { message: await clearTestData(actor), complete: true };
}
