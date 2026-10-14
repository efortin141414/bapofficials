IMPORTANT: This package now uses Supabase Edge Functions for Facebook posting. Ignore the older Vercel /api instructions below and follow SUPABASE_FACEBOOK_REMEDY.md.

# Fix: Facebook publishing failed (404)

This specific 404 means the browser could not find the website's Vercel API route `/api/facebook-post`. It is NOT yet a Facebook token error.

## Required GitHub/Vercel structure
The following must be at the Vercel project Root Directory:

- `index.html`
- `master.html`
- `master.js`
- `vercel.json`
- `api/facebook-post.js`
- `api/health.js`

Do not upload only the HTML/JS files and omit the `api` folder.

## Vercel settings
Use:
- Framework Preset: Other
- Root Directory: the folder that directly contains `index.html` AND the `api` folder
- Build Command: blank
- Output Directory: blank
- Install Command: blank

Redeploy after committing the `api` folder.

## Verify before testing Facebook
Open:

`https://YOUR-DOMAIN/api/health`

Expected JSON:

`{"ok":true,"service":"bapto-vercel-api",...}`

If `/api/health` returns 404, the Vercel Root Directory or repository file structure is still wrong.

Then open:

`https://YOUR-DOMAIN/api/facebook-post`

A browser GET should return a 405/Method Not Allowed response. That is GOOD because the function exists and accepts POST only.

## Environment variables
In Vercel > Project > Settings > Environment Variables (Production):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `FACEBOOK_PAGE_ID`
- `FACEBOOK_PAGE_ACCESS_TOKEN`

After adding or changing environment variables, redeploy Production.

If the API route works but Facebook rejects the token/page permissions, Master Admin will then show Facebook's actual Graph API error instead of a 404.
