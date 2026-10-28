"use client";
/* eslint-disable @next/next/no-img-element -- private media is served through the session-protected app endpoint. */

import { useEffect, useRef, useState } from "react";

export function MemoryCover({ assetIds, eager = false }: { assetIds: string[]; eager?: boolean }) {
  const image = useRef<HTMLImageElement>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  const [front, ...behind] = assetIds;

  useEffect(() => {
    const current = image.current;
    if (!current?.complete) return;
    setState(current.naturalWidth > 0 ? "ready" : "failed");
  }, []);

  if (!front) return null;

  return <span className={`memory-cover memory-cover-stack${behind.length ? " memory-cover-has-stack" : ""} memory-cover-${state}`}>
    {behind.slice(0, 2).reverse().map((assetId, index) => <span className={`memory-cover-layer memory-cover-layer-${index}`} key={assetId} aria-hidden="true"><img src={`/api/media/${assetId}?size=thumbnail`} alt="" loading="lazy" decoding="async" /></span>)}
    <span className="memory-cover-shimmer" aria-hidden="true" />
    <span className="memory-card-note" aria-hidden="true">♡</span>
    <img ref={image} className="memory-card-image" src={`/api/media/${front}?size=thumbnail`} alt="" loading={eager ? "eager" : "lazy"} fetchPriority={eager ? "high" : "auto"} decoding="async" onLoad={() => setState("ready")} onError={() => setState("failed")} />
  </span>;
}
