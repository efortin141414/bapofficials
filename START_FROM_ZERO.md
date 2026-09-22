# BAP NATIONAL MEMBERSHIP SYSTEM — START FROM ZERO

This package is for a completely NEW GitHub repository, NEW Vercel project, and NEW Supabase project.
Do not copy old SQL files or old Supabase credentials into this project.

## 1. Delete the old systems only if you do not need their data
Deleting the old Supabase project permanently removes users, database records, and uploaded files.

## 2. Create a NEW Supabase project
After it finishes creating, open SQL Editor > New Query.
Run only:

`supabase/01_FRESH_SUPABASE_SETUP.sql`

Run it once. Do not run any old setup or repair script.

## 3. Create the Master Administrator
Supabase > Authentication > Users > Add user.
Create your chosen Master account and password.

Then open:

`supabase/02_PROMOTE_MASTER.sql`

Replace `YOUR_MASTER_EMAIL@example.com` with the Master email and run the query.
The result must show:

`role = national_admin`

## 4. Connect the website to the NEW Supabase project
Get the new Project URL and Publishable/anon public key from Supabase.
Edit:

`public/supabase-config.js`

Use:

```js
window.BAP_SUPABASE_CONFIG = {
  supabaseUrl: "https://YOUR-NEW-PROJECT.supabase.co",
  supabaseKey: "YOUR_NEW_PUBLISHABLE_KEY"
};
```

Never put a service_role key or Master password in website files.

## 5. Create a NEW GitHub repository
Upload the CONTENTS of this package directly to the repository root.
The root must contain:

- index.html
- main.jsx
- styles.css
- embedded-assets.js
- package.json
- vite.config.js
- vercel.json
- public/
- supabase/

Do not upload the ZIP as the application and do not put everything inside an extra parent folder.

## 6. Create a NEW Vercel project
Import the new GitHub repository.
Use:

- Framework Preset: Vite
- Root Directory: blank / repository root
- Install Command: npm install
- Build Command: npm run build
- Output Directory: dist

No Supabase Vercel environment variables are required by this package because it uses `public/supabase-config.js`.

## 7. Test before Master Login
Open:

`https://YOUR-DOMAIN/connection-test`

Click Test Supabase Connection. It must say Connected successfully.

Then open:

`https://YOUR-DOMAIN/master-login`

## 8. Master Access — Positions Database
After Master login, open the `Positions` tab.
Master Access can:

- Add a new official position
- Edit the position name
- Set a category
- Change sort order
- Activate/deactivate a position
- Delete a position

Active positions automatically appear in the Member Application position dropdown.

Seeded positions include National Commissioner, National President, Vice President, Regional Director, Provincial Director, Provincial Commissioner, City Commissioner, Municipal Commissioner, Referee, Table Official, and Technical Official. You may modify these from Master Access.
