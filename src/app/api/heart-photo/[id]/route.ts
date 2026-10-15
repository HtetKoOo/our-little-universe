import { findMediaAsset, mediaPreviewUrl } from "@/lib/media";
import { z } from "zod";
import { photoActor, publicIdFor } from "@/lib/heart-photo";
import { getCloudinary } from "@/lib/cloudinary";
import { limitedBody } from "@/lib/heart-photo-input";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
  "Cross-Origin-Resource-Policy": "same-origin",
};
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!z.uuid().safeParse(id).success)
      return new Response(null, { status: 404, headers });
    const actor = await photoActor(request.headers);
    const photo = actor?.photos.find((item) => item.id === id);
    if (!actor || !photo) return new Response(null, { status: 404, headers });
    const asset = await findMediaAsset(actor, id);
    const url = asset ? mediaPreviewUrl(asset) : getCloudinary().utils.private_download_url(
      publicIdFor(id),
      photo.format,
      {
        resource_type: "image",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60,
        attachment: false,
      },
    );
    // Never redirect to or expose the signed provider URL. Recheck membership on
    // every application request, with no public CDN or browser cache.
    const upstream = await fetch(url, {
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(15000),
    });
    const contentType = upstream.headers.get("content-type");
    if (
      !upstream.ok ||
      !["image/jpeg", "image/png", "image/webp"].some((type) =>
        contentType?.startsWith(type),
      ) ||
      !upstream.body
    )
      return new Response(null, { status: 502, headers });
    const bytes = await limitedBody(
      new Request("https://internal.invalid", {
        method: "POST",
        body: upstream.body,
        duplex: "half",
      } as RequestInit),
      4 * 1024 * 1024,
    );
    return new Response(bytes as BodyInit, {
      headers: { ...headers, "Content-Type": contentType! },
    });
  } catch {
    return new Response(null, { status: 503, headers });
  }
}
