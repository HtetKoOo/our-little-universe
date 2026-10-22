"use client";

import { useLinkStatus } from "next/link";

// A descendant of Link: only the destination actually being navigated to is pending.
export function NavigationFeedback() {
  const { pending } = useLinkStatus();
  return <span className={`navigation-feedback${pending ? " is-pending" : ""}`} role="status">{pending ? <span className="sr-only">Opening page…</span> : null}</span>;
}
