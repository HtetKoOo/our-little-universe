"use client";
import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: "accepted" | "dismissed" }> };
const PwaContext = createContext<{ prompt: InstallPrompt | null; clearPrompt: () => void }>({ prompt: null, clearPrompt: () => {} });
export function usePwaInstall() { return useContext(PwaContext); }
function standaloneSnapshot() {
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone);
}
function subscribeStandalone(listener: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  window.addEventListener("appinstalled", listener);
  return () => { media.removeEventListener("change", listener); window.removeEventListener("appinstalled", listener); };
}
export function useInstalledPwa() { return useSyncExternalStore(subscribeStandalone, standaloneSnapshot, () => false); }

function networkSnapshot() { return navigator.onLine; }
function subscribeNetwork(listener: () => void) {
  window.addEventListener("online", listener); window.addEventListener("offline", listener);
  return () => { window.removeEventListener("online", listener); window.removeEventListener("offline", listener); };
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const [prompt, setPrompt] = useState<InstallPrompt | null>(null);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [updating, setUpdating] = useState(false);
  const applying = useRef(false);
  const online = useSyncExternalStore(subscribeNetwork, networkSnapshot, () => true);
  useEffect(() => {
    function beforeInstall(event: Event) { event.preventDefault(); setPrompt(event as InstallPrompt); }
    function installed() { setPrompt(null); }
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => { window.removeEventListener("beforeinstallprompt", beforeInstall); window.removeEventListener("appinstalled", installed); };
  }, []);
  useEffect(() => {
    // Do not let a worker interfere with Next.js hot reload or local drafts.
    if (process.env.NODE_ENV !== "production" || !window.isSecureContext || !("serviceWorker" in navigator)) return;
    let alive = true;
    let registration: ServiceWorkerRegistration | undefined;
    const workerListeners: Array<() => void> = [];
    function controllerChanged() { if (applying.current) window.location.reload(); }
    function inspect() { if (alive && registration?.waiting && navigator.serviceWorker.controller) setWaiting(registration.waiting); }
    function updateFound() {
      const worker = registration?.installing;
      if (!worker) return;
      const changed = () => { if (alive && worker.state === "installed" && navigator.serviceWorker.controller) setWaiting(worker); };
      worker.addEventListener("statechange", changed);
      workerListeners.push(() => worker.removeEventListener("statechange", changed));
    }
    function checkForUpdate() { if (document.visibilityState === "visible") void registration?.update().catch(() => {}); }
    navigator.serviceWorker.addEventListener("controllerchange", controllerChanged);
    navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).then(result => {
      if (!alive) return;
      registration = result;
      inspect(); updateFound();
      registration.addEventListener("updatefound", updateFound);
    }).catch(() => { /* Online app remains usable if installation is unsupported or blocked. */ });
    document.addEventListener("visibilitychange", checkForUpdate);
    window.addEventListener("online", checkForUpdate);
    return () => {
      alive = false;
      registration?.removeEventListener("updatefound", updateFound);
      workerListeners.forEach(remove => remove());
      navigator.serviceWorker.removeEventListener("controllerchange", controllerChanged);
      document.removeEventListener("visibilitychange", checkForUpdate);
      window.removeEventListener("online", checkForUpdate);
    };
  }, []);
  return <PwaContext.Provider value={{ prompt, clearPrompt: () => setPrompt(null) }}>
    {children}
    {!online && <aside className="pwa-update" role="status"><div><strong>You’re offline.</strong><p>Reconnect to open photos and memories. Save any changes before refreshing.</p></div></aside>}
    {online && waiting && <aside className="pwa-update" aria-label="App update" role="status"><div><strong>A new version is ready.</strong><p>Save any changes before refreshing.</p></div><button type="button" disabled={updating} onClick={() => { applying.current = true; setUpdating(true); waiting.postMessage({ type: "SKIP_WAITING" }); }}>{updating ? "Updating…" : "Refresh app"}</button><button type="button" disabled={updating} onClick={() => setWaiting(null)}>Later</button></aside>}
  </PwaContext.Provider>;
}
