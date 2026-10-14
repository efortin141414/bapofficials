IMPORTANT: This package now uses Supabase Edge Functions for Facebook posting. Ignore the older Vercel /api instructions below and follow SUPABASE_FACEBOOK_REMEDY.md.

# BAPTO Facebook Auto-Posting Setup

The website is already coded to publish a saved **published announcement** to a Facebook **Page** when the Master Admin leaves **Automatically post to Facebook Page** checked.

## 1. Run the database migration
In Supabase > SQL Editor, run `EVENTS_FACEBOOK_UPDATE.sql`.

## 2. Set the public Facebook links
Open `/master` > **Events & Accreditation** and enter:
- Official Facebook Page URL
- Official Facebook Group URL

These are public links and can safely be stored in Supabase.

## 3. Configure secure Vercel Environment Variables
In Vercel > Project > Settings > Environment Variables, add these to Production:

- `SUPABASE_URL` = your Supabase project URL
- `SUPABASE_ANON_KEY` = your Supabase publishable/anon key
- `FACEBOOK_PAGE_ID` = the numeric Meta/Facebook Page ID
- `FACEBOOK_PAGE_ACCESS_TOKEN` = a Page Access Token that is allowed to publish Page posts

Never put the Page Access Token in `index.html`, `master.js`, `supabase-config.js`, GitHub, or any public browser file.

After adding environment variables, redeploy the project.

## 4. Facebook Group note
The public site can link directly to your Facebook Group. Automatic server-side posting is implemented for a Facebook **Page**, not a Group. Group publishing access is controlled by Meta and may not be available for a normal group/app configuration.

## 5. Test
1. Open `/master`.
2. Add a test announcement.
3. Keep **Publish immediately** and **Automatically post...** checked.
4. Save.
5. The website announcement is saved first. If Facebook is configured, the Page post is created too.

If Facebook is not configured or rejects the post, the website announcement remains saved and Master Admin shows the Facebook error.
