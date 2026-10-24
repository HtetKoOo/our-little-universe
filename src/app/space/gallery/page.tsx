import { GalleryPosition } from "@/components/gallery-history";
import Link from "next/link";
import { normalizeHomeWidgets } from "@/lib/home-widgets";
import { notFound } from "next/navigation";
import { z } from "zod";
import { readHeartPhoto, preserveHeartPhotos } from "@/lib/heart-photo";
import { SharedGallery } from "@/components/shared-gallery";
import { GalleryNavigation } from "@/components/gallery-navigation";
import { requireCouple } from "@/lib/authorization";
import { mediaConfigured } from "@/lib/media";
import { listGalleryPhotos } from "@/lib/gallery-photos";
import { GalleryCover } from "@/components/gallery-cover";
import { findGalleryAlbum, listGalleryAlbums } from "@/lib/gallery-albums";

export const dynamic = "force-dynamic";

export default async function GalleryPage({ searchParams }: {
  searchParams: Promise<{ view?: string; album?: string; page?: string }>;
}) {
  const couple = await requireCouple();
  const query = await searchParams;
  const historyScope = `${couple.userId}:${couple.coupleId}`;
  const homePhotoIds = normalizeHomeWidgets(couple.homeWidgets).find(widget => widget.id === "photo")?.photoIds ?? [];
  if (query.album) {
    if (!z.uuid().safeParse(query.album).success) notFound();
    const album = await findGalleryAlbum(couple, query.album);
    if (!album) notFound();
    return <SharedGallery historyScope={historyScope} homePhotoIds={homePhotoIds} key={`${historyScope}:album:${album.id}:${album.photos.map(photo => photo.id).join(",")}`} uploadsEnabled={false} initialAssets={album.photos}
      album={{ id: album.id, title: album.title }} />;
  }
  if (query.view === "albums") {
    const page = z.coerce.number().int().min(1).max(10000).catch(1).parse(query.page ?? 1);
    const rows = await listGalleryAlbums(couple, page);
    const albums = rows.slice(0, 20);
    const href = `/space/gallery?view=albums&page=${page}`;
    return <GalleryPosition key={`${historyScope}:${href}`} cacheKey={`${historyScope}:${href}`} href={href}><section className="shared-gallery" aria-labelledby="gallery-title">
      <div className="shared-gallery-heading"><div><p className="eyebrow">OUR LITTLE GALLERY</p><h1 id="gallery-title">Our photo albums.</h1><p>A little collection for every memory with photos.</p></div></div>
      <GalleryNavigation active="albums" />
      {albums.length ? <div className="gallery-album-grid">{albums.map(album => <Link scroll={false} className="gallery-album" key={album.id} href={`/space/gallery?album=${album.id}`}>
        <GalleryCover id={album.coverId} />
        <div><h2>{album.title}</h2><p><time dateTime={album.happenedOn}>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(`${album.happenedOn}T00:00:00Z`))}</time><span> · {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}</span></p></div>
      </Link>)}</div> : <div className="gallery-empty"><span aria-hidden="true">♡</span><h2>{page > 1 ? "No more albums." : "A memory becomes an album."}</h2><p>Add photos to a memory and its album will appear here automatically.</p><Link className="button light" href="/space/memories">Open memories</Link></div>}
      <nav className="gallery-pagination" aria-label="Album pages">{page > 1 && <Link scroll={false} className="button light" href={`/space/gallery?view=albums&page=${page - 1}`}>Previous</Link>}{rows.length > 20 && <Link scroll={false} className="button light" href={`/space/gallery?view=albums&page=${page + 1}`}>Next</Link>}</nav>
    </section></GalleryPosition>;
  }
  const heart = await readHeartPhoto(couple);
  await preserveHeartPhotos(couple, heart.photos ?? []);
  const favoritesOnly = query.view === "favorites";
  const page = await listGalleryPhotos(couple, favoritesOnly);
  return <SharedGallery historyScope={historyScope} homePhotoIds={homePhotoIds} key={`${historyScope}:${favoritesOnly ? "favorites" : "photos"}:${page.assets.map(photo => photo.id).join(",")}`} favoritesOnly={favoritesOnly} uploadsEnabled={!favoritesOnly && mediaConfigured()} initialAssets={page.assets} initialNextCursor={page.nextCursor} />;
}
