import { LettersIntro } from "@/components/letters-intro";
import Link from "next/link";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { PenLine } from "lucide-react";
import { requireCouple } from "@/lib/authorization";
import { getDb } from "@/lib/db";
import { letterReads, letters } from "@/lib/db/schema";
import { LoveLetterComposer } from "@/components/love-letter-composer";

export default async function LettersPage() {
  const actor = await requireCouple(); const db = getDb();
  const [received, written] = await Promise.all([
    db.select({ id: letters.id, title: letters.title, body: letters.body, createdAt: letters.createdAt, readAt: letterReads.readAt }).from(letters).leftJoin(letterReads, and(eq(letterReads.letterId, letters.id), eq(letterReads.readBy, actor.userId))).where(and(eq(letters.coupleId, actor.coupleId), ne(letters.createdBy, actor.userId))).orderBy(desc(letters.createdAt)),
    db.select({ id: letters.id, title: letters.title, createdAt: letters.createdAt, read: sql<boolean>`exists(select 1 from letter_reads where letter_reads.letter_id=${letters.id})` }).from(letters).where(and(eq(letters.coupleId, actor.coupleId), eq(letters.createdBy, actor.userId))).orderBy(desc(letters.createdAt)),
  ]);
  const unread = received.filter((letter) => !letter.readAt).length;
  return <section className="love-letters"><LettersIntro />
    {unread > 0 && <p className="letter-unread"><b>{unread}</b> {unread === 1 ? "letter is" : "letters are"} waiting for you.</p>}
    <div className="letters-layout"><LoveLetterComposer /><section className="letter-list"><p className="eyebrow">FROM YOUR PERSON</p><h2>Waiting to be opened.</h2>{received.length ? <div className="letter-stack">{received.map((letter) => <Link key={letter.id} href={`/space/letters/${letter.id}`} className={`letter-preview ${letter.readAt ? "is-read" : "is-unread"}`}><small>{letter.readAt ? "READ" : "NEW LETTER"}</small><strong>{letter.title}</strong><span>{letter.body}</span><b>Open letter →</b></Link>)}</div> : <p className="letter-empty">No letter is waiting yet. Give your person a little time to write one.</p>}</section></div>
    <section className="letters-written"><p className="eyebrow">YOUR SENT LETTERS</p>{written.length ? written.map((letter) => <div key={letter.id}><PenLine size={15} aria-hidden="true" /><span><b>{letter.title}</b><small>{letter.read ? "Read by your person" : "Still waiting to be opened"}</small></span></div>) : <p>You haven’t sent a letter yet.</p>}</section>
  </section>;
}
