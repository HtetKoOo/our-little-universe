import { Suspense } from "react";
import { MemoryRowsLoading } from "@/components/route-loading";
import { MemoryList } from "@/components/memory-list";
import { pageNumber } from "@/lib/memory-input";
export default function Story({searchParams}: {searchParams:Promise<{page?:string}>}) {
  return <><p className="eyebrow">ONE CHAPTER AT A TIME</p><h1>Our Story.</h1><p>The milestones that brought us here, newest first.</p><Suspense fallback={<MemoryRowsLoading story={true} />}><Rows searchParams={searchParams} /></Suspense></>;
}

async function Rows({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  return <MemoryList story page={pageNumber((await searchParams).page)} />;
}
