"use server";

import { z } from "zod";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireCouple } from "@/lib/authorization";
import { getDb } from "@/lib/db";
import { couples, coupleMembers, memories } from "@/lib/db/schema";
import { cardTextInput } from "@/lib/card-text";
import { homeWidgetsInput, normalizeHomeWidgets, withHomeMemory } from "@/lib/home-widgets";

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
  const selectedId = normalized.find(widget => widget.id === "memory")?.memoryId;
  try {
    const updated = await getDb().update(couples).set({
      homeWidgets: normalized,
      homeWidgetsRevision: sql`${couples.homeWidgetsRevision} + 1`,
    }).where(and(
      eq(couples.id, actor.coupleId),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${couples.id} and ${coupleMembers.userId}=${actor.userId})`,
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
