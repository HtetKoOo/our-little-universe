import { requireCouple } from "@/lib/authorization";
import { listGalleryPhotos } from "@/lib/gallery-photos";
import { parseGalleryCursor } from "@/lib/gallery-pagination";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store", Vary: "Cookie" };
export async function GET(request: Request) {
  const actor = await requireCouple();
  const params = new URL(request.url).searchParams;
  const raw = params.get("cursor");
  const cursor = raw ? parseGalleryCursor(raw) : null;
  if (raw !== null && !cursor) return Response.json({ message: "Invalid gallery page. Refresh Gallery and try again." }, { status: 400, headers });
  const view = params.get("view");
  if (view && view !== "photos" && view !== "favorites") return Response.json({ message: "Invalid gallery view." }, { status: 400, headers });
  try { return Response.json(await listGalleryPhotos(actor, view === "favorites", cursor), { headers }); }
  catch { return Response.json({ message: "Couldn’t load more photos. Please try again." }, { status: 503, headers }); }
}
