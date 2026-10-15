CREATE TABLE "media_upload_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"couple_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"content_hash" text NOT NULL,
	"expected_bytes" integer NOT NULL,
	"mime" text NOT NULL,
	"public_id" text NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_couple_id_couples_id_fk" FOREIGN KEY ("couple_id") REFERENCES "public"."couples"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_upload_intents" ADD CONSTRAINT "media_upload_intents_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_upload_intents_couple_created_idx" ON "media_upload_intents" USING btree ("couple_id","created_at");