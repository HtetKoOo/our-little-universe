# Our Little Universe

A private couple app, built incrementally as a learning project.

## Preview

[**Explore the live demo →**](https://ours.htetkooo.dev/demo)

![Our Little Universe public demo](public/demo-preview.png)

Run the app and open `/demo` to explore the interactive fictional preview. It uses sample content only and never reads or saves private couple data.

## Design approach

Our Little Universe is a mobile-first, responsive web app. The primary experience is designed for two people using their phones, while tablet and desktop layouts provide more space for shared memories and navigation.

**Current build:** a private, authenticated shared space for two people. It includes shared Home customization, heart-photo delivery, memories with media, daily questions with private answers and history, Love Letters, Little Jar notes, partner presence, and an expiring partner-invite flow. `/demo` remains fictional and separate from private data. Production operations such as backup/restore workflows and broader end-to-end deployment hardening remain future work.

## Run locally

Use Node.js 22.13+ (tested on Node 24) and pnpm 10.26.2.

```sh
pnpm install --frozen-lockfile
pnpm run dev
```

Open http://localhost:3000/demo. No credentials are needed for the fictional preview. Preview choices use sessionStorage for this tab only; it never writes to localStorage, a database, or Cloudinary. `/space` redirects to login when the app is unconfigured. Do not enter real private content into the demo.

```sh
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
```

## Read the project in this order

1. `src/app/layout.tsx` — common HTML shell and metadata.
2. `src/app/demo/[[...section]]/page.tsx` — Next.js routes to the demo screens.
3. `src/components/shell.tsx` — navigation and responsive layout.
4. `src/components/preview.tsx` — sample UI interactions; separate from private storage.
5. `src/lib/db/schema.ts` — Drizzle tables, foreign keys and indexes.
6. `src/lib/auth.ts` — Better Auth with Drizzle and closed public registration.
7. `src/lib/authorization.ts` — session-to-couple authorization boundary.
8. `src/lib/memories.ts` — SQL-shaped queries with couple filtering.

Read [the architecture](docs/ARCHITECTURE.md), [Step 1 walkthrough](docs/STEP-1.md), and [security and next steps](docs/SECURITY.md).

## Environment setup

Copy `.env.example` to `.env.local`. Keep real values out of Git and chat. `DATABASE_URL` is a Neon PostgreSQL connection string. `BETTER_AUTH_SECRET` must contain at least 32 cryptographically random characters; `BETTER_AUTH_URL` is the exact app origin. Cloudinary settings stay server-side and are not needed for Step 1.

Password reset and email verification use Resend. In production, verify a dedicated sending subdomain such as `notify.yourdomain.com` in Resend, add its SPF and DKIM DNS records, then set `RESEND_API_KEY` and `EMAIL_FROM="Our Little Universe <hello@notify.yourdomain.com>"`. Set `BETTER_AUTH_URL` to the public app URL, such as `https://app.yourdomain.com`. Every new partner account must confirm its email before it can sign in.

The optional 11:30 unanswered-question reminder uses a small Cloudflare Worker as a scheduler while Vercel continues to host the app, database logic, and Resend integration. See [the Worker setup](workers/question-reminder/README.md). It sends one privacy-safe reminder only to verified members who have not answered yesterday's question.

```sh
pnpm run db:generate
# Review generated SQL before applying to your development Neon branch.
pnpm run db:migrate
```

The included migration has been applied to this checkout’s configured Neon database. Fresh databases still need `pnpm run db:migrate`. Do not run migrations against production as part of casual UI testing. Public signup is deliberately disabled; run `pnpm setup:owner` locally to create the first account and couple membership. Follow [Step 2](docs/STEP-2.md) for the prompts and login check. There is no signup bypass hidden in the demo.

See [Step 3 walkthrough](docs/STEP-3.md) for the memory flow and verification limits.

## Current capabilities

- [x] Closed registration, sign-in, email verification, password reset, owner setup, and couple-scoped authorization.
- [x] Responsive shared Home with customizable widgets, heart-photo carousel, anniversary calculations, and partner presence.
- [x] Private memories, milestones, media attachments, gallery, editing, deletion, and pagination.
- [x] Daily questions with private answers, reveal-after-both-answering, history, reminder support, and a pause flow.
- [x] Persistent Love Letters and Little Jar notes, including read/open tracking.
- [x] Expiring, single-use partner invite creation and acceptance.
- [ ] Backup/restore procedures, broader live end-to-end checks, and operational deployment hardening.

## Stack

Next.js App Router + React + TypeScript; Tailwind CSS; Better Auth; Drizzle ORM; Neon PostgreSQL; Cloudinary SDK. Exact installed versions are recorded in `pnpm-lock.yaml`.

References: [Next.js installation](https://nextjs.org/docs/app/getting-started/installation), [Better Auth Drizzle adapter](https://better-auth.com/docs/adapters/drizzle), [Drizzle Neon guide](https://orm.drizzle.team/docs/connect-neon), [Cloudinary access control](https://cloudinary.com/documentation/control_access_to_media).

### Restricted macOS development environments

If the development watcher reports `EMFILE`, run `WATCHPACK_POLLING=true pnpm run dev`. The preview in this session was checked with polling enabled. This avoids changing system-wide file limits.

### Shared photo duplicate detection

Before deploying the Gallery update, run `pnpm db:migrate` against the intended
application database to apply `0015_media_deduplication.sql`. It adds a nullable
SHA-256 hash and a unique constraint per couple; it does not delete existing photos.

Gallery, memory attachments, and main-card uploads reuse the same library asset
when the original uploaded bytes match. The browser checks before sending the file;
the server computes the fingerprint independently. A deterministic, couple-scoped
Cloudinary public ID with overwrite disabled and the database unique constraint
prevent simultaneous uploads from creating separate copies. Existing rate limits
still apply, so a simultaneous request can ask the user to retry.

Older photos have no source-file hash because previous uploads resized the source.
They remain available, but this feature cannot identify their original bytes
retroactively. Renamed identical files match; edited or recompressed files do not.
If the provider upload succeeds but the database write fails, retry the same file:
the provider object is retained for reuse rather than deleting a file another
request may already reference.

### Direct photo uploads

Apply `0016_direct_media_uploads.sql` with `pnpm db:migrate` **before** deploying
this update. It adds the private upload-intent ledger. Existing photo records and
Cloudinary credentials remain valid; no unsigned upload preset or public bucket
is needed.

Gallery, Memory, and main-card photo uploads now request a signed permission,
POST the file directly from the browser to Cloudinary, then send only an intent
ID to the app to finalize it. Supported files are JPG, PNG and WebP, up to 8 MiB
and 40 megapixels. The new flow preserves original bytes and generates a separate
1280px JPEG preview and a 320px thumbnail for display. Original downloads go directly to Cloudinary;
legacy, resized photos remain available at their existing quality.

Finalization looks up the authenticated provider asset independently, checks
size, dimensions and MIME, downloads the source server-to-server and verifies
SHA-256 before inserting a library row. Verification consumes provider download
bandwidth once per new photo; it does not send file bytes through a browser-to-
Vercel upload request. Browser-provided URLs and metadata are never trusted.
Upload permissions are rate limited (three-second spacing and 120 intents per
couple per hour); app finalization expires after 15 minutes. Cloudinary enforces
its own signed-request lifetime separately.

Retries reuse the same couple-scoped original object and library hash. The
`media:cleanup` command removes old intents for files already in the library.
Abandoned originals/intents are retained for investigation, rather than deleting
an object that could be used by an overlapping retry. Review abandoned uploads
in maintenance if storage usage grows unexpectedly.

After deployment, test a supported photo between 4.5 MB and 8 MiB from Memory and
Gallery, download it and compare its checksum with the source, re-upload it from
the other entry point, and verify that a different couple cannot access it.

Memory photos support **Set as cover** in the create/edit form; save the memory to use that photo on its card, album and Home preview. Open a memory and tap **Show on Home** to feature it for both partners. The selected memory shows **Shown on Home** and **Use automatic selection**. Automatic selection uses the latest milestone, falling back to the latest memory. Deleted selections also fall back automatically. These choices reuse existing photo positions and Home settings, so they need no additional migration.

Open a Gallery photo and tap **Show on Home** to choose up to three photos for the shared Gallery widget. The first selected photo is the main image (and the one shown in half-width mode). **Remove from Home** removes that selection without deleting the photo. With no selected photos, Home uses the latest Gallery photos automatically. This uses existing Home settings and needs no new database migration.

**More → Our space → Photo storage** shows the shared library photo count and total stored file bytes. Reused photos count once. This is an app library total, excluding Cloudinary derived previews, abandoned uploads, bandwidth and other account assets. The owner can open the Cloudinary console for full account usage; the app does not call Cloudinary usage APIs to render this indicator.

Gallery Photos and Favorites load 60 photos at a time with **Load more photos** for older images. The viewer supports **Previous / Next** and keyboard arrow keys; Next at the end of a loaded page fetches the next page. Albums use the same viewer navigation. Only the current photo loads its larger preview.

Gallery has Photos, Albums, and Favorites views. Open a photo and use the heart to add or remove it from the couple’s shared Favorites. Before deploying this update, run `pnpm db:migrate` to apply migration 0017, which adds the favorite flag. Each memory with photos automatically becomes an album, using its first photo as the cover. Albums show the memory date and photo count; opening one loads its attached photos in order. Edit the memory to manage its album. Removing a memory does not remove its photos from the shared library. Albums reuse existing attachments without duplicating files.

Gallery and photo pickers load low-quality 320px thumbnails; opening a photo loads
only its 1280px preview. Original downloads are unchanged. Image responses use
private browser caching with revalidation: each request rechecks membership before
returning 304, avoiding another provider download when the cached image is current.
Old photos generate the requested fixed derivative on first use; later requests
reuse it. Thumbnail dimensions cap resolution; actual KB varies by image content.

### V2 interactive demo

The public `/demo` uses fictional artwork and 66 sample photos. Reviewers can try Photos / Albums / Favorites, Load more, viewer navigation, memory covers, and Show on Home for memories and up to three Gallery photos. Changes stay in this tab using session storage; **More → Reset preview choices** restores the sample state. More also shows clearly labelled illustrative storage totals. Demo actions never call private media or account mutation endpoints, and no personal uploads are accepted.

### V2 PWA

The app has a standalone web manifest, 192/512px icons, a maskable icon and an Apple Home Screen icon. Launching the installed app opens `/space` and uses the existing account/session checks.

**More → Our space → Keep us on your Home Screen** has installation instructions and an Install button when the browser supplies an installation prompt. On iPhone/iPad, open in Safari and use **Share → Add to Home Screen → Add**. Availability and menu wording depend on the browser/device.

The service worker registers only in production on HTTPS (or a trusted localhost). It caches only `/offline.html`, `/pwa/offline.css`, and `/pwa/offline.js`. Private pages, API responses, RSC requests, photo files and authentication data are never written to its cache. A failed full-page navigation shows a public offline screen with Retry; an open app shows a connectivity notice. Online use is required for app content. Existing private browser photo-cache behavior is unchanged.

A new build changes the worker version automatically. A waiting update displays **Refresh app / Later**; only the tab whose user chooses Refresh reloads. Save drafts first. There is no automatic reload, offline mutation queue, offline photo library, or push notification feature in this release. Backgrounding all tabs or closing the app can also allow normal browser worker activation.

Verify PWA behavior with `pnpm build` then `pnpm start` (use a separate localhost port when a development server is running). The worker is disabled during `pnpm dev`. In browser developer tools, check the manifest/icons, root worker scope, and that its cache contains only the three public files. Test a full-page reload offline, Retry after reconnecting, installation on iPhone/Android, and a second deployment while an existing app tab remains open. Installation testing does not require sending emails or changing account data.

Browser API references: [installation prompt](https://developer.mozilla.org/en-US/docs/Web/API/BeforeInstallPromptEvent), [waiting worker activation](https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting).

### Development-only test content cleanup

The real app no longer exposes **Start our story fresh**, its reset Server Action, or cleanup-code emails. **Reset preview choices** remains available in the fictional demo and only resets that tab’s sample choices.

If development fixtures need clearing, use the local-only CLI:

1. Create a separate, disposable test database/Neon branch with a different endpoint from the application's database and apply migrations there. Stop apps/workers using that test database before applying cleanup.
2. Set `CLEANUP_TEST_DATABASE_URL` to that test connection in your local shell. Keep credentials out of commits and shell history. The CLI never uses `DATABASE_URL` as a fallback and refuses the app’s configured endpoint, including pooled/unpooled variants.
3. Run `pnpm dev:clear-test-data --couple <test-couple-uuid>` for a read-only count/preview.
4. Only for disposable fixtures, rerun with `--apply` and type the exact displayed confirmation phrase in the interactive terminal.

The command refuses production, Vercel and CI execution. It clears one explicit test couple’s memories, media attachment/asset records, upload intents, heart photo references and question rounds/progress in one database transaction; Home photo/memory selections are cleared as well. Accounts, couple details, letters, jar notes and the question bank remain. It does **not** delete Cloudinary files or use Cloudinary credentials, so it cannot purge shared production photo storage. Use a separate test Cloudinary environment for upload fixtures. The CLI is never imported by the web app. No database cleanup is performed as part of installing or deploying this change.

## Copyright & License

Copyright © 2026 **Htet Ko Oo**. **All Rights Reserved**, subject to the limited
permissions and third-party rights described in [LICENSE](LICENSE).

Our Little Universe is publicly viewable for source review, recruiting, and
portfolio evaluation under a custom **Source-Available Proprietary License**.
It is **not an OSI-approved open-source license** and does not grant unrestricted
reuse. The license permits a local copy and private execution only for evaluation,
issue reproduction, and preparing contributions to this project; the local setup
instructions above are subject to those limits. People may use the publicly offered
hosted app and demo through their intended interfaces, subject to access controls
and any applicable service terms.

Independent personal or business deployment, unauthorized copying, redistribution,
sublicensing, commercial reuse, and republishing the code as another product require
prior written permission. GitHub's applicable public-repository viewing and
in-service forking permissions remain unaffected. Dependencies and other third-party
materials remain under their own licenses. Earlier versions declared ISC in package
metadata; this update does not revoke any valid earlier license grants.

Issues and proposed pull requests are welcome; read [CONTRIBUTING.md](CONTRIBUTING.md)
for review and contributor-agreement requirements. Contributors retain copyright
unless a separate agreement transfers it. The owner controls the official project,
branding, releases, and commercial licensing of owner-owned materials.

To request commercial-use or redistribution permission, open a licensing issue in
this repository if issues are enabled, or use a contact channel published by the
owner on their GitHub profile. Describe the intended use, code/assets involved, and
distribution or commercial scope. Permission must be expressly granted in writing;
silence is not consent.
