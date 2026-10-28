import { CoupleCardLoading, HomeWidgetsLoading } from "@/components/home-loading";

export default function SpaceLoading() {
  return <section className="space-home">
    <CoupleCardLoading />
    <p className="partner-presence" aria-hidden="true"><span className="home-data-placeholder">Loading partner status</span></p>
    <HomeWidgetsLoading />
  </section>;
}
