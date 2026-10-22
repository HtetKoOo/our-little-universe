"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, House } from "lucide-react";
import { setHomeMemory } from "@/app/space/customize/actions";

export function MemoryHomeControl({ memoryId, selected }: { memoryId: string; selected: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [shown, setShown] = useState(selected);
  const [pending, startTransition] = useTransition();
  function update(show: boolean) {
    const previous = shown;
    setShown(show);
    startTransition(async () => {
      try {
        const result = await setHomeMemory(memoryId, show);
        setMessage(result.message);
        if (result.success) { router.refresh(); }
        else setShown(previous);
      } catch {
        setShown(previous);
        setMessage("Couldn’t update Home. Please try again.");
      }
    });
  }
  return <div className="memory-home-control">
    {shown ? <>
      <span className="memory-home-selected"><Check size={16} aria-hidden="true" />Shown on Home</span>
      <div className="memory-home-actions"><Link href="/space">View Home →</Link><button type="button" disabled={pending} onClick={() => update(false)}>{pending ? "Updating…" : "Use automatic selection"}</button></div>
    </> : <button type="button" className="memory-edit-link" disabled={pending} onClick={() => update(true)}><House size={17} aria-hidden="true" />{pending ? "Updating Home…" : "Show on Home"}</button>}
    <span className="memory-home-status" role="status">{message}</span>
  </div>;
}
