BAPTO MASTER PAGE FIX

This version separates the login page from the Master Page.

1. /admin = login page only
2. Successful Supabase authentication + admin role check redirects to /master
3. /master verifies the active Supabase session and master_admin/regional_admin role
4. The Master Page is shown immediately after access is verified
5. If regions, gallery, announcements, posters, or members fail to load, the dashboard still opens and shows an error banner instead of returning to login.

UPLOAD/REPLACE ALL FILES IN THIS PACKAGE IN YOUR GITHUB REPOSITORY.
Then commit and wait for Vercel to redeploy.

Test:
https://YOUR-VERCEL-DOMAIN.vercel.app/admin

After sign in you should be redirected to:
https://YOUR-VERCEL-DOMAIN.vercel.app/master
