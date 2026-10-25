import { MoreContent } from "@/components/more-content";
import { requireCouple } from "@/lib/authorization";
export default async function Page() { await requireCouple(); return <MoreContent />; }
