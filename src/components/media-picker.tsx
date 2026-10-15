"use client";
/* eslint-disable @next/next/no-img-element -- this endpoint needs the browser session cookie. */

import { uploadPhotoBatch, type FailedPhotoUpload, type UploadProgress } from "@/lib/media-upload-queue";
import { MAX_MEMORY_MEDIA, MAX_MEMORY_UPLOAD_BATCH, MAX_MEMORY_IMAGE_BYTES } from "@/lib/media-input";
import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";

export type LibraryAsset = { id: string; format: string; width: number | null; height: number | null };

export function MediaPicker({ assets: initialAssets, selectedIds = [], onUploadingChange }: { assets: LibraryAsset[]; selectedIds?: string[]; onUploadingChange?: (busy: boolean) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState(selectedIds);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [failures, setFailures] = useState<FailedPhotoUpload[]>([]);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const uploading = useRef(false);
  const selectedAssets = selected.flatMap((id) => {
    const asset = assets.find((item) => item.id === id);
    return asset ? [asset] : [];
  });

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < MAX_MEMORY_MEDIA ? [...current, id] : current);
  }
  async function upload(files: File[]) {
    if (!files.length || uploading.current) return;
    if (files.length > MAX_MEMORY_UPLOAD_BATCH) {
      setMessage(`Choose up to ${MAX_MEMORY_UPLOAD_BATCH} photos at a time.`); return;
    }
    if (selected.length + files.length > MAX_MEMORY_MEDIA) {
      setMessage(`This memory has room for ${MAX_MEMORY_MEDIA - selected.length} more photos. Choose fewer files.`); return;
    }
    uploading.current = true;
    setPending(true); onUploadingChange?.(true); setMessage("");
    const valid = files.filter(file => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size > 0 && file.size <= MAX_MEMORY_IMAGE_BYTES);
    const invalid = files.filter(file => !valid.includes(file)).map(file => ({ file, message: "Choose a JPG, PNG or WebP photo under 8 MB." }));
    let reused = 0;
    try {
      const failed = valid.length ? await uploadPhotoBatch(valid, result => {
        const asset = result.asset;
        if (result.duplicate) reused++;
        setAssets(current => current.some(item => item.id === asset.id) ? current : [asset, ...current]);
        setSelected(current => current.includes(asset.id) ? current : [...current, asset.id]);
      }, setProgress) : [];
      setFailures([...invalid, ...failed]);
      const added = valid.length - failed.length;
      setMessage(`${added} photo${added === 1 ? "" : "s"} ready.${reused ? ` ${reused} already in Gallery; reused.` : ""}${invalid.length + failed.length ? ` ${invalid.length + failed.length} couldn’t be added.` : ""} Save this memory to keep your selection.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Couldn’t add these photos.");
    } finally {
      uploading.current = false; setPending(false); onUploadingChange?.(false); setProgress(null);
    }
  }

  return <fieldset className="media-picker" aria-busy={pending}>
    <legend>Photos <span>(optional)</span></legend>
    <p className="media-help">Choose photos already saved together, or add a new one. Each photo is stored only once.</p>
    <input type="file" multiple disabled={pending} ref={input} className="file-input" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void upload(Array.from(event.target.files ?? [])); event.target.value = ""; }} />
    <div className="media-selection-row">
      {selectedAssets.length ? <div className="media-selected-strip" aria-label={`${selectedAssets.length} selected photos`}>
        {selectedAssets.map((asset) => <button key={asset.id} className="media-selected-thumb" type="button" disabled={pending} onClick={() => toggle(asset.id)} aria-label="Remove selected photo">
          <img src={`/api/media/${asset.id}`} alt="" loading="lazy" decoding="async" />
          <span><X size={13} aria-hidden="true" /></span>
        </button>)}
      </div> : <p className="media-selection-empty">No photos selected yet.</p>}
      <button className="media-add-button" type="button" onClick={() => dialog.current?.showModal()}>
        <ImagePlus size={18} aria-hidden="true" /> Add photos
      </button>
    </div>
    {selected.map((id) => <input key={id} type="hidden" name="assetId" value={id} />)}
    <p role="status" className="form-status">{message || (selected.length ? `${selected.length} photo${selected.length === 1 ? " is" : "s are"} ready for this memory.` : "")}</p>

    <dialog ref={dialog} onCancel={event => { if (pending) event.preventDefault(); }} className="media-library-dialog" aria-labelledby="media-library-title">
      <div className="media-library-head">
        <div><p className="eyebrow">OUR GALLERY</p><h2 id="media-library-title">Add photos</h2></div>
        <button type="button" className="media-dialog-close" disabled={pending} onClick={() => dialog.current?.close()} aria-label="Close photo picker"><X size={22} aria-hidden="true" /></button>
      </div>
      <p className="media-library-copy">Upload up to 10 photos at a time. Keep up to 100 in this memory, or choose from Gallery.</p>
      <button className="media-upload" type="button" disabled={pending || selected.length >= MAX_MEMORY_MEDIA} onClick={() => input.current?.click()}>
        {pending ? <LoaderCircle className="media-spin" size={19} aria-hidden="true" /> : <ImagePlus size={19} aria-hidden="true" />}
        {pending ? "Adding photos…" : "Upload up to 10 photos"}
      </button>
      {pending && progress && <div className="media-batch-status" role="status"><p>{progress.waiting ? "Waiting a moment…" : "Adding photos…"} {progress.completed} / {progress.total}</p><progress value={progress.completed} max={progress.total} aria-label="Photo upload progress" /></div>}
      <p role="status" className="form-status">{message}</p>
      {!pending && failures.length > 0 && <div className="media-batch-status"><ul>{failures.map((failure, index) => <li key={index}>{failure.file.name}: {failure.message}</li>)}</ul><button type="button" onClick={() => void upload(failures.map(failure => failure.file))}>Retry failed photos</button></div>}
      {assets.length ? <div className="media-library-grid" aria-label="Our saved photos">
        {assets.map((asset) => {
          const isSelected = selected.includes(asset.id);
          return <button key={asset.id} type="button" className={isSelected ? "media-library-thumb selected" : "media-library-thumb"} onClick={() => toggle(asset.id)} disabled={pending} aria-pressed={isSelected}>
            <img src={`/api/media/${asset.id}`} alt="" loading="lazy" decoding="async" />
            {isSelected ? <span><Check size={17} strokeWidth={3} aria-hidden="true" /></span> : null}
          </button>;
        })}
      </div> : <p className="media-empty">Your shared photo shelf is waiting for its first photo.</p>}
      <div className="media-picker-footer">
        <span>{selected.length ? `${selected.length} / 100 selected` : "Select up to 100 photos"}</span>
        <button className="button" type="button" disabled={pending} onClick={() => dialog.current?.close()}>{selected.length ? `Add (${selected.length})` : "Done"}</button>
      </div>
    </dialog>
  </fieldset>;
}
