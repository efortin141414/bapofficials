# BAPTO Master Admin — Setup Guide

This package upgrades the current BAPTO static website into a Supabase-powered site with a secure admin login.

## Files to upload to GitHub / Vercel
Upload all of these files together:

- `index.html` — updated public website
- `styles.css` — updated public styles
- `script.js` — existing site interactions
- `public-data.js` — loads announcements, gallery, regional posters and members from Supabase
- `supabase-config.js` — your Supabase Project URL + anon/public key
- `admin.html`, `admin.css`, `admin.js` — Master Admin dashboard
- `member.html`, `member.js` — public member verification page
- `vercel.json` — clean `/admin` and `/member` routes
- `database.sql` — run once in Supabase SQL Editor; do not expose any secret key in it

## Step 1 — Create / open your Supabase project
In Supabase, open **Project Settings > API** and copy:

1. Project URL
2. `anon` / public key

Open `supabase-config.js` and replace only the two placeholder values.

**Never put the `service_role` key in the website files.**

## Step 2 — Create the database
Open **Supabase > SQL Editor > New query**.
Paste the complete contents of `database.sql` and click **Run**.

This creates:

- regions
- profiles / admin roles
- chapters
- announcements
- gallery
- regional_posters
- members
- seminars
- national_officers
- public `media` storage bucket
- Row Level Security policies

## Step 3 — Create your Master Admin account
Go to **Supabase > Authentication > Users** and create your admin user with your chosen email and password.
Copy that user's UUID.

Then run this in the SQL Editor, replacing the sample values:

```sql
insert into public.profiles(id, full_name, role)
values('PASTE-AUTH-USER-UUID-HERE', 'Your Name', 'master_admin')
on conflict(id) do update set full_name=excluded.full_name, role='master_admin';
```

## Step 4 — Upload the package to GitHub
Replace the files in the same repository connected to Vercel. Commit the changes. Vercel should redeploy automatically.

Keep Vercel as:

- Framework Preset: **Other**
- Build Command: blank
- Output Directory: blank
- Install Command: blank

## Step 5 — Test the admin page
Open your Vercel production domain first:

`https://YOUR-PROJECT.vercel.app/admin`

Sign in using the Master Admin email/password you created in Supabase.

After your free domain is configured to preserve paths, you can use:

`https://baptechnicalofficials.freepage.cc/admin`

If the free domain only redirects the homepage and does not preserve `/admin`, use the Vercel production domain for the admin dashboard while keeping the free domain for the public homepage.

## What the current Admin dashboard can manage

### Announcements
- title
- category
- date
- description
- poster/image
- publish/draft

### Gallery
- event/album
- region
- event date
- photo
- caption

### Regional Posters
- region
- person name
- position
- poster
- caption

### Members
- member ID
- name
- region
- position
- accreditation level
- validity date
- member photo
- active/inactive
- public/private verification profile

## Public member verification
A public profile uses:

`/member?id=MEMBER-ID`

Example:

`https://YOUR-PROJECT.vercel.app/member?id=NCR-2026-000001`

This can later be converted into a QR code on membership IDs.

## Security notes
- Do not store service-role keys in GitHub.
- Use only the Supabase public/anon key in `supabase-config.js`.
- Master Admin permissions are enforced by Supabase Row Level Security, not only by hiding buttons.
- Keep personal phone numbers, home addresses and private email addresses out of public member profiles.
