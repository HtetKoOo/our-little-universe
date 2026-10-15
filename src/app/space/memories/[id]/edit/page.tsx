import { notFound } from "next/navigation";
import { findMemory } from "@/lib/memories";
import { requireCouple } from "@/lib/authorization";
import { listMediaAssets, listMemoryMedia } from "@/lib/media";
import { MemoryForm } from "@/components/memory-form";
export default async function EditMemory({params}: {params:Promise<{id:string}>}) {
  const id = (await params).id;
  const couple = await requireCouple();
  const [memory, assets, attached] = await Promise.all([findMemory(id), listMediaAssets(couple), listMemoryMedia(couple, id)]);
  if (!memory) notFound();
  return <><p className="eyebrow">OUR MEMORIES</p><h1>A little more to remember.</h1><MemoryForm mode="edit" assets={[...assets, ...attached.filter(photo => !assets.some(asset => asset.id === photo.id))]} memory={{id:memory.id,title:memory.title,body:memory.body,happenedOn:memory.happenedOn,location:memory.location,isMilestone:memory.isMilestone,assetIds:attached.map((asset) => asset.id)}} /></>;
}
