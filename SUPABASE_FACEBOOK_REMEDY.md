# BAPTO Facebook Auto-Posting — Supabase Edge Function Remedy

This version **does not use `/api/facebook-post` on Vercel**.
The public website can stay on Vercel, but Facebook posting is handled by your existing Supabase project.

## Why this fixes the repeated 404

Your Vercel project is not exposing the `/api` server function. This package removes that dependency completely.
`master.js` now calls the Supabase Edge Function named `facebook-post` using the signed-in Master Admin session.

## 1. Upload the website files to GitHub

Upload/replace the website files from this package as usual. The `api/` folder is intentionally removed.
Commit the changes and let Vercel deploy the static website.

## 2. Create the Supabase Edge Function

In Supabase Dashboard:

1. Open your project.
2. Go to **Edge Functions**.
3. Create a new function named exactly: `facebook-post`
4. Replace its code with the contents of:
   `supabase/functions/facebook-post/index.ts`
5. Deploy the function.

The deployed URL will be similar to:
`https://YOUR-PROJECT.supabase.co/functions/v1/facebook-post`

## 3. Add the Facebook secrets in Supabase, NOT Vercel

Go to **Supabase > Edge Functions > Secrets** and add:

- `FACEBOOK_PAGE_ID` = `61595557911974`
- `FACEBOOK_PAGE_ACCESS_TOKEN` = your Facebook Page Access Token
- `FACEBOOK_GRAPH_VERSION` = `v26.0` (optional; the function defaults to v26.0)

Do NOT put your Page Access Token in GitHub, master.js, index.html, or chat.

Supabase automatically supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to deployed Edge Functions.

## 4. Test from Master Admin

1. Sign in at `/admin`.
2. Go to **Announcements**.
3. Publish a new announcement, or use **Post to FB** on a published announcement.
4. The website now invokes Supabase directly — there is no Vercel `/api` route involved.

If Facebook rejects the Page token or permissions, Master Admin will now display Facebook's actual error instead of a Vercel 404.

## 5. Old announcements

The existing **Post Pending Announcements to Facebook** button still works. It sends each published announcement without a `facebook_posted_at` value through the same Supabase Edge Function.

## Security

The Facebook Page Access Token remains server-side in Supabase Secrets. The browser only sends the announcement data and the signed-in user's Supabase access token. The Edge Function verifies that the caller's profile role is `master_admin` before it contacts Facebook.
