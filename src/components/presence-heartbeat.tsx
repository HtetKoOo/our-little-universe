"use client";

import { useEffect } from "react";

function sendHeartbeat() {
  if (document.visibilityState !== "visible" || !navigator.onLine) return;
  void fetch("/api/presence", { method: "POST", cache: "no-store", keepalive: true }).catch(() => { /* Retry at the next heartbeat when connectivity returns. */ });
}

export function PresenceHeartbeat() {
  useEffect(() => {
    sendHeartbeat();
    const interval = window.setInterval(sendHeartbeat, 90_000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") sendHeartbeat();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return null;
}
