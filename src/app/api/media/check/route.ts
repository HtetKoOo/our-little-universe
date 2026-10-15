import { requireCouple } from "@/lib/authorization";
import { findMediaByHash } from "@/lib/media";
import { limitedBody, sameOrigin } from "@/lib/heart-photo-input";
import { z } from "zod";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function POST(request: Request) {
  if (!sameOrigin(request, process.env.BETTER_AUTH_URL))
    return Response.json({ message: "This request was blocked." }, { status: 403, headers });
  const actor = await requireCouple();
  try {
    const bytes = await limitedBody(request, 256);
    const input = z.object({ hash: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(JSON.parse(new TextDecoder().decode(bytes)));
    if (!input.success) return Response.json({ message: "Invalid photo fingerprint." }, { status: 400, headers });
    const asset = await findMediaByHash(actor, input.data.hash);
    return Response.json({ asset: asset ? { id: asset.id, format: asset.format, width: asset.width, height: asset.height } : null }, { headers });
  } catch {
    return Response.json({ message: "Couldn’t check this photo. Please try again." }, { status: 503, headers });
  }
}
