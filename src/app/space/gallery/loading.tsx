export default function GalleryLoading() {
  return <section className="shared-gallery" aria-label="Loading gallery" aria-busy="true">
    <span className="sr-only">Loading gallery</span>
    <div className="loading-heading"><span /><span /></div>
    <div className="gallery-album-grid" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <div key={index} className="loading-memory-card" />)}</div>
  </section>;
}
