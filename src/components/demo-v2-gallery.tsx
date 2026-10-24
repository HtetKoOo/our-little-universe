"use client";
/* eslint-disable @next/next/no-img-element -- fictional local artwork. */
import { ViewerPhoto } from "./viewer-photo";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Heart, House, X } from "lucide-react";
import { demoGalleryPhotos, demoMemories } from "@/lib/demo";
import { demoMemoryPhotos } from "@/lib/demo-v2";
import { useDemoV2 } from "./demo-v2-state";
export function DemoGallery() {
  const { state, dispatch } = useDemoV2();
  const [tab, setTab] = useState<"photos" | "albums" | "favorites">("photos");
  const [album, setAlbum] = useState<string | null>(null);
  const [limit, setLimit] = useState(60);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const photos = album ? demoMemoryPhotos(album, state) : tab === "favorites" ? demoGalleryPhotos.filter(photo => state.favorites.includes(photo.id)) : demoGalleryPhotos;
  const shown = photos.slice(0, limit);
  const active = demoGalleryPhotos.find(photo => photo.id === activeId);
  const index = photos.findIndex(photo => photo.id === activeId);
  function move(direction: -1 | 1) {
    const next = photos[index + direction];
    if (next) { setLimit(current => Math.max(current, index + direction + 1)); setActiveId(next.id); setMessage(""); }
  }
  return <section className="shared-gallery" aria-labelledby="demo-gallery-title">
    <div className="shared-gallery-heading"><div><p className="eyebrow">OUR LITTLE GALLERY</p><h1 id="demo-gallery-title">{album ? demoMemories.find(memory => memory.id === album)?.title : "Photos we keep close."}</h1><p>Fictional artwork · Try Favorites, albums and Show on Home. No personal photos are uploaded.</p></div></div>
    <nav className="gallery-navigation demo-gallery-navigation" aria-label="Gallery views">{(["photos", "albums", "favorites"] as const).map(view => <button type="button" key={view} aria-pressed={tab === view} onClick={() => { setTab(view); setAlbum(null); setLimit(60); }}>{view[0].toUpperCase() + view.slice(1)}</button>)}</nav>
    {tab === "albums" && !album ? <div className="gallery-album-grid">{demoMemories.map(memory => <button type="button" className="gallery-album" key={memory.id} onClick={() => { setAlbum(memory.id); setLimit(60); }}>
      <div className="gallery-album-cover"><img src={demoMemoryPhotos(memory.id, state)[0].src} alt="" /></div><div><h2>{memory.title}</h2><p>{memory.date} · {demoMemoryPhotos(memory.id, state).length} photos</p></div>
    </button>)}</div> : <>
      {album && <button type="button" className="quiet-link demo-albums-back" onClick={() => setAlbum(null)}>← All albums</button>}
      {shown.length ? <div className="gallery-grid">{shown.map(photo => <button type="button" className="gallery-tile" key={photo.id} aria-label={`Open ${photo.alt}`} onClick={() => { setActiveId(photo.id); setMessage(""); dialog.current?.showModal(); }}>
        <img src={photo.src} alt={photo.alt} loading="lazy" />{state.favorites.includes(photo.id) && <span className="gallery-favorite-badge"><Heart size={14} fill="currentColor" /></span>}
      </button>)}</div> : <div className="gallery-empty"><span>♡</span><h2>A place for your favorites.</h2><p>Open a photo in Photos and tap Favorite.</p></div>}
      {limit < photos.length && <div className="gallery-load-more"><button type="button" className="button light" onClick={() => setLimit(current => current + 60)}>Load more photos</button></div>}
    </>}
    <dialog className="gallery-viewer" ref={dialog} aria-label="Sample photo viewer" onClose={() => setActiveId(null)} onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowRight") { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
      {active && <><div className="gallery-viewer-toolbar"><div className="gallery-viewer-navigation">
        <button type="button" className="gallery-viewer-close" aria-label="Previous photo" disabled={index <= 0} onClick={() => move(-1)}><ChevronLeft size={22} /></button><span>{index + 1} / {photos.length}</span>
        <button type="button" className="gallery-viewer-close" aria-label="Next photo" disabled={index >= photos.length - 1} onClick={() => move(1)}><ChevronRight size={22} /></button>
      </div><button type="button" className="gallery-viewer-close" aria-label="Close photo" onClick={() => dialog.current?.close()}><X size={24} /></button></div>
      <div className="gallery-viewer-image"><ViewerPhoto key={active.id} src={active.src} alt={active.alt} onNavigate={move} /></div>
      <div className="gallery-viewer-footer">
        <button type="button" className="button light gallery-favorite-button" aria-pressed={state.favorites.includes(active.id)} onClick={() => { dispatch({ type: "favorite", id: active.id }); if (tab === "favorites") dialog.current?.close(); }}><Heart size={18} fill={state.favorites.includes(active.id) ? "currentColor" : "none"} />{state.favorites.includes(active.id) ? "Favorited" : "Favorite"}</button>
        <a className="button light" href={active.src} download="sample-artwork.svg">Download sample artwork</a>
        <div className="gallery-home-control"><button type="button" className="button light" aria-pressed={state.homePhotos.includes(active.id)} onClick={() => {
          if (!state.homePhotos.includes(active.id) && state.homePhotos.length === 3) { setMessage("Home already has 3 photos. Remove one before adding another."); return; }
          dispatch({ type: "home-photo", id: active.id }); setMessage("Sample Home updated. Open Home to see your choice.");
        }}><House size={17} />{state.homePhotos.includes(active.id) ? "Remove from Home" : "Show on Home"}</button><small>{state.homePhotos.length} / 3 chosen · Preview only</small></div>
        <p className="gallery-favorite-message" role="status">{message}</p>
      </div></>}
    </dialog>
  </section>;
}
