"use client";
/* eslint-disable @next/next/no-img-element -- authenticated photos must use the app's private media route. */

import { GalleryEntryLink } from "./gallery-history";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Check, Heart, Maximize2, MessageCircleHeart, Minimize2, Pencil, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { saveHomeWidgets } from "@/app/space/customize/actions";
import type { HomeWidgetConfig, HomeWidgetId } from "@/lib/home-widgets";

type Memory = { id: string; title: string; body: string; happenedOn: string; isMilestone: boolean } | null;

function GalleryPhoto({ src, className }: { src: string; className: string }) {
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");
  return <span className={`${className} home-gallery-photo home-gallery-photo-${state}`}>
    <img src={src} alt="" onLoad={() => setState("ready")} onError={() => setState("failed")} />
    {state === "failed" && <span className="home-gallery-photo-fallback" aria-hidden="true">♡</span>}
  </span>;
}

export function HomeWidgets({ config, latest, milestone, featured = null, memoryCount, favoriteCoverSrc, galleryPhotoSrcs }: { config: HomeWidgetConfig[]; featured?: Memory; latest: Memory; milestone: Memory; memoryCount: number; favoriteCoverSrc?: string; galleryPhotoSrcs: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(config);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const favorite = featured ?? milestone ?? latest;
  const photoSources = galleryPhotoSrcs;
  const active = draft.filter(({ visible }) => visible);
  const move = (index: number, direction: -1 | 1) => setDraft((items) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return items;
    const next = [...items];
    [next[index], next[target]] = [next[target]!, next[index]!];
    return next;
  });
  const toggleSize = (id: HomeWidgetId) => setDraft((items) => items.map((item) => item.id === id ? { ...item, size: item.size === "half" ? "full" : "half" } : item));
  const begin = () => { setDraft(config); setMessage(""); setEditing(true); };
  const cancel = () => { setDraft(config); setMessage(""); setEditing(false); };
  const save = () => startTransition(async () => {
    const result = await saveHomeWidgets(draft);
    setMessage(result.message);
    if (result.success) { setEditing(false); router.refresh(); }
  });
  const widget = (item: HomeWidgetConfig) => {
    const full = item.size === "full";
    const className = `home-widget home-widget-${item.id} home-widget-${item.size}${item.id === "memory" && full && favoriteCoverSrc ? " home-widget-memory-with-cover" : ""}`;
    if (item.id === "photo") return <GalleryEntryLink className={className} onClick={(event) => editing && event.preventDefault()}>
      {photoSources.length ? full ? <div className={`home-photo-collage home-photo-collage-count-${photoSources.length}`} aria-hidden="true"><GalleryPhoto className="home-photo-collage-main" src={photoSources[0]!} />{photoSources.slice(1, 3).map((src, index) => <GalleryPhoto className={`home-photo-collage-small home-photo-collage-small-${index}`} src={src} key={src} />)}</div> : <GalleryPhoto className="home-photo-single" src={photoSources[0]!} /> : <span className="home-photo-placeholder" aria-hidden="true">♡</span>}
      <div className="home-widget-copy"><p>OUR PHOTOS</p>{full && <h3>A little us, lately.</h3>}</div>
      <small><b>{photoSources.length ? "Open gallery →" : "Add our first photo →"}</b></small>
    </GalleryEntryLink>;
    if (item.id === "jar") return <Link className={className} href="/space/jar" onClick={(event) => editing && event.preventDefault()}>
      <span className="home-widget-icon"><Sparkles size={19} aria-hidden="true" /></span><p>MEMORY JAR</p><h3>{full ? "Open a little note." : "A tiny note."}</h3>{full && <span>Leave a thought for another day, then let a small surprise find you.</span>}<small><b>{full ? "Open the jar →" : "Open →"}</b></small>
    </Link>;
    if (item.id === "question") return <Link className={className} href="/space/questions" onClick={(event) => editing && event.preventDefault()}>
      <span className="home-widget-icon"><MessageCircleHeart size={19} aria-hidden="true" /></span><p>ONE LITTLE QUESTION</p><h3>{full ? "A shared thought for today." : "A shared thought."}</h3>{full && <span>Answer separately, then discover what is on each other’s mind.</span>}<small><b>{full ? "See today’s question →" : "Open →"}</b></small>
    </Link>;
    return <Link className={className} href={favorite ? `/space/memories/${favorite.id}` : "/space/memories/new"} onClick={(event) => editing && event.preventDefault()}>
      <span className="home-widget-icon"><Heart size={19} aria-hidden="true" /></span>{full && <span className="home-memory-open">{memoryCount ? "Open memory →" : "Write memory →"}</span>}{full && favoriteCoverSrc && <span className="home-memory-cover" style={{ backgroundImage: `url(${favoriteCoverSrc})` }} aria-hidden="true" />}<p>{featured ? "A MEMORY WE CHOSE" : favorite?.isMilestone ? "A FAVORITE MEMORY" : "OUR LATEST MEMORY"}</p><h3>{favorite ? favorite.title : "Write our first memory."}</h3>{full && <span>{favorite ? favorite.body : "A little ordinary day can be worth keeping too."}</span>}<small>{favorite ? favorite.happenedOn : "Start here"}{!full && <b>Open →</b>}</small>
    </Link>;
  };
  return <section className={`home-widgets${editing ? " home-widgets-editing" : ""}`} aria-labelledby="little-corners">
    <div className="home-widgets-heading">
      <div><p className="eyebrow">A LITTLE CORNER OF US</p><h2 id="little-corners">Our little shelf.</h2></div>
      {!editing ? <button type="button" className="home-customize-link" onClick={begin}><SlidersHorizontal size={16} aria-hidden="true" />Customize home</button> : <span className="home-editing-label"><Pencil size={14} aria-hidden="true" />Editing Home</span>}
    </div>
    {editing && <p className="home-editing-note">Try the arrangement here. Nothing changes for your person until you save.</p>}
    <div className="home-widget-grid">
      {active.map((item, index) => <div className={item.size === "full" ? "home-widget-cell home-widget-wide" : "home-widget-cell"} key={item.id}>
        {widget(item)}
        {editing && <div className="home-widget-edit-controls" aria-label={`Edit ${item.id} widget`}>
          <button type="button" onClick={() => move(index, -1)} disabled={index === 0} aria-label="Move up"><ArrowUp size={16} /></button>
          <button type="button" onClick={() => move(index, 1)} disabled={index === active.length - 1} aria-label="Move down"><ArrowDown size={16} /></button>
          <button type="button" onClick={() => toggleSize(item.id)} aria-label={item.size === "half" ? "Make full width" : "Make half width"}>{item.size === "half" ? <Maximize2 size={16} /> : <Minimize2 size={16} />}</button>
        </div>}
      </div>)}
    </div>
    {editing && <div className="home-widget-edit-footer"><p role="status">{message || "Move, resize, then save when it feels right."}</p><div><button type="button" className="home-edit-cancel" onClick={cancel} disabled={pending}><X size={17} aria-hidden="true" />Cancel</button><button type="button" className="button" onClick={save} disabled={pending}>{pending ? "Saving…" : <><Check size={17} aria-hidden="true" />Save Home</>}</button></div></div>}
  </section>;
}
