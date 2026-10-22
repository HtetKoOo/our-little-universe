import { notFound } from "next/navigation";
import { Preview } from "@/components/preview";
import { calendarDate } from "@/lib/dates";
export const dynamic = "force-dynamic";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ memory?: string }>;
}) {
  const { section } = await params;
  const slug = section?.[0] ?? "home";
  if (
    (section?.length ?? 0) > 1 ||
    ![
      "home",
      "memories",
      "questions",
      "notes",
      "more",
      "story",
      "gallery",
      "letters",
      "jar",
      "anniversary",
    ].includes(slug)
  )
    notFound();
  return (
    <Preview initialMemoryId={(await searchParams).memory} section={slug} today={calendarDate(new Date(), "Asia/Bangkok")} />
  );
}
