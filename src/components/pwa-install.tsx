"use client";
import { useState } from "react";
import { Check, Download, Smartphone } from "lucide-react";
import { useInstalledPwa, usePwaInstall } from "./pwa-provider";
export function PwaInstall() {
  const installed = useInstalledPwa();
  const { prompt, clearPrompt } = usePwaInstall();
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  async function install() {
    if (!prompt || pending) return;
    setPending(true); setMessage("");
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      setMessage(choice.outcome === "accepted" ? "Follow your browser’s installation steps." : "You can install later from your browser menu.");
    } catch { setMessage("Use your browser menu to add this app to your Home Screen."); }
    finally { clearPrompt(); setPending(false); }
  }
  return <section className="private-account pwa-install" aria-labelledby="install-app-title">
    <h2 id="install-app-title"><Smartphone size={21} aria-hidden="true" />Keep us on your Home Screen</h2>
    {installed ? <p className="pwa-installed"><Check size={18} aria-hidden="true" />You’re using the installed app.</p> : <>
      <p>Open Our Little Universe like an app, with the same private account.</p>
      {prompt && <button type="button" className="button" disabled={pending} onClick={() => void install()}><Download size={17} aria-hidden="true" />{pending ? "Opening…" : "Install app"}</button>}
      <details><summary>How to install</summary><ul><li><strong>iPhone / iPad:</strong> Open in Safari, tap Share, then Add to Home Screen and Add.</li><li><strong>Android:</strong> Open the browser menu and choose Install app or Add to Home screen when available.</li><li><strong>Desktop:</strong> Look for the install icon in the address bar or Install in the browser menu.</li></ul></details>
    </>}
    <p className="pwa-install-note">An internet connection is needed to open photos and memories.</p>
    <p role="status">{message}</p>
  </section>;
}
