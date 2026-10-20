import Link from "next/link";
import { BookHeart, Images, Settings } from "lucide-react";
import { requireCouple } from "@/lib/authorization";

export default async function MorePage() {
  await requireCouple();
  return <section><p className="eyebrow">A FEW MORE LITTLE THINGS</p><h1>More of us.</h1><div className="more-links">
    <Link href="/space/gallery"><Images aria-hidden="true"/><span><strong>Gallery</strong><small>Our photos, memory albums and favorites.</small></span><b>→</b></Link>
    <Link href="/space/story"><BookHeart aria-hidden="true"/><span><strong>Our Story</strong><small>Milestones that brought you here.</small></span><b>→</b></Link>
    <Link href="/space/settings"><Settings aria-hidden="true"/><span><strong>Our space</strong><small>Anniversary, shared details and account.</small></span><b>→</b></Link>
  </div></section>;
}
