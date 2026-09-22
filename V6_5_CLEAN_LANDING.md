# V6.5 — Clean Public Landing Page

Changes:
- Removed the Supabase Connection Test from the public workflow.
- After one-time database connection, the website goes directly to `/`.
- `/connection-test` now redirects to the normal landing page.
- Login errors no longer expose Supabase configuration instructions.
- The public landing page remains focused on:
  - Apply for Membership
  - Scan / Verify National ID
  - Login
  - Master Access

The one-time database configuration screen is shown only if the browser/app has
not yet been configured.

No new Supabase SQL migration is required for this UI change.
