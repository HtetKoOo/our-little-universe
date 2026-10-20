"use client";
/* eslint-disable @next/next/no-img-element -- private thumbnail route. */
import { useState } from "react";

export function GalleryCover({ id }: { id: string | null }) {
  const [failed, setFailed] = useState(false);
  return <div className="gallery-album-cover">{id && !failed
    ? <img src={`/api/media/${id}?size=thumbnail`} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    : <span aria-label="Album cover unavailable">♡</span>}</div>;
}
