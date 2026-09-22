# V6.14 — Verified Working Payment QR

The original payment images were screenshots with logos and surrounding UI.
V6.14 regenerates the actual payment QR content into clean black-and-white PNG
QR codes.

Included and verified:
- BDO
- UnionBank
- GCash
- Maya

Files:
- public/payments-clean/bdo.png
- public/payments-clean/unionbank.png
- public/payments-clean/gcash.png
- public/payments-clean/maya.png

The payment page now includes:
- visible verified QR
- Open / Save QR
- Download QR Image
- same-phone payment instructions

If the member is paying on the same phone, save the QR image and use the
bank/e-wallet app's Upload QR / Scan from Gallery feature.

No new Supabase SQL migration is required if V6.13 is already installed.
