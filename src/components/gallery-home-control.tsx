"use client";
import { useState, useTransition } from "react";
import { House } from "lucide-react";
import { setHomeGalleryPhoto } from "@/app/space/customize/actions";

export function GalleryHomeControl({ id, photoIds, onChange }: { id: string; photoIds: string[]; onChange: (ids: string[]) => void }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const selected = photoIds.includes(id);
  function update() {
    if (!selected && photoIds.length >= 3) { setMessage("Choose up to 3 Home photos. Remove one first."); return; }
    const previous = photoIds;
    onChange(selected ? photoIds.filter(photoId => photoId !== id) : [...photoIds, id]);
    startTransition(async () => {
      try {
        const result = await setHomeGalleryPhoto(id, !selected);
        setMessage(result.message);
        if (result.success && result.photoIds) onChange(result.photoIds);
        else onChange(previous);
      } catch { onChange(previous); setMessage("Couldn’t update Home. Please try again."); }
    });
  }
  return <div className="gallery-home-control">
    <button type="button" className="button light" disabled={pending} onClick={update} aria-pressed={selected}>
      <House size={17} aria-hidden="true" />{pending ? "Updating…" : selected ? "Remove from Home" : "Show on Home"}
    </button>
    <small>{selected ? `Shown on Home · ${photoIds.indexOf(id) === 0 ? "Main photo" : `Photo ${photoIds.indexOf(id) + 1}`}` : `${photoIds.length} / 3 Home photos chosen`}</small>
    <p role="status">{message}</p>
  </div>;
}
