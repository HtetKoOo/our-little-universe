import { Suspense } from "react";
import { CoupleCardLoading, HomeWidgetsLoading } from "@/components/home-loading";
import { readHeartPhoto, photoConfigured } from "@/lib/heart-photo";
import { requireCouple } from "@/lib/authorization";
import { calendarDate } from "@/lib/dates";
import { defaultCardText } from "@/lib/card-text";
import { EditableCoupleCard } from "@/components/editable-couple-card";
import { HomeWidgets } from "@/components/home-widgets";
import { PartnerPresence } from "@/components/partner-presence";
import { homeMemorySnapshot } from "@/lib/memories";
import { normalizeHomeWidgets } from "@/lib/home-widgets";
type Couple = Awaited<ReturnType<typeof requireCouple>>;

async function HomeCard({ couplePromise }: { couplePromise: Promise<Couple> }) {
  const couple = await couplePromise;
  const heart = await readHeartPhoto(couple);
  return (
      <EditableCoupleCard
        key={`${couple.cardRevision}-${heart.revision}`}
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
  );
}

async function HomeShelf({ couplePromise }: { couplePromise: Promise<Couple> }) {
  const couple = await couplePromise;
  const snapshot = await homeMemorySnapshot();
  return (
      <HomeWidgets
        key={couple.homeWidgetsRevision}
        featured={snapshot.featured}
        config={normalizeHomeWidgets(couple.homeWidgets)}
        latest={snapshot.latest}
        milestone={snapshot.milestone}
        memoryCount={snapshot.hasMemory ? 1 : 0}
        favoriteCoverSrc={
          snapshot.favoriteCoverId
            ? `/api/media/${snapshot.favoriteCoverId}?size=thumbnail`
            : undefined
        }
        galleryPhotoSrcs={snapshot.galleryPhotoIds.map(
          (id) => `/api/media/${id}?size=thumbnail`,
        )}

      />
  );
}

async function HomeContent() {
  const couple = await requireCouple();
  const couplePromise = Promise.resolve(couple);
  return <section className="space-home">
    <Suspense fallback={<CoupleCardLoading text={couple.cardText ?? defaultCardText} />}>
      <HomeCard couplePromise={couplePromise} />
    </Suspense>
    <PartnerPresence />
    <Suspense fallback={<HomeWidgetsLoading config={normalizeHomeWidgets(couple.homeWidgets)} />}>
      <HomeShelf couplePromise={couplePromise} />
    </Suspense>
  </section>;
}

export default function Space() {
  return <Suspense fallback={<section className="space-home"><CoupleCardLoading /><p className="partner-presence" aria-hidden="true"><span className="home-data-placeholder">Loading partner status</span></p><HomeWidgetsLoading /></section>}>
    <HomeContent />
  </Suspense>;
}
