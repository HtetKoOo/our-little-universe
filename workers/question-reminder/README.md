# Our Little Universe email Worker

This tiny Cloudflare Worker wakes the app twice a day. It contains neither
Database nor Resend credentials; it only carries a shared secret used to call
protected endpoints in the app.

- **06:00 Asia/Bangkok** — sends monthsary, anniversary, and birthday emails.
- **11:30 Asia/Bangkok** — sends the unanswered little-question reminder.

## Production setup

1. In Vercel, set a random `QUESTION_REMINDER_SECRET` production environment
   variable.
2. From this directory, set that same value as the Cloudflare Worker secret:

   ```sh
   npx wrangler secret put QUESTION_REMINDER_SECRET
   npx wrangler deploy
   ```

The Worker calls these protected endpoints:

- `/api/jobs/celebration-email`
- `/api/jobs/question-reminder`

Each email delivery is saved before it is sent. If a scheduler retry happens,
the same person will not get another copy. If Resend rejects a delivery, the
saved delivery is removed so the next run can retry it.

`wrangler.toml` assumes the couple timezone is `Asia/Bangkok`. If the couple
changes timezone, change both UTC cron expressions to match it.
