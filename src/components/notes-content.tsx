import Link from "next/link";
import { Mail, Sparkles } from "lucide-react";

export function NotesContent() {
  return <section><p className="eyebrow">SMALL WORDS, KEPT CLOSE</p><h1>Notes for us.</h1><p className="notes-intro">A place for longer letters and tiny thoughts you want to find again.</p><div className="notes-links"><Link href="/space/letters"><span className="notes-icon"><Mail aria-hidden="true" /></span><span><strong>Love letters</strong><small>Words you want to keep close.</small></span><b>→</b></Link><Link href="/space/jar"><span className="notes-icon"><Sparkles aria-hidden="true" /></span><span><strong>Little Jar</strong><small>Small notes for a brighter moment.</small></span><b>→</b></Link></div></section>;
}
