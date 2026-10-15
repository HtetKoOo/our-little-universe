import { z } from "zod";
import { requireCouple } from "@/lib/authorization";
import { findMediaAsset, mediaPreviewUrl } from "@/lib/media";
import { limitedBody } from "@/lib/media-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success) return new Response(null, { status: 404, headers });
    const actor = await requireCouple();
    const asset = await findMediaAsset(actor, id);
    if (!asset || asset.resourceType !== "image") return new Response(null, { status: 404, headers });
    const url = mediaPreviewUrl(asset);
    const upstream = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000) });
    const contentType = upstream.headers.get("content-type");
    if (!upstream.ok || !["image/jpeg", "image/png", "image/webp"].some((type) => contentType?.startsWith(type)) || !upstream.body) return new Response(null, { status: 502, headers });
    const bytes = await limitedBody(new Request("https://internal.invalid", { method: "POST", body: upstream.body, duplex: "half" } as RequestInit), 4 * 1024 * 1024);
    return new Response(bytes as BodyInit, { headers: { ...headers, "Content-Type": contentType! } });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
