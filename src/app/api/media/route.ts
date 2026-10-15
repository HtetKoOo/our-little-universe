import { requireCouple } from "@/lib/authorization";
import { imageMime, limitedBody, MAX_MEMORY_IMAGE_BYTES } from "@/lib/media-input";
import { mediaConfigured, uploadMemoryImage } from "@/lib/media";
import { sameOrigin } from "@/lib/heart-photo-input";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "X-Content-Type-Options": "nosniff",
};

export async function POST(request: Request) {
  if (!sameOrigin(request, process.env.BETTER_AUTH_URL)) {
    return Response.json({ message: "This upload request was blocked." }, { status: 403, headers });
  }
  if (!mediaConfigured()) {
    return Response.json({ message: "Photo uploads aren’t connected yet. Please finish the photo setup." }, { status: 503, headers });
  }
  try {
    const bytes = await limitedBody(request, MAX_MEMORY_IMAGE_BYTES);
    const mime = imageMime(bytes);
    if (!mime || mime !== request.headers.get("content-type")) {
      return Response.json({ message: "Choose a JPG, PNG or WebP photo." }, { status: 415, headers });
    }
    const actor = await requireCouple();
    const asset = await uploadMemoryImage(actor, bytes);
    return Response.json({ duplicate: asset.duplicate, asset: { id: asset.id, format: asset.format, width: asset.width, height: asset.height } }, { status: asset.duplicate ? 200 : 201, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "upload-failed";
    const status = message === "upload-rate-limit" ? 429 : message === "too-large" ? 413 : 500;
    return Response.json({ message: status === 429 ? "Please wait a few seconds before adding another photo." : status === 413 ? "Choose a photo under 8 MB." : "We couldn’t add this photo. Please try again." }, { status, headers });
  }
}
