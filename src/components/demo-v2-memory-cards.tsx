"use client";
/* eslint-disable @next/next/no-img-element -- fictional local artwork. */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Check, House, X } from "lucide-react";
import { demoMemories } from "@/lib/demo";
import { demoMemoryPhotos } from "@/lib/demo-v2";
import { useDemoV2 } from "./demo-v2-state";
export function DemoMemoryCards({ swipe = false, initialMemoryId }: { swipe?: boolean; initialMemoryId?: string }) {
  const { state, dispatch } = useDemoV2();
  const [selected, setSelected] = useState<(typeof demoMemories)[number] | null>(() => demoMemories.find(memory => memory.id === initialMemoryId) ?? null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (selected && !dialog.current?.open) dialog.current?.showModal(); }, [selected]);
  return <>
    <div className={swipe ? "memory-grid swipe-memories" : "memory-grid"}>
      {demoMemories.map(memory => <button type="button" className="memory-card" key={memory.id} onClick={() => { setSelected(memory); }}>
        <div className="memory-cover demo-v2-memory-cover"><img src={demoMemoryPhotos(memory.id, state)[0].src} alt="" /><span className="cover-label">{memory.category}</span></div>
        <div className="memory-info"><small>{memory.date}</small><h3>{memory.title}</h3><span>{memory.location}</span></div>
      </button>)}
    </div>
    <dialog ref={dialog} className="detail demo-v2-memory-dialog" aria-label={selected?.title ?? "Sample memory"} onClose={() => setSelected(null)}>
      {selected && <div>
        <button type="button" className="close" aria-label="Close memory" onClick={() => dialog.current?.close()}><X /></button>
        <p className="eyebrow">A SAMPLE MEMORY</p><h2>{selected.title}</h2><small>{selected.date} · {selected.location}</small><p className="memory-body">{selected.body}</p>
        <p className="media-help">Choose a cover. Changes stay in this demo tab.</p>
        <div className="demo-cover-picker">{demoMemoryPhotos(selected.id, state).slice(0, 6).map((photo, index) => <button type="button" key={photo.id} aria-pressed={index === 0} onClick={() => dispatch({ type: "cover", id: photo.id, memoryId: selected.id })}>
          <img src={photo.src} alt={photo.alt} /><span>{index === 0 ? "✓ Cover" : "Set as cover"}</span>
        </button>)}</div>
        <div className="demo-v2-memory-actions"><button type="button" className="button light" onClick={() => dispatch({ type: "home-memory", id: state.homeMemory === selected.id ? null : selected.id })}>
          {state.homeMemory === selected.id ? <Check size={17} /> : <House size={17} />}{state.homeMemory === selected.id ? "Shown on Home · Use automatic" : "Show on Home"}
        </button><Link href="/demo" className="quiet-link" onClick={() => dialog.current?.close()}>View Home →</Link></div>
      </div>}
    </dialog>
  </>;
}
