# Firebase Cloud Functions Setup

This directory contains Firebase Cloud Functions that automatically send booking confirmation emails when new bookings are saved to the database.

## Setup

1. Install Firebase CLI globally:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase in your project:
   ```bash
   firebase init
   ```
   - Select "Functions" and "Hosting"
   - Choose your existing Firebase project
   - Select TypeScript for functions

4. Install dependencies:
   ```bash
   cd functions
   npm install
   ```

## Environment Variables

Set these environment variables in your Firebase Functions configuration:

```bash
# For Resend (recommended)
firebase functions:config:set resend.api_key="your_resend_api_key"
firebase functions:config:set mail.from="noreply@parolapark.com"

# Or for SMTP fallback
firebase functions:config:set smtp.host="smtp.gmail.com"
firebase functions:config:set smtp.port="587"
firebase functions:config:set smtp.user="your_email@gmail.com"
firebase functions:config:set smtp.pass="your_app_password"
firebase functions:config:set mail.from="noreply@parolapark.com"
```

## Deploy

Deploy the functions:
```bash
npm run functions:deploy
```

Or deploy everything:
```bash
npm run deploy
```

## Development

Run functions locally:
```bash
cd functions
npm run serve
```

## How it works

When a new booking is created in the `bookings` collection, the `sendBookingConfirmation` function automatically:

1. Builds an HTML email receipt
2. Sends it via Resend (preferred) or SMTP (fallback)
3. Updates the booking document with email status

The email includes:
- Customer details
- Payment information and reference number
- Itemized booking details
- Total amount
- Park account number for e-wallet payments