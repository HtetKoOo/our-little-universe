"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { rememberGalleryEntry, type GalleryHistoryPage } from "@/lib/gallery-history";
import type { GalleryAsset } from "./shared-gallery";

const GalleryHistoryContext = createContext<{
  pages: Map<string, GalleryHistoryPage<GalleryAsset>>;
  positions: Map<string, number>;
  lastHref: string;
  lastAlbumsHref: string;
  setLastHref: (href: string) => void;
} | null>(null);

export function GalleryHistoryProvider({ children }: { children: ReactNode }) {
  const [pages] = useState(() => new Map<string, GalleryHistoryPage<GalleryAsset>>());
  const [positions] = useState(() => new Map<string, number>());
  const [lastHref, setLastHref] = useState("/space/gallery");
  const [lastAlbumsHref, setLastAlbumsHref] = useState("/space/gallery?view=albums");
  const rememberHref = useCallback((href: string) => {
    setLastHref(href);
    if (href.startsWith("/space/gallery?view=albums")) setLastAlbumsHref(href);
  }, []);
  const value = useMemo(() => ({ pages, positions, lastHref, lastAlbumsHref, setLastHref: rememberHref }), [pages, positions, lastHref, lastAlbumsHref, rememberHref]);
  // The private layout unmounts on sign-out. No private metadata is persisted to disk.
  return <GalleryHistoryContext.Provider value={value}>{children}</GalleryHistoryContext.Provider>;
}

export function useGalleryHistory() {
  const history = useContext(GalleryHistoryContext);
  if (!history) throw new Error("Gallery history requires the private layout provider.");
  return history;
}

export function GalleryEntryLink(props: Omit<ComponentProps<typeof Link>, "href">) {
  const { lastHref } = useGalleryHistory();
  return <Link scroll={false} {...props} href={lastHref} />;
}

export function useGalleryPosition(cacheKey: string, href: string, restore = true) {
  const { positions, setLastHref } = useGalleryHistory();
  const firstRestore = useRef(restore);
  useLayoutEffect(() => {
    let leaving = false;
    const mountedUrl = location.pathname + location.search;
    const saved = firstRestore.current ? positions.get(cacheKey) ?? 0 : 0;
    setLastHref(href);
    const frame = window.requestAnimationFrame(() => {
      if (!leaving) window.scrollTo({ top: saved, behavior: "instant" });
    });
    const save = () => {
      if (!leaving) rememberGalleryEntry(positions, cacheKey, window.scrollY);
    };
    const onClick = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !(event.target instanceof Element)) return;
      const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.origin !== location.origin || anchor.pathname.startsWith("/api/")) return;
      if (anchor.pathname + anchor.search === location.pathname + location.search) return;
      save(); leaving = true;
    };
    // Freeze before Next.js resets the outgoing page's scroll position.
    const onPopState = () => {
      if (location.pathname + location.search !== mountedUrl) leaving = true;
    };
    window.addEventListener("scroll", save, { passive: true });
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", save);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [cacheKey, href, positions, setLastHref]);
}

export function GalleryPosition({ cacheKey, href, children }: { cacheKey: string; href: string; children: ReactNode }) {
  useGalleryPosition(cacheKey, href);
  return children;
}
