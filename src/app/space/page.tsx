import { listMediaAssets } from "@/lib/media";
import { readHeartPhoto, photoConfigured, preserveHeartPhotos } from "@/lib/heart-photo";
import { requireCouple } from "@/lib/authorization";
import { calendarDate } from "@/lib/dates";
import { defaultCardText } from "@/lib/card-text";
import { EditableCoupleCard } from "@/components/editable-couple-card";
import { HomeWidgets } from "@/components/home-widgets";
import { PartnerPresence } from "@/components/partner-presence";
import { homeMemorySnapshot } from "@/lib/memories";
import { normalizeHomeWidgets } from "@/lib/home-widgets";
export default async function Space() {
  const couple = await requireCouple();
  const heart = await readHeartPhoto(couple);
  await preserveHeartPhotos(couple, heart.photos ?? []);
  const library = await listMediaAssets(couple);
  const snapshot = await homeMemorySnapshot();

  return (
    <section className="space-home">
      <EditableCoupleCard
        key={`${couple.cardRevision}-${heart.revision}`}
        library={library.map(({id, width, height, format}) => ({id, width, height, format}))}
        photos={heart.photos ?? []}
        photoRevision={heart.revision}
        photoReady={heart.ready}
        uploadsEnabled={photoConfigured()}
        revision={couple.cardRevision}
        text={couple.cardText ?? defaultCardText}
        name={couple.name}
        togetherSince={couple.togetherSince}
        timezone={couple.timezone}
        initialToday={calendarDate(new Date(), couple.timezone)}
      />
      <PartnerPresence />
      <HomeWidgets
        config={normalizeHomeWidgets(couple.homeWidgets)}
        latest={snapshot.latest}
        milestone={snapshot.milestone}
        memoryCount={snapshot.total}
        favoriteCoverSrc={
          snapshot.favoriteCoverId
            ? `/api/media/${snapshot.favoriteCoverId}`
            : undefined
        }
        galleryPhotoSrcs={snapshot.galleryPhotoIds.map(
          (id) => `/api/media/${id}`,
        )}

      />
    </section>
  );
}
