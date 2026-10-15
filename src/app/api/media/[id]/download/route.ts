import { z } from "zod";
import { requireCouple } from "@/lib/authorization";
import { getCloudinary } from "@/lib/cloudinary";
import { findMediaAsset } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  Vary: "Cookie",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // Keep authentication outside the provider error handler so sign-in redirects
  // retain their normal Next.js behavior.
  const actor = await requireCouple();
  const { id } = await context.params;
  if (!z.uuid().safeParse(id).success)
    return new Response(null, { status: 404, headers });

  try {
    const asset = await findMediaAsset(actor, id);
    if (!asset || asset.resourceType !== "image")
      return new Response(null, { status: 404, headers });

    // Download only the stored asset; no new resize or format conversion.
    // File bytes travel from Cloudinary to the browser, bypassing Vercel.
    const url = getCloudinary().utils.private_download_url(
      asset.publicId,
      asset.format,
      {
        resource_type: "image",
        type: "authenticated",
        expires_at: Math.floor(Date.now() / 1000) + 60,
        attachment: true,
      },
    );
    return new Response(null, {
      status: 302,
      headers: { ...headers, Location: url },
    });
  } catch {
    return Response.json(
      { message: "This photo couldn’t be downloaded. Please try again." },
      { status: 503, headers },
    );
  }
}
