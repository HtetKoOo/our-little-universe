"use client";
/* eslint-disable @next/next/no-img-element -- authenticated photos use the app's private media route. */

import { uploadSharedPhoto } from "@/lib/media-upload-client";
import { useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";

export type GalleryAsset = { id: string; width: number | null; height: number | null; createdAt: Date };

export function SharedGallery({ initialAssets, uploadsEnabled }: { initialAssets: GalleryAsset[]; uploadsEnabled: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [active, setActive] = useState<GalleryAsset | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(file: File | undefined) {
    if (!file || pending) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setMessage("Choose a JPG, PNG or WebP photo under 8 MB.");
      return;
    }
    setPending(true); setMessage("");
    try {
      const result = await uploadSharedPhoto(file);
      setAssets((current) => current.some(asset => asset.id === result.asset.id) ? current : [{ ...result.asset, createdAt: new Date() }, ...current]);
      setMessage(result.duplicate ? "This photo is already in your Gallery. No extra copy was saved." : "Added to your shared gallery.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Couldn’t add this photo."); }
    finally { setPending(false); }
  }
  return <section className="shared-gallery" aria-labelledby="gallery-title">
    <div className="shared-gallery-heading"><div><p className="eyebrow">OUR LITTLE GALLERY</p><h1 id="gallery-title">Photos we keep close.</h1><p>Every photo is shared here once, ready to add to any memory later.</p></div>{uploadsEnabled && <button type="button" className="button gallery-upload-button" onClick={() => input.current?.click()} disabled={pending}>{pending ? <LoaderCircle className="media-spin" size={18} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}{pending ? "Adding…" : "Add photos"}</button>}</div>
    <input ref={input} className="file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    <p className="gallery-status" role="status">{message}</p>
    {assets.length ? <div className="gallery-grid" aria-label="Our shared photos">{assets.map((asset, index) => <button className={`gallery-tile gallery-tile-${index % 7}`} type="button" key={asset.id} onClick={() => { setActive(asset); viewer.current?.showModal(); }} aria-label="Open photo"><img src={`/api/media/${asset.id}`} alt="A photo from our shared gallery" loading={index < 4 ? "eager" : "lazy"} decoding="async" /></button>)}</div> : <div className="gallery-empty"><span>♡</span><h2>Our gallery is waiting.</h2><p>Add a photo you both love. You can use it in a memory whenever you want.</p>{uploadsEnabled && <button type="button" className="button" onClick={() => input.current?.click()}><ImagePlus size={18} aria-hidden="true" />Add our first photo</button>}</div>}
    <dialog className="gallery-viewer" ref={viewer} onClose={() => setActive(null)} aria-label="Photo viewer">{active && <><button type="button" className="gallery-viewer-close" onClick={() => viewer.current?.close()} aria-label="Close photo"><X size={24} /></button><img src={`/api/media/${active.id}`} alt="A photo from our shared gallery" /><p>Kept together.</p><a className="button light" href={`/api/media/${active.id}/download`} referrerPolicy="no-referrer">Download photo</a></>}</dialog>
  </section>;
}
