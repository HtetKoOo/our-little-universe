import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireCouple } from "@/lib/authorization";
import { getDb } from "@/lib/db";
import { coupleMembers, mediaAssets } from "@/lib/db/schema";
import { limitedBody, sameOrigin } from "@/lib/heart-photo-input";

const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!sameOrigin(request, process.env.BETTER_AUTH_URL))
    return Response.json({ message: "This request was blocked." }, { status: 403, headers });
  const actor = await requireCouple();
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success) return Response.json({ message: "Photo not found." }, { status: 404, headers });
  try {
    const bytes = await limitedBody(request, 128);
    const input = z.object({ isFavorite: z.boolean() }).safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!input.success) return Response.json({ message: "Invalid favorite." }, { status: 400, headers });
    const [asset] = await getDb().update(mediaAssets).set({ isFavorite: input.data.isFavorite }).where(and(
      eq(mediaAssets.id, id), eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image"),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`,
    )).returning({ isFavorite: mediaAssets.isFavorite });
    return asset ? Response.json(asset, { headers }) : Response.json({ message: "Photo not found." }, { status: 404, headers });
  } catch {
    return Response.json({ message: "Couldn’t update favorite. Please try again." }, { status: 503, headers });
  }
}
