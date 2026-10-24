import Link from "next/link";
import { NavigationFeedback } from "./navigation-feedback";

export function GalleryNavigation({ active }: { active: "photos" | "albums" | "favorites" }) {
  return <nav className="gallery-navigation" aria-label="Gallery views">
    <Link scroll={false} href="/space/gallery" aria-current={active === "photos" ? "page" : undefined}>Photos<NavigationFeedback /></Link>
    <Link scroll={false} href="/space/gallery?view=albums" aria-current={active === "albums" ? "page" : undefined}>Albums<NavigationFeedback /></Link>
    <Link scroll={false} href="/space/gallery?view=favorites" aria-current={active === "favorites" ? "page" : undefined}>Favorites<NavigationFeedback /></Link>
  </nav>;
}
