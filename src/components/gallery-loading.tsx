"use client";
import { useSearchParams } from "next/navigation";
import { ImagePlus } from "lucide-react";
import { GalleryNavigation } from "./gallery-navigation";
import { DataPlaceholder } from "./route-loading";

export function GalleryLoading() {
  const query = useSearchParams();
  const album = Boolean(query.get("album"));
  const albums = !album && query.get("view") === "albums";
  const favorites = !album && query.get("view") === "favorites";
  return <section className="shared-gallery" role="status" aria-label="Loading gallery" aria-busy="true">
    <div className="shared-gallery-heading"><div><p className="eyebrow">OUR LITTLE GALLERY</p><h1>{album ? <DataPlaceholder wide /> : albums ? "Our photo albums." : favorites ? "Our favorite photos." : "Photos we keep close."}</h1><p>{album ? <DataPlaceholder /> : albums ? "A little collection for every memory with photos." : favorites ? "The photos we love a little extra. Favorites are shared by both of you." : "Add up to 10 photos at a time, ready to use in any memory later."}</p></div></div>
    <GalleryNavigation active={album || albums ? "albums" : favorites ? "favorites" : "photos"} />
    {!album && !albums && !favorites && <button className="button gallery-upload-button" disabled><ImagePlus size={18} />Add photos</button>}
    {album && <div className="gallery-album-actions"><span>← All albums</span><span>Open memory →</span></div>}
    {!albums && <p className="gallery-status" />}
    {albums ? <div className="gallery-album-grid">{[0, 1].map(i => <div className="gallery-album" key={i}><div className="gallery-album-cover route-photo-placeholder" /><div><h2><DataPlaceholder wide /></h2><p><DataPlaceholder /></p></div></div>)}</div> : <div className="gallery-grid" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <div className="gallery-tile route-photo-placeholder" key={i} />)}</div>}
  </section>;
}
