import Link from "next/link";
import { Heart, LockKeyhole, ArrowRight } from "lucide-react";
export default function Welcome() {
  return (
    <main className="entry">
      <div className="entry-card">
        <Heart size={32} className="accent" />
        <p className="eyebrow">JUST THE TWO OF US</p>
        <h1>
          Our little
          <br />
          <em>universe.</em>
        </h1>
        <p>
          A place for the days we never want to forget,
          <br />
          and all the ones still to come.
        </p>
        <div className="entry-actions">
          <Link className="button" href="/space">
            Enter our space <ArrowRight size={17} />
          </Link>
          <Link className="quiet-link" href="/demo">
            Explore the demo <ArrowRight size={16} />
          </Link>
        </div>
        <small>
          <LockKeyhole size={14} /> Your space requires private sign-in.
        </small>
      </div>
    </main>
  );
}
