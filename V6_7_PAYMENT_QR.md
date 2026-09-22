# V6.7 — Membership Form → QR Payment

New workflow:

1. Member creates/signs in to an account.
2. Member completes the Membership Application.
3. Member clicks `Save Membership Application`.
4. The application is saved to Supabase.
5. The member is automatically redirected to:
   `/payment/{member-id}`
6. The payment page shows four QR payment choices:
   - BDO
   - UnionBank
   - GCash
   - Maya
7. The page displays:
   - Applicant name
   - ₱700 Membership/National ID fee
   - ₱100 Accreditation/Licensing fee
   - ₱800 total
8. The member scans the selected QR using a supported bank/e-wallet.
9. Administrator verifies payment and marks the member Paid in Master/Regional Access.

The payment page does NOT automatically charge the user and does NOT
automatically verify a bank transfer. It displays the supplied official QR
images for payment.

## QR image files

`public/payments/bdo.jpg`
`public/payments/unionbank.jpg`
`public/payments/gcash.jpg`
`public/payments/maya.jpg`

## Mobile/Desktop Configuration

This version also reads these Vercel environment variables before browser
localStorage:

- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY
- VITE_PUBLIC_SITE_URL

This prevents each mobile browser from needing its own Supabase configuration
when the Vercel environment variables are set and the project is redeployed.
