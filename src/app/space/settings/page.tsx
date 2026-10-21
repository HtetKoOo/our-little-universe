import { StorageUsage } from "@/components/storage-usage";
import { requireCouple } from "@/lib/authorization";
import { BirthdayForm, CoupleForm } from "@/components/memory-form";
import { SignOut } from "@/components/sign-out";
import { PartnerInvite } from "@/components/partner-invite";
import { StartFresh } from "@/components/start-fresh";
import { CelebrationResend } from "@/components/celebration-resend";
import { getDb } from "@/lib/db";
import { coupleEventEmails, coupleMembers, user } from "@/lib/db/schema";
import { calendarDate } from "@/lib/dates";
import { and, eq, inArray } from "drizzle-orm";

function previousCalendarDate(value: string) {
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function monthsaryDate(year: number, month: number, date: string) {
  const [, , day] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return `${year}-${String(month).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
}

function recentMissedMonthsary(togetherSince: string, today: string) {
  let candidate = previousCalendarDate(today);
  for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
    if (daysAgo > 1) candidate = previousCalendarDate(candidate);
    const year = Number(candidate.slice(0, 4));
    const month = Number(candidate.slice(5, 7));
    const isMonthsary =
      candidate > togetherSince &&
      candidate === monthsaryDate(year, month, togetherSince) &&
      !(month === Number(togetherSince.slice(5, 7)) && year > Number(togetherSince.slice(0, 4)));
    if (isMonthsary) return candidate;
  }
  return null;
}

export default async function Settings() {
  const couple = await requireCouple();
  const db = getDb();
  const [partner] = await db.select({ name: user.name, email: user.email }).from(coupleMembers).innerJoin(user, eq(coupleMembers.userId, user.id)).where(and(eq(coupleMembers.coupleId, couple.coupleId), eq(coupleMembers.role, "partner"))).limit(1);
  const [me] = await db.select({ birthday: user.birthday }).from(user).where(eq(user.id, couple.userId)).limit(1);
  const missedDate = recentMissedMonthsary(couple.togetherSince, calendarDate(new Date(), couple.timezone));
  const deliveries = missedDate
    ? await db.select({ userId: coupleEventEmails.userId }).from(coupleEventEmails).where(and(eq(coupleEventEmails.coupleId, couple.coupleId), eq(coupleEventEmails.eventDate, missedDate), inArray(coupleEventEmails.eventKey, ["monthsary", "monthsary-manual"])))
    : [];
  const showCelebrationResend = couple.role === "owner" && Boolean(missedDate) && deliveries.length < 2;
  return <><p className="eyebrow">THE DETAILS THAT MAKE US, US</p><h1>Our details.</h1>
    {couple.role === "owner" ? <CoupleForm couple={{name:couple.name,togetherSince:couple.togetherSince,timezone:couple.timezone}} /> : <p>Only the owner can change our space settings.</p>}
    <section className="private-account"><h2>Your birthday</h2><BirthdayForm birthday={me?.birthday ?? null} /></section>
    {couple.role === "owner" ? <PartnerInvite partner={partner ?? null} /> : null}
    {showCelebrationResend ? <CelebrationResend /> : null}
    <StorageUsage />
    {couple.role === "owner" ? <StartFresh /> : null}
    <section className="private-account"><h2>Your account</h2><SignOut /></section>
  </>;
}
