<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Parola Park - AI Studio App

This is the concierge app for Parola Park (Presing Park) in Sablayan, Occidental Mindoro.

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   - Windows PowerShell (recommended): `npm.cmd install`
   - macOS/Linux: `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   - Windows PowerShell: `npm.cmd run dev`
   - macOS/Linux: `npm run dev`

The dev server runs on `http://localhost:5173/`.

## Email Confirmation (Booking Receipt)

This app sends an email receipt after checkout by calling `POST /api/send-booking-confirmation`.

### Deploying on Vercel

The endpoint is implemented as a Vercel Serverless Function at `api/send-booking-confirmation.ts`.

### Recommended (Resend)

Add these environment variables in Vercel (Project → Settings → Environment Variables), then redeploy:

- `RESEND_API_KEY`
- `MAIL_FROM`
- `RESEND_FROM` (optional)
- `MAIL_REPLY_TO` (optional)

Notes:

- `MAIL_FROM` must be a verified sender in Resend.
- If you want to keep using a Gmail address, set `RESEND_FROM=onboarding@resend.dev` and `MAIL_REPLY_TO=your@gmail.com` (emails will be sent “from” Resend’s sender, but replies go to your Gmail).

### SMTP (fallback)

If `RESEND_API_KEY` is not set, the app will fall back to SMTP. Add these variables:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM` (example: `Parola Park <your@gmail.com>`)

### Troubleshooting (if email still does not send)

1) Confirm Vercel env vars are set in **Production** and you redeployed.

2) Check the API route works:

- Vercel → Project → Deployments → pick latest → Functions → `send-booking-confirmation`
- Look for errors like `MAIL_FROM is not configured` or `SMTP is not configured`.

3) Check the booking record in Firebase:

- `bookings/{bookingId}/email.sent` is `true` when the API returns `200`.
- If it fails, you will see `bookings/{bookingId}/email.errorMessage`.

4) Gmail-specific notes:

- `SMTP_PASS` must be a Google **App Password** (not your Gmail password).
- `MAIL_FROM` should usually use the same email as `SMTP_USER` (example: `Parola Park <your@gmail.com>`).

If these are missing/incorrect, bookings will still save to Firebase, but email sending will fail and the booking will be marked with `email.sent = false`.

### Running locally (optional)

You can run a local email server for development:

- `npm run server` (starts on `http://localhost:3001`)

In local development, Vite proxies `/api/*` to `http://localhost:3001` via `vite.config.ts`.

### Windows quick-start

If PowerShell blocks `npm` scripts with an execution policy error, run `run-parola.cmd`.
