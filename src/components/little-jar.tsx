"use client";

import { useActionState } from "react";
import { Sparkles } from "lucide-react";
import { openJarNote, reactToJarNote, tuckJarNote, type JarActionState } from "@/app/space/jar/actions";
import { jarOpenWhenOptions } from "@/lib/jar-input";

const empty: JarActionState = { message: "" };
const writerLabel = (value: string) => value === "miss me" ? "they miss you" : value === "need a smile" ? "they need a smile" : value === "today feels heavy" ? "today feels heavy" : value === "a quiet night" ? "it’s a quiet night" : "just because";
const openerLabel = (value: string) => value === "miss me" ? "you miss them" : value === "need a smile" ? "you need a smile" : value === "today feels heavy" ? "today feels heavy" : value === "a quiet night" ? "it’s a quiet night" : "just because";

type Opened = { id: string; body: string; openWhen: string | null; reaction: "heart" | "hug" | "smile" | null };

export function LittleJar({ waitingCount, tuckedCount, recentOpened, loading = false }: { loading?: boolean; waitingCount: number; tuckedCount: number; recentOpened: Opened[] }) {
  const [tuckState, tuckAction, tuckPending] = useActionState(tuckJarNote, empty);
  const [openState, openAction, openPending] = useActionState(openJarNote, empty);
  const [reactionState, reactionAction, reactionPending] = useActionState(reactToJarNote, empty);
  const opened = openState.opened ?? recentOpened[0] ?? null;

  return <section className="little-jar" aria-busy={loading || undefined}>
    <div className="jar-intro">
      <div className="jar-icon"><Sparkles aria-hidden="true" /></div>
      <div><p className="eyebrow">A LITTLE JAR FOR US</p><h1>Small surprises, saved close.</h1><p>Write from this moment. Let your person discover it in another one.</p></div>
    </div>

    <div className="jar-status" aria-live="polite"><span><b>{loading ? <span className="route-data-placeholder">&nbsp;</span> : waitingCount}</b> {waitingCount === 1 ? "little surprise" : "little surprises"} waiting for you</span><span><b>{loading ? <span className="route-data-placeholder">&nbsp;</span> : tuckedCount}</b> of yours still tucked away</span></div>

    <div className="jar-grid">
      <section className="jar-card jar-write-card"><p className="eyebrow">LEAVE A LITTLE NOTE</p><h2>For a day they might need it.</h2>
        <form action={tuckAction}><fieldset disabled={loading || tuckPending}><label htmlFor="jar-body">What do you want them to find?</label><textarea id="jar-body" name="body" required maxLength={500} rows={5} placeholder="A small thought from right now…" />
          <label htmlFor="jar-open-when">Open when <span>(optional)</span></label><select id="jar-open-when" name="openWhen" defaultValue=""><option value="">Whenever it finds them</option>{jarOpenWhenOptions.map((option) => <option key={option} value={option}>{writerLabel(option)}</option>)}</select>
          <button className="button" type="submit">{tuckPending ? "Tucking it away…" : "Tuck it into the jar ♡"}</button></fieldset></form><p role="status" className="form-status">{tuckState.message}</p>
      </section>

      <section className="jar-card jar-open-card"><p className="eyebrow">OPEN A LITTLE NOTE</p><h2>Let a small surprise find you.</h2>
        <form action={openAction}><fieldset disabled={loading || openPending}><label htmlFor="jar-feeling">What do you need right now?</label><select id="jar-feeling" name="openWhen" defaultValue=""><option value="">A random little surprise</option>{jarOpenWhenOptions.map((option) => <option key={option} value={option}>When {openerLabel(option)}</option>)}</select><button className="button light" type="submit">{openPending ? "Finding one…" : "Open the jar ✨"}</button></fieldset></form><p role="status" className="form-status">{openState.message}</p>

        {opened && <article className="jar-note-reveal"><small>{opened.openWhen ? `OPEN WHEN ${opened.openWhen.toUpperCase()}` : "A LITTLE NOTE FOR YOU"}</small><blockquote>{opened.body}</blockquote><form action={reactionAction} className="jar-reactions"><input type="hidden" name="noteId" value={opened.id} /><span>Send a little feeling back</span>{([['heart','♡'],['hug','⌁'],['smile','☻']] as const).map(([reaction, icon]) => <button key={reaction} name="reaction" value={reaction} type="submit" disabled={reactionPending} aria-label={`Send ${reaction}`}>{icon}</button>)}</form><p role="status" className="form-status">{reactionState.message}</p></article>}
      </section>
    </div>
  </section>;
}
