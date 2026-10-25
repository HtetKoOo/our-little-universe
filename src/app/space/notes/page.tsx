import { NotesContent } from "@/components/notes-content";
import { requireCouple } from "@/lib/authorization";
export default async function Page() { await requireCouple(); return <NotesContent />; }
