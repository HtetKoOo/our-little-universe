"use client";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const HeartPhotoEditor = dynamic(() => import("./heart-photo-editor").then(module => module.HeartPhotoEditor), {
  loading: () => <p role="status">Opening photo editor…</p>,
});
import type { SavedHeartPhoto } from "@/lib/heart-photo-input";
import { Pencil } from "lucide-react";
import { CoupleMainCard } from "./couple-main-card";
import { defaultCardText, type CardText } from "@/lib/card-text";
import { saveCardText } from "@/app/space/customize/actions";
import styles from "./inline-card-editor.module.css";
export function EditableCoupleCard({
  text,
  revision,
  photos,
  photoRevision,
  photoReady,
  uploadsEnabled,
  ...props
}: {
  text: CardText;
  revision: number;
  photos: SavedHeartPhoto[];
  photoRevision: number;
  photoReady: boolean;
  uploadsEnabled: boolean;
  name: string;
  togetherSince: string;
  timezone: string;
  initialToday: string;
}) {
  const [photoEditing, setPhotoEditing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [saved, setSaved] = useState(text);
  const [version, setVersion] = useState(revision);
  const pencil = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const [state, action, pending] = useActionState(
    async (_previous: { message: string }, form: FormData) => {
      const result = await saveCardText({ message: "" }, form);
      if (result.success) {
        setSaved({ ...draft });
        setVersion(result.revision!);
        setEditing(false);
        router.refresh();
      }
      return { message: result.message };
    },
    { message: "" },
  );
  const field = (key: keyof CardText, label: string, max: number) => (
    <input
      type="text"
      className={`${styles.field} ${styles[key]}`}
      name={key}
      aria-label={label}
      value={draft[key]}
      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
      maxLength={max}
      required
      disabled={pending}
      autoFocus={key === "ribbon"}
      spellCheck={key !== "ribbon"}
    />
  );
  return (
    <>
    <form action={action} className={styles.form}>
      <input type="hidden" name="revision" value={version} />
      <CoupleMainCard
        {...props}
        text={saved}
        photos={photos.map((photo) => ({src:`/api/heart-photo/${photo.id}`,alt:"Our heart photo",width:photo.width,height:photo.height,crop:photo.crop}))}
        onEditPhoto={!photos.length && !pending ? () => setPhotoEditing(true) : undefined}
        controls={
          !editing ? (
            <button
              ref={pencil}
              type="button"
              className={styles.pencil}
              aria-label="Customize card"
              title="Customize card"
              onClick={() => {
                setDraft(saved);
                setEditing(true);
              }}
            >
              <Pencil size={17} aria-hidden="true" />
            </button>
          ) : (
            <span className={styles.badge}>Editing</span>
          )
        }
        editor={
          editing
            ? {
                ribbon: field("ribbon", "Ribbon names", 32),
                heading: field("heading", "Main heading", 70),
                message: field("message", "Your little message", 160),
              }
            : undefined
        }
        footer={
          editing ? (
            <div className={styles.footer}>
              <p className={styles.hint}>
                Save updates the words on this card.
              </p>
              <p role="status">{state.message}</p>
              <button
                className={styles.photoAction}
                type="button"
                disabled={pending}
                onClick={() => setPhotoEditing(true)}
              >
                {photos.length ? `Manage heart photos (${photos.length}/3)` : "Add heart photos"}
              </button>
              <div className={styles.actions}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setDraft(saved);
                    setEditing(false);
                    requestAnimationFrame(() => pencil.current?.focus());
                  }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={pending}>
                  {pending ? "Saving…" : "Save"}
                </button>
              </div>
              <button
                className={styles.reset}
                type="button"
                disabled={pending}
                onClick={() => setDraft({ ...defaultCardText })}
              >
                Reset to default
              </button>
            </div>
          ) : undefined
        }
      />
    </form>
    {photoEditing && <HeartPhotoEditor ready={photoReady} uploadsEnabled={uploadsEnabled} photos={photos} revision={photoRevision} onClose={() => setPhotoEditing(false)} onSaved={() => {setPhotoEditing(false); router.refresh();}} />}
    </>
  );
}
