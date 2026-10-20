import Link from "next/link";
import { normalizeHomeWidgets } from "@/lib/home-widgets";
import { MemoryHomeControl } from "@/components/memory-home-control";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { notFound } from "next/navigation";
import { findMemory } from "@/lib/memories";
import { requireCouple } from "@/lib/authorization";
import { listMemoryMedia } from "@/lib/media";
import { MemoryPhotoGallery } from "@/components/memory-photo-gallery";

function writtenDate(date: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T12:00:00Z`));
}

export default async function MemoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  const couple = await requireCouple();
  const [memory, media] = await Promise.all([
    findMemory(id),
    listMemoryMedia(couple, id),
  ]);
  if (!memory) notFound();
  return (
    <section className="memory-detail">
      <article className="memory-letter">
        <header className="memory-letter-heading">
          <div className="memory-letter-kicker">
            <Link
              className="memory-inline-back"
              href="/space/memories"
              aria-label="Back to memories"
            >
              <ArrowLeft size={16} strokeWidth={2.35} aria-hidden="true" />
            </Link>
            <p className="eyebrow">
              {memory.isMilestone ? "A CHAPTER IN OUR STORY" : "A MOMENT WE KEPT"}
            </p>
            <span aria-hidden="true" />
          </div>
          <time dateTime={memory.happenedOn}>
            {writtenDate(memory.happenedOn)}
          </time>
          {memory.isMilestone && (
            <span className="memory-letter-milestone">♡ Milestone</span>
          )}
          <h1>{memory.title}</h1>
          {memory.location && (
            <p className="memory-letter-place">
              <MapPin size={16} aria-hidden="true" /> {memory.location}
            </p>
          )}
        </header>
        <div className="memory-letter-rule" aria-hidden="true">
          <span>♡</span>
        </div>
        <div className="memory-letter-body">{memory.body}</div>
        <MemoryPhotoGallery
          photos={media.map((asset) => ({ id: asset.id, alt: asset.alt }))}
        />
        <footer className="memory-letter-footer">
          <p>Kept together, for whenever you want to come back to it.</p>
          <MemoryHomeControl key={couple.homeWidgetsRevision} memoryId={memory.id}
            selected={normalizeHomeWidgets(couple.homeWidgets).find(widget => widget.id === "memory")?.memoryId === memory.id} />
          <Link
            className="memory-edit-link"
            href={`/space/memories/${memory.id}/edit`}
          >
            <Pencil size={17} aria-hidden="true" /> Edit this memory
          </Link>
        </footer>
      </article>
    </section>
  );
}
