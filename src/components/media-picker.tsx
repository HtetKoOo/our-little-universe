"use client";
/* eslint-disable @next/next/no-img-element -- this endpoint needs the browser session cookie. */

import { uploadSharedPhoto } from "@/lib/media-upload-client";
import { useRef, useState } from "react";
import { Check, ImagePlus, LoaderCircle, X } from "lucide-react";

export type LibraryAsset = { id: string; format: string; width: number | null; height: number | null };

export function MediaPicker({ assets: initialAssets, selectedIds = [] }: { assets: LibraryAsset[]; selectedIds?: string[] }) {
  const input = useRef<HTMLInputElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState(selectedIds);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const selectedAssets = selected.flatMap((id) => {
    const asset = assets.find((item) => item.id === id);
    return asset ? [asset] : [];
  });

  function toggle(id: string) {
    setSelected((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 12 ? [...current, id] : current);
  }
  async function upload(file: File | undefined) {
    if (!file || pending) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setMessage("Choose a JPG, PNG or WebP photo under 8 MB.");
      return;
    }
    setPending(true); setMessage("");
    try {
      const result = await uploadSharedPhoto(file);
      const asset = result.asset;
      setAssets((current) => current.some(item => item.id === asset.id) ? current : [asset, ...current]);
      setSelected((current) => current.includes(asset.id) || current.length >= 12 ? current : [...current, asset.id]);
      if (result.duplicate) setMessage("This photo is already in your Gallery. Using the existing photo.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Couldn’t add this photo."); }
    finally { setPending(false); }
  }

  return <fieldset className="media-picker" disabled={pending}>
    <legend>Photos <span>(optional)</span></legend>
    <p className="media-help">Choose photos already saved together, or add a new one. Each photo is stored only once.</p>
    <input type="file" ref={input} className="file-input" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void upload(event.target.files?.[0]); event.target.value = ""; }} />
    <div className="media-selection-row">
      {selectedAssets.length ? <div className="media-selected-strip" aria-label={`${selectedAssets.length} selected photos`}>
        {selectedAssets.map((asset) => <button key={asset.id} className="media-selected-thumb" type="button" onClick={() => toggle(asset.id)} aria-label="Remove selected photo">
          <img src={`/api/media/${asset.id}`} alt="" />
          <span><X size={13} aria-hidden="true" /></span>
        </button>)}
      </div> : <p className="media-selection-empty">No photos selected yet.</p>}
      <button className="media-add-button" type="button" onClick={() => dialog.current?.showModal()}>
        <ImagePlus size={18} aria-hidden="true" /> Add photos
      </button>
    </div>
    {selected.map((id) => <input key={id} type="hidden" name="assetId" value={id} />)}
    <p role="status" className="form-status">{message || (selected.length ? `${selected.length} photo${selected.length === 1 ? " is" : "s are"} ready for this memory.` : "")}</p>

    <dialog ref={dialog} className="media-library-dialog" aria-labelledby="media-library-title">
      <div className="media-library-head">
        <div><p className="eyebrow">OUR GALLERY</p><h2 id="media-library-title">Add photos</h2></div>
        <button type="button" className="media-dialog-close" onClick={() => dialog.current?.close()} aria-label="Close photo picker"><X size={22} aria-hidden="true" /></button>
      </div>
      <p className="media-library-copy">Upload a new photo, or select from your most recently saved photos.</p>
      <button className="media-upload" type="button" onClick={() => input.current?.click()}>
        {pending ? <LoaderCircle className="media-spin" size={19} aria-hidden="true" /> : <ImagePlus size={19} aria-hidden="true" />}
        {pending ? "Adding photo…" : "Upload a new photo"}
      </button>
      {assets.length ? <div className="media-library-grid" aria-label="Our saved photos">
        {assets.map((asset) => {
          const isSelected = selected.includes(asset.id);
          return <button key={asset.id} type="button" className={isSelected ? "media-library-thumb selected" : "media-library-thumb"} onClick={() => toggle(asset.id)} aria-pressed={isSelected}>
            <img src={`/api/media/${asset.id}`} alt="" />
            {isSelected ? <span><Check size={17} strokeWidth={3} aria-hidden="true" /></span> : null}
          </button>;
        })}
      </div> : <p className="media-empty">Your shared photo shelf is waiting for its first photo.</p>}
      <div className="media-picker-footer">
        <span>{selected.length ? `${selected.length} selected` : "Select up to 12 photos"}</span>
        <button className="button" type="button" onClick={() => dialog.current?.close()}>{selected.length ? `Add (${selected.length})` : "Done"}</button>
      </div>
    </dialog>
  </fieldset>;
}
