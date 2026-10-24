"use client";
/* eslint-disable @next/next/no-img-element -- session-protected previews must bypass the public image optimizer. */

import { useEffect, useRef, useState, type TouchEvent } from "react";
import { LoaderCircle, RotateCcw } from "lucide-react";
import { photoSwipe, type SwipePoint } from "@/lib/photo-swipe";

export function ViewerPhoto({ src, alt, onNavigate }: { src: string; alt: string; onNavigate: (direction: -1 | 1) => void }) {
  const [status, setStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const image = useRef<HTMLImageElement>(null);
  const start = useRef<SwipePoint | null>(null);
  const requestSrc = attempt && /^(?:https?:\/\/|\/)/.test(src)
    ? `${src}${src.includes("?") ? "&" : "?"}_retry=${attempt}` : src;

  useEffect(() => {
    let cancelled = false;
    const current = image.current;
    // Cached images may finish before hydration attaches their load handler.
    if (current?.complete) queueMicrotask(() => {
      if (!cancelled) setStatus(current.naturalWidth > 0 ? "ready" : "failed");
    });
    const timeout = window.setTimeout(() => setStatus(value => value === "loading" ? "failed" : value), 30_000);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [attempt]);

  function touchStart(event: TouchEvent<HTMLDivElement>) {
    start.current = null;
    if ((event.target instanceof Element && event.target.closest("button, a")) || event.touches.length !== 1 || (window.visualViewport?.scale ?? 1) > 1) return;
    const touch = event.touches[0];
    start.current = { x: touch.clientX, y: touch.clientY, time: event.timeStamp };
  }
  function touchEnd(event: TouchEvent<HTMLDivElement>) {
    const first = start.current;
    start.current = null;
    if (!first || event.touches.length || event.changedTouches.length !== 1) return;
    const touch = event.changedTouches[0];
    const direction = photoSwipe(first, { x: touch.clientX, y: touch.clientY, time: event.timeStamp });
    if (direction) onNavigate(direction);
  }

  return <div className={`viewer-photo viewer-photo-${status}`} aria-busy={status === "loading"}
    onTouchStart={touchStart} onTouchEnd={touchEnd} onTouchCancel={() => { start.current = null; }}
    onTouchMove={event => { if (event.touches.length !== 1) start.current = null; }}>
    {status !== "failed" && <img key={attempt} ref={image} src={requestSrc} alt={alt} decoding="async" draggable={false}
      onLoad={event => { if (event.currentTarget === image.current) setStatus("ready"); }}
      onError={event => { if (event.currentTarget === image.current) setStatus("failed"); }} />}
    {status === "loading" && <div className="viewer-photo-status" role="status"><LoaderCircle size={26} className="media-spin" aria-hidden="true" /><span>Loading photo…</span></div>}
    {status === "failed" && <div className="viewer-photo-status" role="status"><span>Couldn’t load this photo.</span><small>Check your connection and try again.</small><button type="button" className="button light" onClick={() => { setStatus("loading"); setAttempt(Date.now()); }}><RotateCcw size={16} aria-hidden="true" />Retry photo</button></div>}
  </div>;
}
