export function SectionLoading() {
  return <section aria-label="Loading page" aria-busy="true" className="section-loading">
    <span className="sr-only">Loading page…</span>
    <span className="loading-line loading-overline" />
    <span className="loading-line loading-title" />
    <div className="loading-card"><span className="loading-line loading-copy" /><span className="loading-line loading-copy" /></div>
  </section>;
}
