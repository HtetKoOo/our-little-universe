import Link from "next/link";

export function GalleryNavigation({ active }: { active: "photos" | "albums" | "favorites" }) {
  return <nav className="gallery-navigation" aria-label="Gallery views">
    <Link href="/space/gallery" aria-current={active === "photos" ? "page" : undefined}>Photos</Link>
    <Link href="/space/gallery?view=albums" aria-current={active === "albums" ? "page" : undefined}>Albums</Link>
    <Link href="/space/gallery?view=favorites" aria-current={active === "favorites" ? "page" : undefined}>Favorites</Link>
  </nav>;
}
