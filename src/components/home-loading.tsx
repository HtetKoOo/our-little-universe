import { Heart, Pencil, SlidersHorizontal, Sparkles } from "lucide-react";
import styles from "./couple-main-card.module.css";
import { defaultCardText, type CardText } from "@/lib/card-text";
import { HomeWidgets } from "./home-widgets";
import type { HomeWidgetConfig } from "@/lib/home-widgets";

const blank = <span className="home-data-placeholder" aria-hidden="true">&nbsp;</span>;

export function CoupleCardLoading({ text }: { text?: CardText }) {
  return <div className="home-card-loading" role="status" aria-label="Loading your couple card">
    <section className={styles["couple-main-card"]} aria-busy="true">
      <span className="home-loading-edit" aria-hidden="true"><Pencil size={17} /></span>
      <div className={styles["couple-card-top"]}><Heart size={13} /><span>OUR LITTLE UNIVERSE</span><Heart size={13} /></div>
      <div className={styles["couple-heart-scene"]}>
        <Sparkles className={styles["heart-sparkle"] + " " + styles["sparkle-one"]} size={21} />
        <svg className={styles["couple-heart-frame"]} viewBox="0 0 240 220" aria-hidden="true"><path d="M120 204C100 187 20 132 14 78C8 22 80 1 120 48C160 1 232 22 226 78C220 132 140 187 120 204Z" fill="#f1dce5" stroke="#fffafc" strokeWidth="8" /></svg>
        <span className={styles["heart-ribbon"]}>{text?.ribbon ?? blank}</span>
        <Sparkles className={styles["heart-sparkle"] + " " + styles["sparkle-two"]} size={16} />
      </div>
      <div className={styles["heart-photo-controls"]} aria-hidden="true"><span className="home-slide-placeholder">●　●　●　Ⅱ</span></div>
      <h1 className={styles["card-heading"]}>{text?.heading ?? <span className="home-loading-text">{defaultCardText.heading}</span>}</h1>
      <div className={styles["couple-card-stats"]}>
        <div><strong>{blank}</strong><span>days together</span></div>
        <Heart className={styles["stats-heart"]} size={18} />
        <div><strong>{blank}</strong><span>days to our anniversary</span></div>
      </div>
      <p className={styles["couple-card-message"]}>{text?.message ?? <span className="home-loading-text">{defaultCardText.message}</span>}</p>
      <p className={styles["couple-card-since"]}>Our story began {blank}</p>
    </section>
  </div>;
}

export function HomeWidgetsLoading({ config }: { config?: HomeWidgetConfig[] }) {
  if (config) return <HomeWidgets config={config} latest={null} milestone={null} memoryCount={0} galleryPhotoSrcs={[]} loading />;
  return <section className="home-widgets home-shelf-loading" aria-busy="true" aria-labelledby="loading-little-corners">
    <div className="home-widgets-heading">
      <div><p className="eyebrow">A LITTLE CORNER OF US</p><h2 id="loading-little-corners">Our little shelf.</h2></div>
      <button type="button" className="home-customize-link" disabled><SlidersHorizontal size={16} />Customize home</button>
    </div>
    <p className="sr-only" role="status">Loading your home widgets</p>
  </section>;
}
