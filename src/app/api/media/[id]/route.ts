import { z } from "zod";
import { requireCouple } from "@/lib/authorization";
import { findMediaAsset, fetchMediaPreview } from "@/lib/media";
import { privatePhotoResponse } from "@/lib/private-photo-response";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const actor = await requireCouple();
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success)
      return new Response(null, { status: 404, headers });
    const asset = await findMediaAsset(actor, id);
    if (!asset || asset.resourceType !== "image")
      return new Response(null, { status: 404, headers });
    const variant =
      new URL(request.url).searchParams.get("size") === "thumbnail"
        ? "thumbnail"
        : "preview";
    // Authorization precedes cache validation; never return 304 across couples.
    const tag = `"photo-${actor.coupleId}-${asset.id}-${variant}-v2"`;
    return await privatePhotoResponse(request, tag, () =>
      fetchMediaPreview(asset, variant),
    );
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
