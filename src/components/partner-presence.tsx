"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";

type Partner = { name: string; lastActiveAt: string | null } | null;

function presenceLabel(lastActiveAt: string | null) {
  if (!lastActiveAt) return "Hasn’t visited our space yet.";
  const minutes = Math.max(
    0,
    Math.floor((Date.now() - new Date(lastActiveAt).getTime()) / 60_000),
  );
  if (minutes < 3) return "Here now";
  if (minutes < 60) return "Here recently";
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Here ${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  return `Last here ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(lastActiveAt))}`;
}

export function PartnerPresence() {
  const [partner, setPartner] = useState<Partner | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      try {
        const response = await fetch("/api/presence", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = (await response.json()) as { partner: Partner };
        if (!cancelled) setPartner(data.partner);
      } catch {
        // Presence is a gentle extra, so it should never interrupt the Home page.
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  if (partner === undefined) return null;
  if (!partner)
    return (
      <p className="partner-presence">
        <Heart size={15} aria-hidden="true" />
        Waiting for your person to join your space.
      </p>
    );
  return (
    <p className="partner-presence" aria-live="polite">
      <Heart size={15} aria-hidden="true" />
      <span>
        <b>{partner.name}</b> · {presenceLabel(partner.lastActiveAt)}
      </span>
    </p>
  );
}
