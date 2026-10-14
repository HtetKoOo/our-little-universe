"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { photoGeometry, type HeartCrop } from "@/lib/heart-photo-input";
import { defaultCardText, type CardText } from "@/lib/card-text";
import styles from "./couple-main-card.module.css";
import { Heart, Pause, Play, Sparkles } from "lucide-react";
import { anniversaryStats, calendarDate } from "@/lib/dates";

// Supply membership-protected image endpoints when private uploads are connected.
export type HeartPhoto = { src: string; alt: string; width?: number; height?: number; crop?: HeartCrop };
type Props = {
  name: string;
  togetherSince: string;
  timezone: string;
  initialToday: string;
  photos?: HeartPhoto[];
  onEditPhoto?: () => void;
  text?: CardText;
  editor?: {ribbon:ReactNode;heading:ReactNode;message:ReactNode};
  controls?: ReactNode;
  footer?: ReactNode;
};

export function CoupleMainCard({
  togetherSince,
  timezone,
  initialToday,
  photos = [],
  text = defaultCardText,
  editor, controls, footer, onEditPhoto,
}: Props) {
  const clipId = useId().replace(/:/g, "");
  const [today, setToday] = useState(initialToday);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [visible, setVisible] = useState(true);
  const [failed, setFailed] = useState<string[]>([]);
  const available = photos
    .slice(0, 5)
    .filter((photo) => !failed.includes(photo.src));
  const active = index % Math.max(available.length, 1);
  const playing = !paused && !reducedMotion && visible && available.length > 1;
  const stats = anniversaryStats(togetherSince, today);
  const since = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${togetherSince}T00:00:00Z`));

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(motion.matches);
    const visibility = () => setVisible(document.visibilityState === "visible");
    update();
    visibility();
    motion.addEventListener("change", update);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      motion.removeEventListener("change", update);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    const refresh = () => setToday(calendarDate(new Date(), timezone));
    refresh();
    const timer = setInterval(refresh, 60000);
    return () => clearInterval(timer);
  }, [timezone]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setIndex((value) => value + 1), 7000);
    return () => clearInterval(timer);
  }, [playing]);

  return (
    <section
      id="couple-card"
      className={styles["couple-main-card"]}
      aria-label="Our couple card"
    >
      {controls}
      <div className={styles["couple-card-top"]}>
        <Heart size={13} aria-hidden="true" />
        <span>OUR LITTLE UNIVERSE</span>
        <Heart size={13} aria-hidden="true" />
      </div>
      <div className={styles["couple-heart-scene"]}>
        <Sparkles
          className={styles["heart-sparkle"] + " " + styles["sparkle-one"]}
          size={21}
          aria-hidden="true"
        />
        <span
          className={styles["heart-doodle"] + " " + styles["doodle-one"]}
          aria-hidden="true"
        >
          ♡
        </span>
        <span
          className={styles["heart-doodle"] + " " + styles["doodle-two"]}
          aria-hidden="true"
        >
          ✧
        </span>
        <svg
          className={styles["couple-heart-frame"]}
          width="180"
          height="165"
          viewBox="0 0 240 220"
          role="img"
          aria-label={
            available.length
              ? available[active].alt
              : "Two hearts, one little universe"
          }
        >
          <defs>
            <clipPath id={clipId}>
              <path d="M120 204C100 187 20 132 14 78C8 22 80 1 120 48C160 1 232 22 226 78C220 132 140 187 120 204Z" />
            </clipPath>
            <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#f7c7d8" />
              <stop offset="1" stopColor="#fce7d5" />
            </linearGradient>
          </defs>
          <path
            d="M120 212C97 192 12 135 7 78C1 14 79 -8 120 39C161 -8 239 14 233 78C228 135 143 192 120 212Z"
            fill="#fffafc"
          />
          <g clipPath={`url(#${clipId})`}>
            <rect width="240" height="220" fill={`url(#${clipId}-fill)`} />
            {available.length ? (
              available.map((photo, i) => (
                <image
                  key={photo.src}
                  href={photo.src}
                  {...(photo.width && photo.height && photo.crop ? photoGeometry(photo.width, photo.height, photo.crop) : { width: 240, height: 220 })}
                  preserveAspectRatio="xMidYMid slice"
                  className={`${styles["heart-slide"]} ${i === active ? styles["is-visible"] : ""}`}
                  style={{ transition: reducedMotion ? "none" : undefined }}
                  onError={() => setFailed((value) => [...value, photo.src])}
                />
              ))
            ) : (
              <g
                fill="none"
                stroke="#ad5279"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path
                  d="M102 139C93 130 65 112 65 93C65 73 90 68 102 84C115 68 139 73 139 93C139 112 112 131 102 139Z"
                  fill="#fff7fa"
                  transform="rotate(-12 102 104)"
                />
                <path
                  d="M141 155C132 146 104 128 104 109C104 89 129 84 141 100C154 84 178 89 178 109C178 128 151 147 141 155Z"
                  fill="#edacc6"
                  transform="rotate(12 141 120)"
                />
                <path
                  d="M57 132l3 8m-7-4 11-1M174 73l3 10m-7-5 11-1"
                  strokeWidth="1.8"
                />
              </g>
            )}
          </g>
          <path
            d="M120 204C100 187 20 132 14 78C8 22 80 1 120 48C160 1 232 22 226 78C220 132 140 187 120 204Z"
            fill="none"
            stroke="#e7b0c5"
            strokeWidth="1"
          />
        </svg>
        {onEditPhoto && <button type="button" className={styles["heart-edit"]} onClick={onEditPhoto} aria-label={photos.length ? "Change photo" : "Add heart photo"}><span>{photos.length ? "Change photo" : "＋ Add photo"}</span></button>}
        <span className={styles["heart-ribbon"]}>{editor?.ribbon ?? text.ribbon}</span>
        <Sparkles
          className={styles["heart-sparkle"] + " " + styles["sparkle-two"]}
          size={16}
          aria-hidden="true"
        />
      </div>
      {available.length > 1 && (
        <div className={styles["heart-photo-controls"]}>
          {available.map((photo, i) => (
            <button
              key={photo.src}
              type="button"
              aria-label={`Show photo ${i + 1}`}
              aria-pressed={active === i}
              onClick={() => {
                setIndex(i);
                setPaused(true);
              }}
            >
              <span />
            </button>
          ))}
          {!reducedMotion && (
            <button
              type="button"
              aria-label={
                paused ? "Play photo slideshow" : "Pause photo slideshow"
              }
              onClick={() => setPaused((value) => !value)}
            >
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
          )}
        </div>
      )}
      <h1 className={styles["card-heading"]}>{editor?.heading ?? text.heading}</h1>
      <div className={styles["couple-card-stats"]}>
        <div>
          <strong>{stats.daysTogether.toLocaleString("en")}</strong>
          <span>days together</span>
        </div>
        <Heart className={styles["stats-heart"]} size={18} aria-hidden="true" />
        <div>
          <strong>
            {stats.daysUntil === 0
              ? "Today!"
              : stats.daysUntil.toLocaleString("en")}
          </strong>
          <span>
            {stats.daysUntil === 0
              ? "Happy anniversary ♡"
              : "days to our anniversary"}
          </span>
        </div>
      </div>
      <p className={styles["couple-card-message"]}>{editor?.message ?? text.message}</p>
      <p className={styles["couple-card-since"]}>
        Our story began <time dateTime={togetherSince}>{since}</time>
      </p>
      {footer}
    </section>
  );
}
