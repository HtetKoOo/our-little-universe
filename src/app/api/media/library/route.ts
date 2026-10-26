import { photoActor, preserveHeartPhotos } from "@/lib/heart-photo";
import { listPickerAssets } from "@/lib/media";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };

export async function GET(request: Request) {
  try {
    const actor = await photoActor(request.headers);
    if (!actor) return Response.json({ message: "Please sign in again." }, { status: 401, headers });
    // Legacy imports belong to the library flow, never Home's rendering path.
    await preserveHeartPhotos(actor, actor.photos);
    return Response.json({ assets: await listPickerAssets(actor) }, { headers });
  } catch {
    return Response.json({ message: "Couldn’t load Gallery. Please try again." }, { status: 503, headers });
  }
}
