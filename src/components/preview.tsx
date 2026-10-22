"use client";
/* eslint-disable @next/next/no-img-element -- demo artwork uses local data URLs and does not need remote optimization. */
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Heart,
  Sparkles,
  Mail,
  BookOpen,
  Images,
  MessageCircleHeart,
  NotebookText,
} from "lucide-react";
import { demoHeartPhotos, demoMemories, demoNotes } from "@/lib/demo";
import { DemoMemoryCards as MemoryCards } from "./demo-v2-memory-cards";
import { DemoGallery } from "./demo-v2-gallery";
import { useDemoV2 } from "./demo-v2-state";
import { demoMemoryPhotos } from "@/lib/demo-v2";
import { demoGalleryPhotos } from "@/lib/demo";
import { formatStorageBytes } from "@/lib/storage-usage";
import { anniversaryStats } from "@/lib/dates";
import { CoupleMainCard } from "@/components/couple-main-card";
const format = (date: string) =>
  new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
function Heading({
  label,
  title,
  description,
}: {
  label: string;
  title: string;
  description: string;
}) {
  return (
    <div className="page-heading">
      <p className="eyebrow">{label}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
export function Preview({
  section,
  today,
  initialMemoryId,
}: {
  section: string;
  today: string;
  initialMemoryId?: string;
}) {
  const { state, dispatch } = useDemoV2();
  const homeMemory = demoMemories.find(memory => memory.id === state.homeMemory) ?? demoMemories[0];
  const homePhotos = state.homePhotos.length ? state.homePhotos.map(id => demoGalleryPhotos.find(photo => photo.id === id)!) : demoGalleryPhotos.slice(0, 3);
  const stats = anniversaryStats("2025-09-14", today);
  const [noteIndex, setNoteIndex] = useState(-1);
  const [openLetter, setOpenLetter] = useState(false);
  const [answer, setAnswer] = useState("");
  const [answered, setAnswered] = useState(false);
  if (section === "home")
    return (
      <>
        <p className="demo-current-note"><Sparkles size={16} /> Interactive preview · fictional sample content</p>
        <section className="demo-current-home">
          <CoupleMainCard
            name="Mira & Theo"
            togetherSince="2025-09-14"
            timezone="Asia/Bangkok"
            initialToday={today}
            photos={demoHeartPhotos}
            text={{ ribbon: "Mira & Theo", heading: "Our days, kept close.", message: "Every little day, a little more us." }}
          />
          <div className="demo-current-shelf">
            <div className="demo-shelf-heading"><p className="eyebrow">A LITTLE CORNER OF US</p><h2>Our little shelf.</h2></div>
            <div className="demo-shelf-grid demo-v2-shelf">
              <Link href="/demo/gallery" className="demo-v2-home-gallery"><div className={`demo-v2-home-photos demo-v2-home-photos-${homePhotos.length}`}>{homePhotos.map(photo => <img key={photo.id} src={photo.src} alt="" />)}</div><p>OUR PHOTOS</p><small>Open gallery →</small></Link>
              <Link href={`/demo/memories?memory=${homeMemory.id}`}><img className="demo-v2-widget-cover" src={demoMemoryPhotos(homeMemory.id, state)[0].src} alt="" /><Heart size={20} /><p>{state.homeMemory ? "A MEMORY WE CHOSE" : "OUR LATEST MEMORY"}</p><h3>{homeMemory.title}</h3><small>Open memories →</small></Link>
              <Link href="/demo/letters"><Mail size={20} /><p>LOVE LETTER</p><h3>A note waiting to be opened.</h3><small>Read letter →</small></Link>
              <Link href="/demo/jar"><Sparkles size={20} /><p>MEMORY JAR</p><h3>Pick a small reminder.</h3><small>Open the jar →</small></Link>
            </div>
          </div>
        </section>
        <div className="section-heading">
          <h2>Little moments, big feelings</h2>
          <Link href="/demo/memories">
            All memories <ArrowRight size={16} />
          </Link>
        </div>
        <p className="swipe-hint">Swipe to explore · Tap a memory to open</p>
        <MemoryCards swipe />
      </>
    );
  if (section === "memories")
    return (
      <>
        <Heading
          label="THE DAYS WE KEEP"
          title="Our memories"
          description="Not every day was a milestone. Every one mattered."
        />
        <MemoryCards key={initialMemoryId ?? "all"} initialMemoryId={initialMemoryId} />
        <p className="sample-hint">
          Open a card to read a sample memory. Adding your own comes after
          private account setup.
        </p>
      </>
    );
  if (section === "questions")
    return <>
      <Heading label="ONE LITTLE QUESTION" title="A shared thought for today." description="Answers open once both people have answered." />
      <section className="demo-question-card">
        <MessageCircleHeart size={29} aria-hidden="true" />
        <p className="eyebrow">TODAY’S QUESTION</p>
        <h2>What small thing made you smile today?</h2>
        <form onSubmit={(event) => { event.preventDefault(); if (answer.trim()) setAnswered(true); }}>
          <label htmlFor="demo-answer">Your answer</label>
          <textarea id="demo-answer" value={answer} onChange={(event) => { setAnswer(event.target.value); setAnswered(false); }} placeholder="Write a little thought…" />
          <button className="button" disabled={!answer.trim()}>{answered ? "Saved in this preview ♡" : "Save my answer"}</button>
        </form>
        <small>{answered ? "Sample answer saved. Your person’s answer stays hidden in demo mode." : "This is a sample interaction. Nothing is saved."}</small>
      </section>
    </>;
  if (section === "notes")
    return <>
      <Heading label="LITTLE NOTES" title="Things to keep close." description="Small reminders, waiting for the right moment." />
      <section className="demo-notes-list">
        {demoNotes.map((note, index) => <article key={note}><NotebookText size={20} /><div><p className="eyebrow">NOTE {index + 1}</p><h2>{note}</h2></div></article>)}
      </section>
    </>;
  if (section === "more")
    return <>
      <Heading label="A FEW MORE LITTLE THINGS" title="More of us." description="Explore the corners of this sample space." />
      <section className="demo-more-links">
        <Link href="/demo/story"><BookOpen size={22} /><span><strong>Our Story</strong><small>Milestones that brought them here.</small></span><ArrowRight size={19} /></Link>
        <Link href="/demo/gallery"><Images size={22} /><span><strong>Gallery</strong><small>Fictional sample moments.</small></span><ArrowRight size={19} /></Link>
        <Link href="/demo/letters"><Mail size={22} /><span><strong>Love Letters</strong><small>A note to open and revisit.</small></span><ArrowRight size={19} /></Link>
        <Link href="/demo/jar"><Sparkles size={22} /><span><strong>Memory Jar</strong><small>Pick a little reminder.</small></span><ArrowRight size={19} /></Link>
        <Link href="/demo/anniversary"><Heart size={22} /><span><strong>Anniversary</strong><small>A day to look forward to.</small></span><ArrowRight size={19} /></Link>
      </section>
      <section className="private-account storage-usage demo-v2-storage"><h2>Photo storage · Sample</h2><dl className="storage-usage-stats"><div><dt>Saved photos</dt><dd>{demoGalleryPhotos.length}</dd></div><div><dt>Saved file size</dt><dd>{formatStorageBytes(demoGalleryPhotos.reduce((total, photo) => total + photo.bytes, 0))}</dd></div></dl><p className="storage-usage-note">Illustrative sample totals, not real account usage. Preview images and bandwidth are not included.</p><button type="button" className="button light" onClick={() => dispatch({ type: "reset" })}>Reset preview choices</button></section>
    </>;
  if (section === "story")
    return (
      <>
        <Heading
          label="HOW WE BECAME US"
          title="Our story"
          description="A few beginnings, and so much still unwritten."
        />
        <div className="timeline">
          {[...demoMemories].reverse().map((m, i) => (
            <article key={m.id}>
              <span className="timeline-number">0{i + 1}</span>
              <p className="eyebrow">{format(m.date)}</p>
              <h2>{m.title}</h2>
              <p>{m.body}</p>
            </article>
          ))}
        </div>
      </>
    );
  if (section === "gallery") return <DemoGallery />;
  if (section === "letters")
    return (
      <>
        <Heading
          label="FROM MY HEART TO YOURS"
          title="Love letters"
          description="The words we want to keep coming back to."
        />
        <button
          className="envelope"
          aria-expanded={openLetter}
          onClick={() => setOpenLetter(!openLetter)}
        >
          <Mail size={36} strokeWidth={1} />
          <span className="eyebrow">A SAMPLE LETTER</span>
          <h2>For an ordinary Tuesday</h2>
          <span>
            {openLetter ? "Fold this letter" : "Open this letter"}{" "}
            <ArrowRight size={16} />
          </span>
        </button>
        {openLetter && (
          <article className="letter-paper">
            <p>My favorite person,</p>
            <p>
              I used to think the best memories had to be big ones. A trip
              somewhere new. A day we planned for months.
            </p>
            <p>
              Then there was you. And now it’s the small things: your laugh from
              the other room, the first sip of coffee, a walk with nowhere to
              be.
            </p>
            <p>Thank you for making ordinary days worth remembering.</p>
            <p>Always, with love ♡</p>
          </article>
        )}
      </>
    );
  if (section === "jar")
    return (
      <>
        <Heading
          label="A LITTLE LOVE, PICKED FOR YOU"
          title="The memory jar"
          description="For the days you need a small reason to smile."
        />
        <section className="jar-panel">
          <Sparkles size={38} strokeWidth={1} />
          <p className="eyebrow">LITTLE REMINDERS OF US</p>
          <blockquote aria-live="polite">
            <span key={noteIndex} className="note-reveal">
              {noteIndex < 0
                ? "A little happiness is waiting in here."
                : demoNotes[noteIndex]}
            </span>
          </blockquote>
          <button
            className="button"
            onClick={() =>
              setNoteIndex((previous) => {
                const choices = demoNotes
                  .map((_, i) => i)
                  .filter((i) => i !== previous);
                return choices[Math.floor(Math.random() * choices.length)];
              })
            }
          >
            {noteIndex < 0 ? "Pick a little note" : "Another little note"}
            <Sparkles size={16} />
          </button>
          <small>3 fictional notes · preview only</small>
        </section>
      </>
    );
  return (
    <>
      <Heading
        label="ANOTHER YEAR, A LITTLE MORE US"
        title="Counting down to us"
        description="Something lovely to look forward to."
      />
      <section className="anniversary-panel">
        <Heart size={36} strokeWidth={1} />
        <strong>{stats.daysUntil}</strong>
        <span className="eyebrow">DAYS UNTIL OUR ANNIVERSARY</span>
        <h2>{format(stats.nextDate)}</h2>
        <p>
          {stats.daysTogether.toLocaleString()} days together, and counting.
        </p>
        <small>
          Sample date: 14 September 2025 · Asia/Bangkok
          <br />
          Calendar days; February 29 is celebrated on February 28 in non-leap
          years.
        </small>
      </section>
    </>
  );
}
