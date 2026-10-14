IMPORTANT: This package now uses Supabase Edge Functions for Facebook posting. Ignore the older Vercel /api instructions below and follow SUPABASE_FACEBOOK_REMEDY.md.

BAPTO VERCEL API - CURRENT FORMAT FIX
=====================================

This package changes the Vercel API functions to the current no-framework format:

api/ping.mjs
api/health.mjs
api/facebook-post.mjs

It also adds package.json with "type": "module" and forces Vercel framework detection to Other via vercel.json.

UPLOAD RULE:
Upload the CONTENTS of this folder to the ROOT of the same GitHub repository connected to your Vercel project.

The GitHub root must visibly contain:
  index.html
  master.html
  master.js
  package.json
  vercel.json
  api/
    ping.mjs
    health.mjs
    facebook-post.mjs

After commit, redeploy the latest commit in Vercel.

TEST IN THIS ORDER:
1. https://YOUR-VERCEL-DOMAIN.vercel.app/api/ping
   Expected: BAPTO API OK

2. https://YOUR-VERCEL-DOMAIN.vercel.app/api/health
   Expected JSON with "ok": true

3. https://YOUR-VERCEL-DOMAIN.vercel.app/api/facebook-post
   Expected status 405 with JSON: Method not allowed. Use POST.

If /api/ping is still 404, Vercel is NOT building the Git commit that contains the api folder. Check Vercel > Project > Settings > Git and verify repository + production branch, then check Build and Deployment > Root Directory.
