"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { saveMemory, saveCouple, saveBirthday } from "@/app/space/actions";
import type { ActionState } from "@/lib/memory-input";
import { MediaPicker, type LibraryAsset } from "./media-picker";
const initial: ActionState = {message: ""};
type MemoryValues = {id: string; title: string; body: string; happenedOn: string; location: string | null; isMilestone: boolean; assetIds?: string[]};
export function MemoryForm({memory, mode, assets}: {memory: MemoryValues; mode: "create" | "edit"; assets: LibraryAsset[]}) {
  const [state, action, pending] = useActionState(saveMemory, initial);
  const [draft, setDraft] = useState(memory);
  const [photosUploading, setPhotosUploading] = useState(false);
  const error = (key: string) => state.errors?.[key]?.join(" ");
  // Controlled fields preserve a draft after a rejected server action.
  return <form action={action} className="private-form" onSubmit={event => { if (photosUploading) event.preventDefault(); }}>
    <input type="hidden" name="id" value={memory.id} />
    <input type="hidden" name="mode" value={mode} />
    <fieldset disabled={pending}>
      <label htmlFor="title">Give it a name</label>
      <input id="title" name="title" value={draft.title} onChange={e => setDraft({...draft, title: e.target.value})} maxLength={120} required aria-invalid={!!error("title")} aria-describedby="title-error" placeholder="That evening by the river" />
      <small id="title-error" className="field-error">{error("title")}</small>
      <label htmlFor="happenedOn">When was it?</label>
      <input id="happenedOn" type="date" name="happenedOn" value={draft.happenedOn} onChange={e => setDraft({...draft, happenedOn: e.target.value})} required aria-invalid={!!error("happenedOn")} aria-describedby="date-error" />
      <small id="date-error" className="field-error">{error("happenedOn")}</small>
      <label htmlFor="body">The part you want to keep</label>
      <textarea id="body" name="body" value={draft.body} onChange={e => setDraft({...draft, body: e.target.value})} rows={8} maxLength={10000} required aria-invalid={!!error("body")} aria-describedby="body-error" placeholder="What made this moment special?" />
      <small id="body-error" className="field-error">{error("body")}</small>
      <label htmlFor="location">Where? <span>(optional)</span></label>
      <input id="location" name="location" value={draft.location ?? ""} onChange={e => setDraft({...draft, location: e.target.value})} maxLength={160} aria-invalid={!!error("location")} aria-describedby="location-error" placeholder="Our favourite café" />
      <small id="location-error" className="field-error">{error("location")}</small>
      <label className="check-row"><input type="checkbox" name="isMilestone" checked={draft.isMilestone} onChange={e => setDraft({...draft, isMilestone: e.target.checked})} /> <span>A milestone in Our Story</span></label>
      <MediaPicker assets={assets} selectedIds={memory.assetIds} onUploadingChange={setPhotosUploading} />
      <div className="memory-save-panel">
        <p>{mode === "create" ? "When you’re ready, this saves the words and selected photos together." : "This saves your words and selected photos together."}</p>
        <button id="memory-save" className="button" type="submit" disabled={photosUploading}>{photosUploading ? "Wait for photos…" : pending ? "Saving…" : mode === "create" ? "Keep this memory ♡" : "Save changes"}</button>
      </div>
    </fieldset>
    <p role="status" className="form-status">{state.message}</p>
    <Link className="quiet-link" href={mode === "edit" ? `/space/memories/${memory.id}` : "/space"}>Cancel</Link>
  </form>;
}
export function CoupleForm({couple}: {couple: {name: string; togetherSince: string; timezone: string}}) {
  const [state, action, pending] = useActionState(saveCouple, initial);
  const [draft, setDraft] = useState(couple);
  return <form action={action} className="private-form">
    <fieldset disabled={pending}>
      <label htmlFor="name">Our space name</label>
      <input id="name" name="name" value={draft.name} onChange={e => setDraft({...draft, name: e.target.value})} required maxLength={100} />
      <small className="field-error">{state.errors?.name?.join(" ")}</small>
      <label htmlFor="togetherSince">Together since</label>
      <input id="togetherSince" name="togetherSince" type="date" value={draft.togetherSince} onChange={e => setDraft({...draft, togetherSince: e.target.value})} required />
      <small className="field-error">{state.errors?.togetherSince?.join(" ")}</small>
      <label htmlFor="timezone">Our timezone</label>
      <input id="timezone" name="timezone" list="timezones" value={draft.timezone} onChange={e => setDraft({...draft, timezone: e.target.value})} required aria-describedby="timezone-help" />
      <datalist id="timezones"><option value="Asia/Bangkok"/><option value="Asia/Yangon"/><option value="Asia/Singapore"/><option value="UTC"/></datalist>
      <small id="timezone-help">Used for today’s date and our anniversary countdown.</small>
      <small className="field-error">{state.errors?.timezone?.join(" ")}</small>
      <button className="button">{pending ? "Saving…" : "Save our details"}</button>
    </fieldset>
    <p role="status" className="form-status">{state.message}</p>
  </form>;
}

export function BirthdayForm({ birthday }: { birthday: string | null }) {
  const [state, action, pending] = useActionState(saveBirthday, initial);
  const [draft, setDraft] = useState(birthday ?? "");
  return <form action={action} className="private-form">
    <fieldset disabled={pending}>
      <label htmlFor="birthday">Your birthday <span>(private)</span></label>
      <input id="birthday" name="birthday" type="date" value={draft} onChange={e => setDraft(e.target.value)} aria-describedby="birthday-help" />
      <small id="birthday-help">Used only to send a birthday email to you and your person.</small>
      <small className="field-error">{state.errors?.birthday?.join(" ")}</small>
      <button className="button">{pending ? "Saving…" : "Save my birthday"}</button>
    </fieldset>
    <p role="status" className="form-status">{state.message}</p>
  </form>;
}
