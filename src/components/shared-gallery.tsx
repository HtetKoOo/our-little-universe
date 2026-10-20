"use client";
/* eslint-disable @next/next/no-img-element -- authenticated photos use the app's private media route. */

import { uploadPhotoBatch, type FailedPhotoUpload, type UploadProgress } from "@/lib/media-upload-queue";
import { MAX_MEMORY_UPLOAD_BATCH, MAX_MEMORY_IMAGE_BYTES } from "@/lib/media-input";
import { useRef, useState } from "react";
import Link from "next/link";
import { GalleryHomeControl } from "./gallery-home-control";
import { GalleryNavigation } from "./gallery-navigation";
import { Heart, ImagePlus, LoaderCircle, X } from "lucide-react";

export type GalleryAsset = { id: string; width: number | null; height: number | null; createdAt: Date; isFavorite?: boolean };

export function SharedGallery({ initialAssets, uploadsEnabled, album, favoritesOnly = false, homePhotoIds = [] }: { initialAssets: GalleryAsset[]; uploadsEnabled: boolean; homePhotoIds?: string[]; favoritesOnly?: boolean; album?: { id: string; title: string } }) {
  const [chosenHomePhotos, setChosenHomePhotos] = useState(homePhotoIds);
  const input = useRef<HTMLInputElement>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [active, setActive] = useState<GalleryAsset | null>(null);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState<FailedPhotoUpload[]>([]);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const uploading = useRef(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const favoriteRequest = useRef(false);
  async function toggleFavorite() {
    if (!active || favoriteRequest.current) return;
    const id = active.id;
    favoriteRequest.current = true;
    setSavingFavorite(true);
    setMessage("");
    try {
      const response = await fetch(`/api/media/${id}/favorite`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !active.isFavorite }),
      });
      if (!response.ok) throw new Error("Couldn’t update favorite. Please try again.");
      const result: { isFavorite: boolean } = await response.json();
      setAssets(current => favoritesOnly && !result.isFavorite
        ? current.filter(photo => photo.id !== id)
        : current.map(photo => photo.id === id ? { ...photo, isFavorite: result.isFavorite } : photo));
      setActive(current => current?.id === id ? { ...current, isFavorite: result.isFavorite } : current);
      setMessage(result.isFavorite ? "Added to our favorites." : "Removed from our favorites.");
    } catch {
      setMessage("Couldn’t update favorite. Please try again.");
    } finally {
      favoriteRequest.current = false;
      setSavingFavorite(false);
    }
  }
  async function upload(files: File[]) {
    if (!files.length || uploading.current) return;
    if (files.length > MAX_MEMORY_UPLOAD_BATCH) {
      setMessage(`Choose up to ${MAX_MEMORY_UPLOAD_BATCH} photos at a time.`);
      return;
    }
    uploading.current = true;
    setPending(true); setMessage(""); setProgress(null); setFailures([]);
    const valid = files.filter(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size > 0 && file.size <= MAX_MEMORY_IMAGE_BYTES);
    const invalid = files.filter(file => !valid.includes(file)).map(file => ({ file, message: "Choose a JPG, PNG or WebP photo under 8 MB." }));
    let reused = 0;
    try {
      const failed = valid.length ? await uploadPhotoBatch(valid, result => {
        if (result.duplicate) reused++;
        setAssets(current => current.some(asset => asset.id === result.asset.id) ? current : [{ ...result.asset, createdAt: new Date() }, ...current]);
      }, setProgress) : [];
      setFailures([...invalid, ...failed]);
      const added = valid.length - failed.length;
      setMessage(`${added} photo${added === 1 ? "" : "s"} ready in Gallery.${reused ? ` ${reused} already saved; reused without extra copies.` : ""}${invalid.length + failed.length ? ` ${invalid.length + failed.length} couldn’t be added.` : ""}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t add these photos.");
    } finally {
      uploading.current = false; setPending(false); setProgress(null);
    }
  }

  return <section className="shared-gallery" aria-labelledby="gallery-title">
    <div className="shared-gallery-heading"><div><p className="eyebrow">OUR LITTLE GALLERY</p><h1 id="gallery-title">{album?.title ?? (favoritesOnly ? "Our favorite photos." : "Photos we keep close.")}</h1><p>{album ? `${assets.length} ${assets.length === 1 ? "photo" : "photos"} kept in this memory.` : favoritesOnly ? "The photos we love a little extra. Favorites are shared by both of you." : "Add up to 10 photos at a time, ready to use in any memory later."}</p></div></div>
    <GalleryNavigation active={album ? "albums" : favoritesOnly ? "favorites" : "photos"} />
    {uploadsEnabled && <button type="button" className="button gallery-upload-button" onClick={() => input.current?.click()} disabled={pending}>{pending ? <LoaderCircle className="media-spin" size={18} aria-hidden="true" /> : <ImagePlus size={18} aria-hidden="true" />}{pending ? "Adding…" : "Add photos"}</button>}
    {album && <div className="gallery-album-actions"><Link href="/space/gallery?view=albums">← All albums</Link><Link href={`/space/memories/${album.id}`}>Open memory →</Link></div>}
    <input ref={input} className="file-input" type="file" multiple disabled={pending} accept="image/jpeg,image/png,image/webp" onChange={(event) => { void upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <p className="gallery-status" role="status">{message}</p>
    {pending && progress && <div className="media-batch-status" role="status"><p>{progress.waiting ? "Waiting a moment…" : "Adding photos…"} {progress.completed} / {progress.total}</p><progress value={progress.completed} max={progress.total} aria-label="Gallery photo upload progress" /></div>}
    {!pending && failures.length > 0 && <div className="media-batch-status"><ul>{failures.map((failure, index) => <li key={index}>{failure.file.name}: {failure.message}</li>)}</ul><button className="button light" type="button" onClick={() => void upload(failures.map(failure => failure.file))}>Retry failed photos</button></div>}
    {assets.length ? <div className="gallery-grid" aria-label="Our shared photos">{assets.map((asset, index) => <button className="gallery-tile" type="button" key={asset.id} onClick={() => { setActive(asset); viewer.current?.showModal(); }} aria-label="Open photo"><img src={`/api/media/${asset.id}?size=thumbnail`} alt="A photo from our shared gallery" loading={index < 4 ? "eager" : "lazy"} decoding="async" />{asset.isFavorite && <span className="gallery-favorite-badge" aria-label="Favorite"><Heart size={14} fill="currentColor" /></span>}</button>)}</div> : <div className="gallery-empty"><span>♡</span><h2>{album ? "This album is waiting." : favoritesOnly ? "A place for your favorites." : "Our gallery is waiting."}</h2><p>{album ? "Add photos from the memory to fill this album." : favoritesOnly ? "Open a photo in Photos or Albums and tap the heart to keep it here." : "Add a photo you both love. You can use it in a memory whenever you want."}</p>{uploadsEnabled && <button type="button" className="button" disabled={pending} onClick={() => input.current?.click()}><ImagePlus size={18} aria-hidden="true" />Add our first photo</button>}</div>}
    <dialog className="gallery-viewer" ref={viewer} onClose={() => setActive(null)} aria-label="Photo viewer">{active && <><div className="gallery-viewer-toolbar"><button type="button" className="gallery-viewer-close" onClick={() => viewer.current?.close()} aria-label="Close photo"><X size={24} /></button></div><div className="gallery-viewer-image"><img src={`/api/media/${active.id}`} alt="A photo from our shared gallery" /></div><div className="gallery-viewer-footer"><button type="button" className="button light gallery-favorite-button" aria-pressed={Boolean(active.isFavorite)} disabled={savingFavorite} onClick={() => void toggleFavorite()}><Heart size={18} fill={active.isFavorite ? "currentColor" : "none"} aria-hidden="true" />{savingFavorite ? "Saving…" : active.isFavorite ? "Favorited" : "Favorite"}</button><a className="button light" href={`/api/media/${active.id}/download`} referrerPolicy="no-referrer">Download photo</a><GalleryHomeControl key={active.id} id={active.id} photoIds={chosenHomePhotos} onChange={setChosenHomePhotos} /><p role="status" className="gallery-favorite-message">{message}</p></div></>}</dialog>
  </section>;
}
