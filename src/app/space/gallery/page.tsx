import { readHeartPhoto, preserveHeartPhotos } from "@/lib/heart-photo";
import { SharedGallery } from "@/components/shared-gallery";
import { requireCouple } from "@/lib/authorization";
import { listMediaAssets, mediaConfigured } from "@/lib/media";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const couple = await requireCouple();
  const heart = await readHeartPhoto(couple);
  await preserveHeartPhotos(couple, heart.photos ?? []);
  const assets = await listMediaAssets(couple);
  return <SharedGallery uploadsEnabled={mediaConfigured()} initialAssets={assets.map(({ id, width, height, createdAt }) => ({ id, width, height, createdAt }))} />;
}
