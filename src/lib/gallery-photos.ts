import "server-only";
import { getDb } from "./db";
import { galleryPhotosQuery } from "./db/gallery-photos-query";
import { galleryPage, type GalleryCursor } from "./gallery-pagination";
import type { MediaActor } from "./media";
export async function listGalleryPhotos(actor: MediaActor, favoritesOnly = false, cursor: GalleryCursor | null = null) {
  return galleryPage(await galleryPhotosQuery(getDb(), actor, favoritesOnly, cursor));
}
