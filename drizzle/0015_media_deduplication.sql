ALTER TABLE "media_assets" ADD COLUMN "content_hash" text;
--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_couple_hash_unique" UNIQUE("couple_id", "content_hash");
