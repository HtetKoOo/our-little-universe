"use client";
/* eslint-disable @next/next/no-img-element -- private media is served through the session-protected app endpoint. */

import { useEffect, useRef, useState } from "react";
import { ViewerPhoto } from "./viewer-photo";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Photo = { id: string; alt: string };

function PrivatePhoto({ photo, className }: { photo: Photo; className: string }) {
  const image = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  useEffect(() => {
    const current = image.current;
    if (current?.complete) setState(current.naturalWidth > 0 ? "ready" : "failed");
  }, []);
  return <span className={`${className} memory-photo-${state}`}>
    <span className="memory-photo-shimmer" aria-hidden="true" />
    {state === "failed" ? <span className="memory-photo-fallback" aria-hidden="true">♡</span> : <img ref={image} src={`/api/media/${photo.id}${className === "memory-photo-frame" ? "?size=thumbnail" : ""}`} alt={photo.alt} loading="lazy" decoding="async" onLoad={() => setState("ready")} onError={() => setState("failed")} />}
  </span>;
}

export function MemoryPhotoGallery({ photos }: { photos: Photo[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    if (selected === null) dialog.current?.close();
    else if (!dialog.current?.open) dialog.current?.showModal();
  }, [selected]);
  if (!photos.length) return null;
  const active = selected === null ? null : photos[selected];
  function change(index: number) { setSelected((index + photos.length) % photos.length); }
  return <>
    <section className={`memory-photo-gallery memory-photo-count-${Math.min(photos.length, 4)}`} aria-label="Photos in this memory">
      {photos.slice(0, 4).map((photo, index) => <button type="button" key={photo.id} className="memory-photo-button" onClick={() => setSelected(index)} aria-label={`Open photo ${index + 1}`}>
        <PrivatePhoto photo={photo} className="memory-photo-frame" />
        {index === 3 && photos.length > 4 && <span className="memory-photo-more">+{photos.length - 4} photos</span>}
      </button>)}
    </section>
    <dialog ref={dialog} className="memory-photo-viewer" aria-label={active ? `Photo ${selected! + 1} of ${photos.length}` : "Photo viewer"} onClose={() => setSelected(null)} onKeyDown={event => { if (selected !== null && photos.length > 1 && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); change(selected + (event.key === "ArrowLeft" ? -1 : 1)); } }}>
      {active && <div className="memory-photo-viewer-content">
        <button type="button" className="memory-viewer-close" onClick={() => setSelected(null)} aria-label="Close photo"><X size={24} aria-hidden="true" /></button>
        {photos.length > 1 && <button type="button" className="memory-viewer-arrow memory-viewer-previous" onClick={() => change(selected! - 1)} aria-label="Previous photo"><ChevronLeft size={28} aria-hidden="true" /></button>}
        <div className="memory-viewer-image"><ViewerPhoto key={active.id} src={`/api/media/${active.id}`} alt={active.alt} onNavigate={direction => { if (photos.length > 1) change(selected! + direction); }} /></div>
        {photos.length > 1 && <button type="button" className="memory-viewer-arrow memory-viewer-next" onClick={() => change(selected! + 1)} aria-label="Next photo"><ChevronRight size={28} aria-hidden="true" /></button>}
        {photos.length > 1 && <p className="memory-viewer-count">{selected! + 1} / {photos.length}</p>}
      </div>}
    </dialog>
  </>;
}
