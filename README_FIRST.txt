BAPTO FACEBOOK AUTO-POST FIX — NO VERCEL API REQUIRED

This version stops using /api/facebook-post on Vercel.
Facebook posting now uses a Supabase Edge Function, so the repeated Vercel 404 problem is bypassed completely.

STEP 1 — GITHUB
Replace only master.js in your GitHub repository with the master.js included in this package.
Commit the change and let Vercel redeploy your static website.

STEP 2 — SUPABASE EDGE FUNCTION
1. Open your Supabase project.
2. Go to Edge Functions.
3. Click Deploy a new function -> Via Editor.
4. Name the function exactly: facebook-post
5. Delete the sample code.
6. Copy ALL code from facebook-post-edge-function.ts into the editor.
7. Deploy the function.

STEP 3 — SUPABASE EDGE FUNCTION SECRETS
Open Edge Functions -> Secrets and add:

FACEBOOK_PAGE_ID = 61595557911974
FACEBOOK_PAGE_ACCESS_TOKEN = your Facebook Page Access Token

Do not put the access token in GitHub and do not send it in chat.
Supabase already provides SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to hosted Edge Functions.

STEP 4 — TEST THE FUNCTION
Open this URL in a browser:
https://fizyesuapokjgfviwulr.supabase.co/functions/v1/facebook-post

Expected response contains:
"ok": true
"platform": "supabase-edge-functions"

If facebookConfigured is false, the two Facebook secrets are not saved yet.

STEP 5 — TEST MASTER ADMIN
Open Master Access and publish an announcement.
The website will call the Supabase Edge Function directly.
Existing functions in master.js still support:
- auto-posting newly published announcements
- Post to FB per announcement
- Post Again
- Post Pending Announcements to Facebook

IMPORTANT
You no longer need api/facebook-post.js or api/health.js in Vercel for Facebook publishing.
