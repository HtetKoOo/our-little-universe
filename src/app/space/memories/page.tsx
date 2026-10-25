import { Suspense } from "react";
import { MemoryRowsLoading } from "@/components/route-loading";
import Link from "next/link";
import { MemoryList } from "@/components/memory-list";
import { pageNumber } from "@/lib/memory-input";

export default function MemoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return <>
    <div className="private-heading memory-page-heading">
      <div><p className="eyebrow">THE DAYS WE KEEP</p><h1>Our memories.</h1><p className="memory-page-intro">Little days, lovely details, all kept close.</p></div>
      <Link className="button" href="/space/memories/new">+ Keep a memory</Link>
    </div>
    <Suspense fallback={<MemoryRowsLoading story={false} />}><Rows searchParams={searchParams} /></Suspense>
  </>;
}

async function Rows({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <MemoryList page={pageNumber((await searchParams).page)} />;
}
