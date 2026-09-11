BAPTO ADMIN LOGIN FIX
=====================

1. In Supabase > Authentication > Users, confirm that this user exists:
   bapnationalcom@gmail.com
   Make sure the email is confirmed and set/reset its password there.

2. In Supabase > SQL Editor:
   - Run database.sql first if you have NOT run it yet.
   - Then run FIX_ADMIN_LOGIN.sql.
   The last query must return one row and role = master_admin.

3. Replace these files in GitHub with the fixed package:
   admin.html
   admin.js
   admin.css
   supabase-config.js
   (Keep all other package files too.)

4. Commit changes and wait for Vercel to redeploy.

5. Open /admin in a PRIVATE/INCOGNITO window.
   First click "Test Connection".
   - If it says connection is working, enter your Supabase password and Sign In.
   - If it says it cannot reach Supabase, check Supabase project status and Project URL.

The login no longer stays indefinitely on "Signing in...". It now times out and shows the actual stage/error.
