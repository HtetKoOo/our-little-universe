"use client";
import { useActionState } from "react";
import { sendLoveLetter, type LetterActionState } from "@/app/space/letters/actions";
const initial: LetterActionState = { message: "" };
export function LoveLetterComposer({ loading = false }: { loading?: boolean }) {
  const [state, action, pending] = useActionState(sendLoveLetter, initial);
  return <section className="letter-composer"><p className="eyebrow">WRITE TO YOUR PERSON</p><h2>A letter for them to keep.</h2><form action={action}><fieldset disabled={loading || pending}><label htmlFor="letter-title">A small title</label><input id="letter-title" name="title" maxLength={120} required placeholder="For a quiet night" /><label htmlFor="letter-body">Your letter</label><textarea id="letter-body" name="body" rows={9} maxLength={10000} required placeholder="Write whatever you want them to find…" /><button className="button" type="submit">{pending ? "Sending…" : "Send this letter ♡"}</button></fieldset></form><p role="status" className="form-status">{state.message}</p></section>;
}
