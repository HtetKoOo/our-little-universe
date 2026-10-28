import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { getDb } from "../db";
import type { MediaActor } from "../media";
import { coupleMembers, mediaAssets } from "./schema";

export function homePhotosQuery(db: ReturnType<typeof getDb>, actor: MediaActor, chosenIds: string[]) {
  const chosenFirst = chosenIds.length ? inArray(mediaAssets.id, chosenIds)! : sql`false`;
  return db.select({ id: mediaAssets.id }).from(mediaAssets)
    .where(and(eq(mediaAssets.coupleId, actor.coupleId), eq(mediaAssets.resourceType, "image"),
      sql`exists(select 1 from ${coupleMembers} where ${coupleMembers.coupleId}=${mediaAssets.coupleId} and ${coupleMembers.userId}=${actor.userId})`))
    .orderBy(desc(chosenFirst), desc(mediaAssets.createdAt), desc(mediaAssets.id)).limit(3);
}
