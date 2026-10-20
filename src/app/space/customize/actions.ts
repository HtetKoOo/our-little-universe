"use server";

import { z } from "zod";
import { and, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCouple } from "@/lib/authorization";
import { getDb } from "@/lib/db";
import { couples, coupleMembers, memories, mediaAssets } from "@/lib/db/schema";
import { cardTextInput } from "@/lib/card-text";
import { homeWidgetsInput, normalizeHomeWidgets, withHomeMemory, withHomePhotos } from "@/lib/home-widgets";

export async function saveCardText(_previous: { message: string }, form: FormData): Promise<{ message: string; success?: boolean; revision?: number }> {
  const actor = await requireCouple();
  const parsed = cardTextInput.safeParse({
    ribbon: form.get("ribbon"),
    heading: form.get("heading"),
    message: form.get("message"),
  });
  const revision = Number(form.get("revision"));
  if (!parsed.success || !Number.isSafeInteger(revision) || revision < 0)
    return { message: "Check the text lengths and fill in all three fields." };
  try {
    const updated = await getDb().update(couples).set({
      cardText: parsed.data,
      cardRevision: sql`${couples.cardRevision} + 1`,
    }).where(and(
      eq(couples.id, actor.coupleId),
      eq(couples.cardRevision, revision),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`,
    )).returning({ id: couples.id });
    if (!updated.length) return { message: "Our card changed while you were editing, or your access changed. Copy your draft and reopen Customize to see the latest version." };
  } catch {
    return { message: "Couldn’t save right now. Your draft is still here. Please try again." };
  }
  revalidatePath("/space", "layout");
  return { message: "Saved to our Home.", success: true, revision: revision + 1 };
}

export async function saveHomeWidgets(config: unknown) {
  const actor = await requireCouple();
  const parsed = homeWidgetsInput.safeParse(config);
  if (!parsed.success) return { message: "Those Home settings could not be saved. Please try again." };
  const normalized = normalizeHomeWidgets(parsed.data);
  const photoIds = normalized.find(widget => widget.id === "photo")?.photoIds ?? [];
  const selectedId = normalized.find(widget => widget.id === "memory")?.memoryId;
  try {
    const updated = await getDb().update(couples).set({
      homeWidgets: normalized,
      homeWidgetsRevision: sql`${couples.homeWidgetsRevision} + 1`,
    }).where(and(
      eq(couples.id, actor.coupleId),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`,
      photoIds.length ? sql`(select count(*) from ${mediaAssets} where ${mediaAssets.id} in (${sql.join(photoIds.map(id => sql`${id}::uuid`), sql`, `)}) and ${mediaAssets.coupleId}=${couples.id} and ${mediaAssets.resourceType}='image')=${photoIds.length}` : undefined,
      selectedId ? sql`exists(select 1 from ${memories} where ${memories.id}=${selectedId}::uuid and ${memories.coupleId}=${couples.id})` : undefined,
    )).returning({ id: couples.id });
    if (!updated.length) return { message: "That memory is no longer available, or your access changed. Choose again." };
  } catch {
    return { message: "Couldn’t save Home. Your choices are still here; please try again." };
  }
  revalidatePath("/space", "layout");
  return { message: "Your shared Home is updated.", success: true };
}

// Change only the memory selection while retaining the latest widget arrangement.
export async function setHomeMemory(id: string, show: boolean) {
  const actor = await requireCouple();
  if (!z.uuid().safeParse(id).success || typeof show !== "boolean")
    return { message: "This memory could not be selected." };
  const config = normalizeHomeWidgets(actor.homeWidgets);
  if (!show && config.find(widget => widget.id === "memory")?.memoryId !== id)
    return { message: "The Home selection changed. Refresh this memory and try again." };
  const next = withHomeMemory(config, show ? id : null);
  try {
    const updated = await getDb().update(couples).set({
      homeWidgets: next,
      homeWidgetsRevision: sql`${couples.homeWidgetsRevision} + 1`,
    }).where(and(
      eq(couples.id, actor.coupleId),
      eq(couples.homeWidgetsRevision, actor.homeWidgetsRevision),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`,
      sql`exists(select 1 from ${memories} where ${memories.id}=${id}::uuid and ${memories.coupleId}=${couples.id})`,
    )).returning({ id: couples.id });
    if (!updated.length) return { message: "Home changed, or this memory is no longer available. Refresh and try again." };
  } catch {
    return { message: "Couldn’t update Home. Please try again." };
  }
  revalidatePath("/space", "layout");
  return { success: true, message: show ? "This memory is now on your shared Home." : "Home will choose a memory automatically again." };
}

export async function setHomeGalleryPhoto(id: string, show: boolean) {
  const actor = await requireCouple();
  if (!z.uuid().safeParse(id).success || typeof show !== "boolean")
    return { message: "This photo could not be selected." };
  const db = getDb();
  const config = normalizeHomeWidgets(actor.homeWidgets);
  const current = config.find(widget => widget.id === "photo")?.photoIds ?? [];
  try {
    const candidates = [...new Set([...current, id])];
    const available = await db.select({ id: mediaAssets.id }).from(mediaAssets).where(and(
      inArray(mediaAssets.id, candidates), eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image"),
    ));
    if (show && !available.some(photo => photo.id === id)) return { message: "This photo is no longer available." };
    const kept = current.filter(value => available.some(photo => photo.id === value));
    const photoIds = show ? [...new Set([...kept, id])] : kept.filter(value => value !== id);
    if (photoIds.length > 3) return { message: "Home already has 3 photos. Remove one from Home before adding another." };
    const updated = await db.update(couples).set({
      homeWidgets: withHomePhotos(config, photoIds),
      homeWidgetsRevision: sql`${couples.homeWidgetsRevision} + 1`,
    }).where(and(
      eq(couples.id, actor.coupleId), eq(couples.homeWidgetsRevision, actor.homeWidgetsRevision),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`,
      photoIds.length ? sql`(select count(*) from ${mediaAssets} where ${mediaAssets.id} in (${sql.join(photoIds.map(value => sql`${value}::uuid`), sql`, `)}) and ${mediaAssets.coupleId}=${couples.id} and ${mediaAssets.resourceType}='image')=${photoIds.length}` : undefined,
    )).returning({ id: couples.id });
    if (!updated.length) return { message: "Home changed while you were choosing. Refresh Gallery and try again." };
    revalidatePath("/space", "layout");
    return { success: true, photoIds, message: photoIds.length ? `${photoIds.length} / 3 photos chosen for Home. The first photo is the main one.` : "Home will show the latest Gallery photos automatically." };
  } catch {
    return { message: "Couldn’t update Home. Please try again." };
  }
}
