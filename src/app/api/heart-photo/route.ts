import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  cleanupHeartPhotos,
  photoActor,
  photoConfigured,
  saveHeartPhotos,
  uploadHeartPhoto,
} from "@/lib/heart-photo";
import {
  cropInput,
  defaultCrop,
  imageMime,
  limitedBody,
  photoCollectionEditInput,
  sameOrigin,
} from "@/lib/heart-photo-input";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const reply = (message: string, status: number) =>
  Response.json(
    { message },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
async function mutate(request: Request) {
  if (!sameOrigin(request, process.env.BETTER_AUTH_URL))
    return reply("Please reopen our space and try again.", 403);
  try {
    const actor = await photoActor(request.headers);
    if (!actor) return reply("Please sign in to your couple space.", 401);
    let photos = actor.photos;
    let revision: number;
    if (request.method === "POST") {
      if (!photoConfigured())
        return reply(
          "Photo uploads aren’t connected yet. Please finish the photo setup.",
          503,
        );
      const parsed = z.coerce
        .number()
        .int()
        .min(0)
        .max(2147483646)
        .safeParse(
          new URL(request.url).searchParams.get("revision") ?? "invalid",
        );
      if (!parsed.success) return reply("Please reopen the photo editor.", 400);
      revision = parsed.data;
      if (revision !== actor.revision)
        return reply(
          "Our photo changed. Reopen the editor to see the latest photo.",
          409,
        );
      const bytes = await limitedBody(request);
      const mime = imageMime(bytes);
      if (!mime || request.headers.get("content-type") !== mime)
        return reply("Choose a JPG, PNG or WebP photo.", 415);
      const crop = cropInput.safeParse(
        JSON.parse(
          request.headers.get("x-photo-crop") ?? JSON.stringify(defaultCrop),
        ),
      );
      if (!crop.success) return reply("Please check the photo position.", 400);
      if (photos.length >= 3)
        return reply(
          "Keep up to three heart photos. Remove one before adding another.",
          400,
        );
      photos = [
        ...photos,
        { ...(await uploadHeartPhoto(actor, bytes)), crop: crop.data },
      ];
    } else {
      const bytes = await limitedBody(request, 2048);
      const parsed = photoCollectionEditInput.safeParse(
        JSON.parse(new TextDecoder().decode(bytes)),
      );
      if (!parsed.success)
        return reply("Please check the photo position and try again.", 400);
      revision = parsed.data.revision;
      if (revision !== actor.revision)
        return reply(
          "Our photo changed. Reopen the editor to see the latest photo.",
          409,
        );
      photos = parsed.data.photos;
    }
    const saved = await saveHeartPhotos(
      actor,
      revision,
      photos,
    );
    if (!saved)
      return reply(
        "Our photo changed, or your access changed. Reopen the editor before trying again.",
        409,
      );
    revalidatePath("/space", "layout");
    // Cleanup failure must never turn a successful save into an apparent failure.
    if (photoConfigured()) await cleanupHeartPhotos().catch(() => undefined);
    return Response.json(
      { photos, revision: saved.revision },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "too-large")
      return reply("Choose a photo smaller than 4 MB.", 413);
    if (error instanceof SyntaxError)
      return reply("Please reopen the photo editor.", 400);
    if (error instanceof Error && error.message === "upload-rate-limit")
      return reply(
        "Please wait before uploading again. Up to 20 uploads per hour are allowed.",
        429,
      );
    return reply(
      "We couldn’t save the photo. Your current photo is safe; please try again.",
      500,
    );
  }
}
export { mutate as POST, mutate as PATCH };
