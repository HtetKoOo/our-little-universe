"use client";
import { useGalleryHistory } from "./gallery-history";
import Link from "next/link";
import { NavigationFeedback } from "./navigation-feedback";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, House, Images, MessageCircleHeart, MoreHorizontal, NotebookText } from "lucide-react";
export function PrivateNav() {
  const path = usePathname();
  const { lastHref } = useGalleryHistory();
  const [questionAttention, setQuestionAttention] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      if (document.visibilityState !== "visible" || !navigator.onLine) return;
      try {
        const response = await fetch("/api/question-attention", { cache: "no-store" });
        if (!response.ok || cancelled) return;
        const data = await response.json() as { attention: string | null };
        if (!cancelled) setQuestionAttention(Boolean(data.attention));
      } catch {
        // A missed badge should never interrupt navigation.
      }
    };
    void refresh();
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener("question-attention-changed", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("question-attention-changed", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  return (
    <nav className="private-nav" aria-label="Our space">
      {[
        { href: "/space", text: "Home", Icon: House },
        { href: "/space/memories", text: "Memories", Icon: Heart },
        { href: "/space/gallery", text: "Gallery", Icon: Images },
        { href: "/space/questions", text: "Question", Icon: MessageCircleHeart },
        { href: "/space/notes", text: "Notes", Icon: NotebookText },
        { href: "/space/more", text: "More", Icon: MoreHorizontal },
      ].map(({ href, text, Icon }) => {
        const active =
          href === "/space"
            ? path === href
            : path === href || path.startsWith(`${href}/`);
        return (
          <Link
            className={href === "/space/gallery" ? "private-nav-gallery" : undefined}
            key={href}
            href={href === "/space/gallery" ? lastHref : href}
            scroll={href === "/space/gallery" ? false : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span className="private-nav-icon"><Icon size={20} aria-hidden="true" />{href === "/space/questions" && questionAttention ? <i className="question-nav-badge" aria-label="A question needs your attention" /> : null}</span>
            <span>{text}</span>
            <NavigationFeedback />
          </Link>
        );
      })}
    </nav>
  );
}
