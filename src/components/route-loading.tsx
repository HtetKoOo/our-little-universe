import Link from "next/link";
import { ArrowLeft, Heart, LockKeyhole, Mail, MessageCircleHeart, HeartHandshake } from "lucide-react";

export function DataPlaceholder({ wide = false }: { wide?: boolean }) {
  return <span className={`route-data-placeholder${wide ? " route-data-wide" : ""}`} aria-hidden="true">&nbsp;</span>;
}
export function MemoryRowsLoading({ story = false }: { story?: boolean }) {
  return <div className={story ? "private-timeline" : "memory-month-list"} role="status" aria-label="Loading memories" aria-busy="true">
    {!story && <div className="memory-month"><h2><DataPlaceholder /></h2></div>}
    <div className={story ? undefined : "memory-card-stack"}>{[0, 1].map(i => story ? <div className="private-memory" key={i}><div className="memory-meta"><DataPlaceholder /></div><h2><DataPlaceholder wide /></h2><p><DataPlaceholder wide /></p><span className="memory-open">Open memory →</span></div> : <div className="memory-card memory-card-photo" key={i}>
      <span className="memory-cover route-photo-placeholder" aria-hidden="true">♡</span>
      <span className="memory-card-content"><span className="memory-card-meta"><DataPlaceholder /></span><strong><DataPlaceholder wide /></strong><span className="memory-card-body"><DataPlaceholder wide /></span><span className="memory-card-open">Open memory →</span></span>
    </div>)}</div>
  </div>;
}
export function MemoriesLoading({ story = false }: { story?: boolean }) {
  return <>{story ? <><p className="eyebrow">ONE CHAPTER AT A TIME</p><h1>Our Story.</h1><p>The milestones that brought us here, newest first.</p></> : <div className="private-heading memory-page-heading"><div><p className="eyebrow">THE DAYS WE KEEP</p><h1>Our memories.</h1><p className="memory-page-intro">Little days, lovely details, all kept close.</p></div><Link className="button" href="/space/memories/new">+ Keep a memory</Link></div>}<MemoryRowsLoading story={story} /></>;
}
export function QuestionLoading() {
  return <section className="little-question-card" role="status" aria-label="Loading question" aria-busy="true"><div className="question-icon"><MessageCircleHeart aria-hidden="true" /></div><p className="eyebrow">ONE LITTLE QUESTION</p><blockquote><DataPlaceholder wide /><br /><DataPlaceholder /></blockquote><p className="question-rule"><LockKeyhole size={15} aria-hidden="true" /> Both answers open when you’ve both answered.</p><div className="question-answer-form"><label htmlFor="loading-question-answer">Your answer</label><textarea id="loading-question-answer" rows={5} disabled aria-label="Loading your answer" /><div className="question-actions"><button className="button" disabled>Keep my answer</button></div></div><p className="question-status" /></section>;
}
export function MemoryFormLoading({ edit = false }: { edit?: boolean }) {
  return <><p className="eyebrow">{edit ? "OUR MEMORIES" : "A MOMENT FOR US"}</p><h1>{edit ? "A little more to remember." : "Keep a memory."}</h1>{!edit && <p>It doesn’t have to be a big day to matter.</p>}<div className="private-form" role="status" aria-label="Loading memory form" aria-busy="true"><fieldset disabled>
    <label htmlFor="loading-title">Give it a name</label><input id="loading-title" /><small className="field-error" />
    <label htmlFor="loading-date">When was it?</label><input id="loading-date" type="date" /><small className="field-error" />
    <label htmlFor="loading-body">The part you want to keep</label><textarea id="loading-body" rows={8} /><small className="field-error" />
    <label htmlFor="loading-location">Where? <span>(optional)</span></label><input id="loading-location" /><small className="field-error" />
    <label className="check-row"><input type="checkbox" /> <span>A milestone in Our Story</span></label><button className="button light" disabled>Add photos</button><div className="memory-save-panel"><p>{edit ? "This saves your words and selected photos together." : "When you’re ready, this saves the words and selected photos together."}</p><button className="button" disabled>{edit ? "Save changes" : "Keep this memory ♡"}</button></div>
  </fieldset></div></>;
}
export function MemoryDetailLoading() {
  return <section className="memory-detail" role="status" aria-label="Loading memory" aria-busy="true"><article className="memory-letter"><header className="memory-letter-heading"><div className="memory-letter-kicker"><Link className="memory-inline-back" href="/space/memories" aria-label="Back to memories"><ArrowLeft size={16} /></Link><p className="eyebrow"><DataPlaceholder /></p><span /></div><time><DataPlaceholder /></time><h1><DataPlaceholder wide /></h1></header><div className="memory-letter-rule" aria-hidden="true"><span>♡</span></div><div className="memory-letter-body"><DataPlaceholder wide /><br /><DataPlaceholder wide /><br /><DataPlaceholder /></div></article></section>;
}
export function LetterDetailLoading() {
  return <section className="letter-detail" role="status" aria-label="Loading letter" aria-busy="true"><Link href="/space/letters" className="quiet-link">← Back to letters</Link><article><span className="letter-seal"><Mail aria-hidden="true" /></span><p className="eyebrow"><DataPlaceholder /></p><h1><DataPlaceholder wide /></h1><time><DataPlaceholder /></time><div className="letter-body"><DataPlaceholder wide /><br /><DataPlaceholder wide /><br /><DataPlaceholder /></div></article></section>;
}
export function QuestionHistoryLoading({ detail = false }: { detail?: boolean }) {
  if (detail) return <section className="question-history-detail" role="status" aria-label="Loading saved answers" aria-busy="true"><article><div className="question-history-detail-kicker"><Link className="question-history-inline-back" href="/space/questions/history" aria-label="Back to our answers"><ArrowLeft size={16} /></Link><p className="eyebrow">ANSWERED TOGETHER</p><span /></div><span className="question-history-detail-icon"><HeartHandshake /></span><time><DataPlaceholder /></time><h1><DataPlaceholder wide /></h1><div className="question-history-detail-answers">{["Your answer", "Your person’s answer"].map(label => <section key={label}><small>{label}</small><p><DataPlaceholder wide /><br /><DataPlaceholder /></p></section>)}</div></article></section>;
  return <section className="question-history-page" role="status" aria-label="Loading saved answers" aria-busy="true"><Link className="question-history-page-back" href={detail ? "/space/questions/history" : "/space/questions"} aria-label="Back to questions"><ArrowLeft size={16} /></Link><header><h1>{detail ? <DataPlaceholder wide /> : <>Our little answers.<span className="question-history-count"><Heart fill="currentColor" /><DataPlaceholder /></span></>}</h1></header><div className="question-history-cards">{[0, 1].map(i => <div className="question-history-card" key={i}><time><DataPlaceholder /></time><h2><DataPlaceholder wide /></h2><p><DataPlaceholder wide /></p></div>)}</div></section>;
}
