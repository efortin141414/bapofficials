# V6.11 — Remove Email Confirmation / Automatically Continue to Step 2

## Website change

After a new member creates an account:

Step 1 — Create Account
→ automatically opens
Step 2 — Membership Application Form

There is no "check your email first" screen in the application.

A visible 4-step progress bar is now shown:

1. Create Account
2. Membership Form
3. Payment
4. Membership / ID & Certificate

## REQUIRED SUPABASE SETTING

This cannot be disabled by frontend code or normal SQL.

In Supabase:

1. Open the project.
2. Go to `Authentication`.
3. Open `Providers`.
4. Select `Email`.
5. Find `Confirm email`.
6. Turn `Confirm email` OFF.
7. Save.

After this is disabled, `supabase.auth.signUp()` returns an authenticated
session immediately and V6.11 redirects the member directly to `/member`.

If Confirm email remains enabled, V6.11 intentionally shows an error telling
the administrator which Supabase setting still needs to be changed.

## No SQL migration required

V6.11 changes the registration workflow only. No new database migration is
needed if V6.10 is already installed.
