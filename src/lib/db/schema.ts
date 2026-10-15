import type { SavedHeartPhoto } from "../heart-photo-input";
import {
  pgTable,
  jsonb,
  text,
  timestamp,
  boolean,
  uuid,
  date,
  integer,
  primaryKey,
  index,
  unique,
  foreignKey,
  check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();
// Better Auth owns these tables. Only the local bootstrap script inserts an
// initial credential, using Better Auth’s own password hashing implementation.
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  // Private birthday, used only for the couple’s shared celebration emails.
  birthday: date("birthday"),
  image: text("image"),
  // A quiet, approximate presence signal for the other member of a couple.
  // It is refreshed only while someone is actively using the private app.
  lastActiveAt: timestamp("last_active_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("session_user_idx").on(t.userId)],
);
export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", {
      withTimezone: true,
    }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", {
      withTimezone: true,
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("account_user_idx").on(t.userId),
    unique("account_provider_unique").on(t.providerId, t.accountId),
  ],
);
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);
export const couples = pgTable("couples", {
  photoUploadAt: timestamp("photo_upload_at", { withTimezone: true }),
  heartPhotos: jsonb("heart_photos").$type<SavedHeartPhoto[]>(),
  heartPhoto: jsonb("heart_photo").$type<SavedHeartPhoto>(),
  photoRevision: integer("photo_revision").default(0).notNull(),
  cardText: jsonb("card_text").$type<{
    ribbon: string;
    heading: string;
    message: string;
  }>(),
  cardRevision: integer("card_revision").default(0).notNull(),
  homeWidgets: jsonb("home_widgets").$type<{
    id: "photo" | "jar" | "question" | "memory";
    visible: boolean;
    size: "half" | "full";
  }[]>(),
  homeWidgetsRevision: integer("home_widgets_revision").default(0).notNull(),
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  togetherSince: date("together_since").notNull(),
  timezone: text("timezone").default("Asia/Bangkok").notNull(),
  createdAt: createdAt(),
});
export const coupleMembers = pgTable(
  "couple_members",
  {
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role", { enum: ["owner", "partner"] }).notNull(),
    joinedAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.coupleId, t.userId] }),
    unique("one_couple_per_user").on(t.userId),
    check("member_role", sql`${t.role} in ('owner', 'partner')`),
  ],
);

// One private, email-bound invitation for the second member of a couple.
// Only a hash of the link token is stored, so a database read cannot redeem it.
export const coupleInvites = pgTable(
  "couple_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" })
      .unique(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: text("accepted_by").references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("couple_invites_email_idx").on(t.email)],
);
export const memories = pgTable(
  "memories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    happenedOn: date("happened_on").notNull(),
    location: text("location"),
    isMilestone: boolean("is_milestone").default(false).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("memories_couple_date_idx").on(t.coupleId, t.happenedOn),
    unique("memory_couple_unique").on(t.id, t.coupleId),
  ],
);
// A file is stored once in Cloudinary and can be attached to several memories.
// The composite unique key lets attachments prove that an asset belongs to the
// same couple as its memory.
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    publicId: text("public_id").notNull().unique(),
    resourceType: text("resource_type", { enum: ["image", "video"] }).notNull(),
    deliveryType: text("delivery_type").default("authenticated").notNull(),
    format: text("format").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    contentHash: text("content_hash"),
    createdAt: createdAt(),
  },
  (t) => [
    unique("media_asset_couple_unique").on(t.id, t.coupleId),
    unique("media_assets_couple_hash_unique").on(t.coupleId, t.contentHash),
    index("media_assets_couple_created_idx").on(t.coupleId, t.createdAt),
    check("media_assets_authenticated_only", sql`${t.deliveryType} = 'authenticated'`),
    check("media_assets_resource_type", sql`${t.resourceType} in ('image', 'video')`),
  ],
);
// Durable direct-upload intents bind browser uploads to one member and source hash.
export const mediaUploadIntents = pgTable("media_upload_intents", {
  id: uuid("id").defaultRandom().primaryKey(),
  coupleId: uuid("couple_id").notNull().references(() => couples.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  contentHash: text("content_hash").notNull(),
  expectedBytes: integer("expected_bytes").notNull(),
  mime: text("mime").notNull(),
  publicId: text("public_id").notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: createdAt(),
}, t => [index("media_upload_intents_couple_created_idx").on(t.coupleId, t.createdAt)]);

export const memoryMedia = pgTable(
  "memory_media",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    memoryId: uuid("memory_id").notNull(),
    assetId: uuid("asset_id").notNull(),
    attachedBy: text("attached_by")
      .notNull()
      .references(() => user.id),
    alt: text("alt").notNull(),
    position: integer("position").default(0).notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({
      columns: [t.memoryId, t.coupleId],
      foreignColumns: [memories.id, memories.coupleId],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.assetId, t.coupleId],
      foreignColumns: [mediaAssets.id, mediaAssets.coupleId],
    }),
    unique("memory_media_memory_asset_unique").on(t.memoryId, t.assetId),
    index("memory_media_memory_position_idx").on(t.memoryId, t.position),
  ],
);
export const letters = pgTable(
  "letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("letters_couple_idx").on(t.coupleId)],
);
// A letter is written for the other member, while the separate read receipt
// keeps delivery and reading states private to each recipient.
export const letterReads = pgTable(
  "letter_reads",
  {
    letterId: uuid("letter_id")
      .notNull()
      .references(() => letters.id, { onDelete: "cascade" }),
    readBy: text("read_by")
      .notNull()
      .references(() => user.id),
    readAt: timestamp("read_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.letterId, t.readBy] }), index("letter_reads_reader_idx").on(t.readBy, t.readAt)],
);

export const jarNotes = pgTable(
  "jar_notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id),
    body: text("body").notNull(),
    // Optional prompt for the person opening a small surprise later.
    openWhen: text("open_when"),
    createdAt: createdAt(),
  },
  (t) => [index("jar_couple_idx").on(t.coupleId), index("jar_creator_idx").on(t.coupleId, t.createdBy)],
);

// An opening belongs to the person who discovered the note. A note stays
// private between the two people; its writer only learns that it was opened.
export const jarNoteOpens = pgTable(
  "jar_note_opens",
  {
    noteId: uuid("note_id")
      .notNull()
      .references(() => jarNotes.id, { onDelete: "cascade" }),
    openedBy: text("opened_by")
      .notNull()
      .references(() => user.id),
    reaction: text("reaction", { enum: ["heart", "hug", "smile"] }),
    openedAt: timestamp("opened_at", { withTimezone: true }).defaultNow().notNull(),
    reactedAt: timestamp("reacted_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.noteId, t.openedBy] }), index("jar_opened_by_idx").on(t.openedBy, t.openedAt)],
);

// These are the gentle prompts shared by every couple. A round references one
// prompt, while answers remain private until both members have written theirs.
export const littleQuestionBank = pgTable(
  "little_question_bank",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    prompt: text("prompt").notNull(),
    category: text("category").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    sortOrder: integer("sort_order").notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    unique("little_question_bank_prompt_unique").on(t.prompt),
    index("little_question_bank_active_idx").on(t.isActive, t.sortOrder),
  ],
);

export const littleQuestionRounds = pgTable(
  "little_question_rounds",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => littleQuestionBank.id),
    // The local calendar day on which this prompt first appears at noon.
    questionDay: date("question_day").notNull(),
    status: text("status", {
      enum: ["answering", "decision", "rest_requested", "revealed", "rested"],
    })
      .default("answering")
      .notNull(),
    restRequestedBy: text("rest_requested_by").references(() => user.id),
    restRequestedAt: timestamp("rest_requested_at", { withTimezone: true }),
    revealedAt: timestamp("revealed_at", { withTimezone: true }),
    restedAt: timestamp("rested_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("little_question_round_couple_day_unique").on(t.coupleId, t.questionDay),
    index("little_question_rounds_couple_day_idx").on(t.coupleId, t.questionDay),
    check(
      "little_question_round_status",
      sql`${t.status} in ('answering', 'decision', 'rest_requested', 'revealed', 'rested')`,
    ),
  ],
);

export const littleQuestionAnswers = pgTable(
  "little_question_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roundId: uuid("round_id")
      .notNull()
      .references(() => littleQuestionRounds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique("little_question_answer_round_user_unique").on(t.roundId, t.userId),
    index("little_question_answers_round_idx").on(t.roundId),
  ],
);

// A question can be new for one person even after the other person has opened
// it. This record lets the navigation badge stay private to each member.
export const littleQuestionViews = pgTable(
  "little_question_views",
  {
    roundId: uuid("round_id")
      .notNull()
      .references(() => littleQuestionRounds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    seenAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.roundId, t.userId] }),
    index("little_question_views_user_idx").on(t.userId, t.seenAt),
  ],
);

// One pre-decision reminder per member and question. The composite key makes
// duplicate scheduler deliveries harmless.
export const littleQuestionReminders = pgTable(
  "little_question_reminders",
  {
    roundId: uuid("round_id")
      .notNull()
      .references(() => littleQuestionRounds.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    sentAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.roundId, t.userId] }),
    index("little_question_reminders_user_idx").on(t.userId, t.sentAt),
  ],
);

// Upload intent is persisted BEFORE contacting Cloudinary. Unreferenced rows
// survive request failures so cleanup can retry without logging private URLs.
// One delivery per recipient, couple, event, and local date. This makes retries
// safe even if Cloudflare wakes the app more than once.
export const coupleEventEmails = pgTable(
  "couple_event_emails",
  {
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    eventKey: text("event_key").notNull(),
    eventDate: date("event_date").notNull(),
    sentAt: createdAt(),
  },
  (t) => [
    primaryKey({ columns: [t.coupleId, t.userId, t.eventKey, t.eventDate] }),
    index("couple_event_emails_date_idx").on(t.coupleId, t.eventDate),
  ],
);

export const heartPhotoUploads = pgTable(
  "heart_photo_uploads",
  {
    id: uuid("id").primaryKey(),
    coupleId: uuid("couple_id")
      .notNull()
      .references(() => couples.id),
    createdAt: createdAt(),
  },
  (t) => [index("heart_photo_uploads_created_idx").on(t.createdAt)],
);
