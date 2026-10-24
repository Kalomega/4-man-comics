# 4 man comics: backend + setup guide

Next.js (App Router) on Vercel, Supabase (database, Google login, private image storage), Resend (email).
The finished prototype UI is in `public/prototype.html`. Porting it into the pages listed under "Still to build" is the next step.

## 1. Supabase
1. Create a project at supabase.com. Save the database password somewhere.
2. SQL Editor > New query > paste `supabase/schema.sql` > Run. This creates the tables and a private `panels` storage bucket.
3. Project Settings > API: copy the **Project URL**, the **anon key**, and the **service_role key**. The service_role key is a secret: never expose it in browser code.

## 2. Google login
1. Google Cloud Console > create a project > APIs & Services > OAuth consent screen (External; add your email as a test user while testing, then publish).
2. Credentials > Create credentials > OAuth client ID > Web application. Under Authorized redirect URIs add `https://YOUR-REF.supabase.co/auth/v1/callback`.
3. Supabase > Authentication > Providers > Google: enable, paste the Client ID and Secret.
4. Supabase > Authentication > URL Configuration: set Site URL to `https://yourdomain.com` and add `https://yourdomain.com/auth/callback` and `http://localhost:3000/auth/callback` to Redirect URLs.

## 3. Resend (email)
1. Create an account, then Domains > Add Domain (use your domain, or a subdomain like `mail.yourdomain.com`).
2. Add the DNS records Resend shows (SPF and DKIM) at your registrar. Wait for "Verified".
3. API Keys > create one. Set `EMAIL_FROM` to something like `4 man comics <noreply@yourdomain.com>`.
Without `RESEND_API_KEY`, emails are only logged to the console, which is handy for local testing.

## 4. Run locally
```
cp .env.example .env.local   # fill in the values
npm install
npm run dev
```
Set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` locally.

## 5. Deploy on Vercel
1. Push this folder to a GitHub repo, then Vercel > Add New Project > import it.
2. Add every variable from `.env.example` under Settings > Environment Variables. Make `CRON_SECRET` a long random string.
3. Settings > Domains: add your domain and follow the DNS instructions.
4. `vercel.json` registers one daily cron (`/api/cron`). Vercel's Hobby plan allows at most one run per day, which is all we need.

## What the daily cron does
- Keeps the Supabase free project awake (it queries the database daily; free projects pause after about a week idle).
- Emails the creator a reminder when a turn has waited over 7 days (at most about weekly).
- Expires a comic when one turn has waited over 21 days, and emails everyone attached the partial comic.
- Publishes finished-but-never-named comics as "Untitled comic" after one day, so people still get their email.

## How it works
| Endpoint | Purpose |
|---|---|
| `POST /api/comics` | Creator (login required) starts a comic. Returns the token for panel 1. |
| `GET /api/comics` | Dashboard list for the logged-in user. |
| `GET /api/turn/:token` | Previous panel (signed URL), `isLast`, player and loop counts. Never the position. |
| `POST /api/turn/:token` | Submit a panel. For a next player without an account, send `mode: "email"` + `email` or `mode: "link"`. Friends with accounts are emailed automatically. The last panel returns `nameToken`. |
| `POST /api/comics/:id/name` | Last drawer names the comic once. Triggers the finished-comic emails. |
| `POST /api/comics/:id/resend\|skip\|cancel` | Creator controls. Skip invalidates the link and shortens the comic by one panel. |
| `GET /api/comics/:id` | Finished or ended: public panels. Active: status for participants (panel x/total, loop, who it waits on). |

Privacy: tokens are random 256-bit values stored only as SHA-256 hashes, and a token dies when its panel is submitted or the link is resent or skipped. Panels live in a private bucket and are only served as short-lived signed URLs. Emails typed for a no-account friend are used once and never stored.

## Decisions to know about
- Starting a comic requires Google login, so the creator can get reminders and use skip, cancel and resend. Everyone else can play without an account.
- The comic image is composed in the browser (as in the prototype) from the panel URLs.

## Still to build
- Pages: home/setup, `/play/[token]` (drawing studio), `/comic/[id]` (finished comic, download as image), `/dashboard` (status, resend, skip, cancel).
- Friend system: add/search friends UI and API (the `friendships` table is ready).
- Google sign-in button wiring (`supabase.auth.signInWithOAuth`) and the log-in prompt on submit.
- Optional: rate limiting on submit, and cleanup of old comics.
