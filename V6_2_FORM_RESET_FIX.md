# V6.2 — Form Reset Error Fix

Fixed:

`Cannot read properties of null (reading 'reset')`

Cause:
The form was being referenced through `e.currentTarget` after asynchronous
Supabase/storage operations. By that time the event target could already be
null.

Fix:
The form element is captured immediately before any `await` operation:

```js
const form = e.currentTarget;
```

and reset safely afterward:

```js
if (form && typeof form.reset === 'function') form.reset();
```

The same protection was also added to the Master Access "Add Position" form.

## If your Supabase RPC is already fixed
No new SQL is required for this particular error.

Replace the deployed website files with this V6.2 package and redeploy Vercel.

The existing `supabase/03_FIX_MASTER_CREATE_PROFILE_RPC.sql` is still included
for projects that have not yet installed the Master Create Profile RPC.
