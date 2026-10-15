"use client";
/* eslint-disable @next/next/no-img-element */
import { prepareDuplicatePhotoCheck, uploadSharedPhoto } from "@/lib/media-upload-client";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { defaultCrop, MAX_HEART_PHOTOS, MAX_PHOTO_BYTES, photoGeometry, type SavedHeartPhoto } from "@/lib/heart-photo-input";
import type { LibraryAsset } from "./media-picker";
import styles from "./heart-photo-editor.module.css";

export function HeartPhotoEditor({ library, photos: initialPhotos, revision, ready, uploadsEnabled, onClose, onSaved }: { library: LibraryAsset[]; ready: boolean; uploadsEnabled: boolean; photos: SavedHeartPhoto[]; revision: number; onClose: () => void; onSaved: () => void }) {
  const id = useId(); const fileInput = useRef<HTMLInputElement>(null);
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  const [photos] = useState(initialPhotos); const [selected, setSelected] = useState(0);
  const [candidate, setCandidate] = useState<{file: File; src: string; width: number; height: number; check: ReturnType<typeof prepareDuplicatePhotoCheck>} | null>(null);
  const [crop, setCrop] = useState(initialPhotos[0]?.crop ?? defaultCrop); const [pending, setPending] = useState(false); const [message, setMessage] = useState("");
  const selectionVersion = useRef(0);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    return () => { selectionVersion.current += 1; };
  }, []);
  const candidateSrc = candidate?.src;
  useEffect(() => {
    if (!candidateSrc) return;
    return () => URL.revokeObjectURL(candidateSrc);
  }, [candidateSrc]);
  const current = candidate ? candidate : photos[selected] ? { ...photos[selected], src: `/api/heart-photo/${photos[selected].id}` } : null;
  function select(index: number) { selectionVersion.current += 1; setCandidate(null); setSelected(index); setCrop(photos[index].crop); setMessage(""); }
  function choose(file: File | undefined) {
    if (!file || pending) return;
    const version = ++selectionVersion.current;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > MAX_PHOTO_BYTES) {
      setMessage("Choose a JPG, PNG or WebP photo under 8 MB.");
      return;
    }
    // Hashing/network lookup runs alongside image decoding and crop editing.
    const check = prepareDuplicatePhotoCheck(file);
    const src = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      if (version !== selectionVersion.current) { URL.revokeObjectURL(src); return; }
      if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 40000000) {
        URL.revokeObjectURL(src);
        setMessage("Choose a photo smaller than 40 megapixels.");
        return;
      }
      setCandidate({ file, src, width: image.naturalWidth, height: image.naturalHeight, check });
      setCrop(defaultCrop);
      setMessage("");
    };
    image.onerror = () => {
      URL.revokeObjectURL(src);
      if (version === selectionVersion.current) setMessage("This photo couldn’t be opened.");
    };
    image.src = src;
  }

  async function patch(next: SavedHeartPhoto[]) { setPending(true); setMessage(""); try { const response=await fetch("/api/heart-photo",{method:"PATCH",signal:AbortSignal.timeout(30000),headers:{"Content-Type":"application/json"},body:JSON.stringify({revision,photos:next})});const result=await response.json();if(!response.ok)throw new Error(result.message??"Couldn’t save.");onSaved(); } catch(error){setMessage(error instanceof Error?error.message:"Couldn’t save.");} finally{setPending(false);} }
  async function add() {
    if (!candidate || pending) return;
    setPending(true); setChecking(true); setMessage("");
    try {
      const result = await uploadSharedPhoto(candidate.file,candidate.check,stage=>setChecking(stage==="checking"));
      setChecking(false);
      const asset = result.asset;
      if (photos.some(photo=>photo.id===asset.id)) { setMessage("This photo is already on your main card."); return; }
      if (!asset.width || !asset.height) throw new Error("This photo could not be opened.");
      await patch([...photos,{id:asset.id,width:asset.width,height:asset.height,format:asset.format as SavedHeartPhoto["format"],crop}]);
    } catch(error) {
      setCandidate(current=>current===candidate?{...current,check:prepareDuplicatePhotoCheck(current.file)}:current);
      setMessage(error instanceof Error?error.message:"Couldn’t add this photo.");
    } finally { setChecking(false); setPending(false); }
  }

  if (!mounted) return null;
  return createPortal(<div className={styles.backdrop} role="presentation"><section className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby={`${id}-title`}>
    <div className={styles.heading}><h2 id={`${id}-title`}>Our heart photos</h2><button type="button" onClick={onClose} disabled={pending} aria-label="Close photo editor">×</button></div>
    <p className={styles.hint}>Choose up to three photos for Home. Removing one here keeps it in Gallery.</p>
    <div className={styles.thumbRow}>{photos.map((photo,index)=><button key={photo.id} type="button" className={index===selected&&!candidate?styles.selectedThumb:styles.thumb} onClick={()=>select(index)} disabled={pending} aria-label={`Edit photo ${index+1}`}><img src={`/api/heart-photo/${photo.id}`} alt="" /></button>)}{photos.length<MAX_HEART_PHOTOS&&<button type="button" className={styles.addThumb} onClick={()=>fileInput.current?.click()} disabled={pending||!ready||!uploadsEnabled}>＋</button>}</div>
    {photos.length<MAX_HEART_PHOTOS&&<details><summary>Choose from Gallery</summary><div className={styles.library}>{library.filter(asset=>!photos.some(photo=>photo.id===asset.id)).map(asset=><button type="button" key={asset.id} disabled={pending||!ready} onClick={()=>{if(asset.width&&asset.height)void patch([...photos,{id:asset.id,width:asset.width,height:asset.height,format:asset.format as SavedHeartPhoto["format"],crop:defaultCrop}]);}} aria-label="Add gallery photo to main card"><img src={`/api/media/${asset.id}`} alt="Gallery photo" loading="lazy" /></button>)}</div></details>}
    {current&&<svg className={styles.preview} viewBox="0 0 240 220" role="img" aria-label="Heart photo preview"><defs><clipPath id={`${id}-heart`}><path d="M120 204C100 187 20 132 14 78C8 22 80 1 120 48C160 1 232 22 226 78C220 132 140 187 120 204Z" /></clipPath></defs><g clipPath={`url(#${id}-heart)`}><rect width="240" height="220" fill="#f6d3df" /><image href={current.src} {...photoGeometry(current.width,current.height,crop)} preserveAspectRatio="none" /></g></svg>}
    {!current&&<p className={styles.empty}>Add up to three photos for your heart slideshow.</p>}
    {photos.length<MAX_HEART_PHOTOS&&<><button className={styles.file} type="button" disabled={pending||!ready||!uploadsEnabled} onClick={()=>fileInput.current?.click()}><span>{candidate?"Choose a different photo":"Add a photo"}</span><small>JPG, PNG or WebP · up to 8 MB</small></button><input ref={fileInput} className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{choose(e.target.files?.[0]);e.target.value="";}} /></>}
    {current&&<fieldset disabled={pending} className={styles.adjust}><legend>Adjust this photo</legend>{([['zoom','Zoom',1,3,.05],['x','Horizontal position',0,100,1],['y','Vertical position',0,100,1]] as const).map(([key,label,min,max,step])=><label key={key}><span>{label}</span><input type="range" min={min} max={max} step={step} value={crop[key]} onChange={e=>setCrop({...crop,[key]:Number(e.target.value)})}/></label>)}</fieldset>}
    <p role="status" className={styles.status}>{message}</p><div className={styles.actions}><button type="button" onClick={onClose} disabled={pending}>Cancel</button>{candidate?<button type="button" onClick={()=>void add()} disabled={pending}>{pending?(checking?"Checking photo…":"Adding…"):"Add photo"}</button>:current?<button type="button" onClick={()=>void patch(photos.map((photo,index)=>index===selected?{...photo,crop}:photo))} disabled={pending}>{pending?"Saving…":"Save adjustment"}</button>:null}</div>
    {current&&!candidate&&<div className={styles.manage}><button type="button" disabled={pending||selected===0} onClick={()=>{const next=[...photos];[next[selected-1],next[selected]]=[next[selected],next[selected-1]];void patch(next);}}>Move left</button><button type="button" disabled={pending||selected===photos.length-1} onClick={()=>{const next=[...photos];[next[selected+1],next[selected]]=[next[selected],next[selected+1]];void patch(next);}}>Move right</button><button type="button" disabled={pending} onClick={()=>void patch(photos.filter((_,index)=>index!==selected))}>Remove photo</button></div>}
  </section></div>,document.body);
}
