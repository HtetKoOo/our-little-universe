"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef } from "react";
import {
  Heart,
  House,
  BookOpen,
  Images,
  Mail,
  Sparkles,
  CalendarHeart,
  Camera,
  ArrowUpRight,
  Ellipsis,
  MessageCircleHeart,
  NotebookText,
  X,
} from "lucide-react";
const links = [
  ["", "Home", House],
  ["memories", "Memories", Camera],
  ["gallery", "Gallery", Images],
  ["questions", "Question", MessageCircleHeart],
  ["notes", "Notes", NotebookText],
  ["more", "More", Ellipsis],
] as const;
const moreLinks = [
  ["story", "Our Story", BookOpen],
  ["gallery", "Gallery", Images],
  ["letters", "Love Letters", Mail],
  ["jar", "Memory Jar", Sparkles],
  ["anniversary", "Anniversary", CalendarHeart],
] as const;
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const menu = useRef<HTMLDialogElement>(null);
  const primaryLinks = links.filter(([slug]) =>
    ["", "memories", "questions", "notes"].includes(slug),
  );
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand">
          <Heart size={23} />
          <span>
            our little
            <br />
            <strong>universe</strong>
            <i>EST. IN LOVE</i>
          </span>
        </Link>
        <div className="nav-caption">OUR SPACE</div>
        <nav aria-label="Main navigation">
          {links.map(([slug, label, Icon]) => (
            <Link
              key={slug}
              href={`/demo${slug ? `/${slug}` : ""}`}
              className={
                path === `/demo${slug ? `/${slug}` : ""}`
                  ? "nav-item active"
                  : "nav-item"
              }
              aria-current={
                path === `/demo${slug ? `/${slug}` : ""}` ? "page" : undefined
              }
            >
              <Icon size={19} />
              {label}
              {path === `/demo${slug ? `/${slug}` : ""}` && (
                <span className="nav-dot" />
              )}
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <Heart size={17} />
          <p>
            A thousand little moments.
            <br />
            One beautiful story.
          </p>
        </div>
      </aside>
      <div className="main-wrap">
        <header className="topbar">
          <span>Our story, one day at a time.</span>
          <Link href="/login">
            Private sign-in <ArrowUpRight size={15} />
          </Link>
        </header>
        <div className="demo-banner">
          <span className="status-dot" /> Sample preview · Changes stay in this tab.
          <Link href="/login">Set up →</Link>
        </div>
        <main id="main-content" className="content">
          {children}
        </main>
        <footer className="footer">
          Made of lovely moments. Kept with love. <Heart size={13} />
        </footer>
      </div>
      <nav className="mobile-dock" aria-label="Mobile navigation">
        {primaryLinks.map(([slug, label, Icon]) => {
          const href = `/demo${slug ? `/${slug}` : ""}`;
          return (
            <Link
              key={slug}
              href={href}
              aria-current={path === href ? "page" : undefined}
            >
              <span className="dock-icon">
                <Icon size={22} strokeWidth={1.8} />
              </span>
              <span>{label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => menu.current?.showModal()}
          aria-label="More pages"
          aria-haspopup="dialog"
          className={
            ["/demo/more", "/demo/story", "/demo/gallery", "/demo/letters", "/demo/jar", "/demo/anniversary"].includes(path)
              ? "selected"
              : ""
          }
        >
          <span className="dock-icon">
            <Ellipsis size={22} />
          </span>
          <span>More</span>
        </button>
      </nav>
      <dialog
        ref={menu}
        className="more-sheet"
        aria-labelledby="more-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) menu.current?.close();
        }}
      >
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">MORE OF US</p>
            <h2 id="more-title">Our little corners</h2>
          </div>
          <button
            className="sheet-close"
            aria-label="Close menu"
            onClick={() => menu.current?.close()}
          >
            <X size={22} />
          </button>
        </div>
        <nav aria-label="More pages">
          {moreLinks.map(([slug, label, Icon]) => (
              <Link
                key={slug}
                href={`/demo/${slug}`}
                onClick={() => menu.current?.close()}
                aria-current={path === `/demo/${slug}` ? "page" : undefined}
              >
                <span className="menu-icon">
                  <Icon size={23} />
                </span>
                <span>
                  {label}
                  <small>
                    {slug === "story"
                      ? "How we became us"
                      : slug === "gallery"
                        ? "Our photos & films"
                        : "Our next special day"}
                  </small>
                </span>
                <ArrowUpRight size={18} />
              </Link>
            ))}
        </nav>
      </dialog>
    </div>
  );
}
