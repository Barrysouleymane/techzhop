# TechZhop

Electronics store — **website** (React + Vite), **mobile app** (Expo / React Native) and **API** (Express), all using the same Supabase database and Stripe payments.

```
techzhop/
├── src/            website
├── mobile/         iOS / Android app (Expo)
├── backend/        API: Stripe checkout + webhook, orders, admin, account deletion
├── shared/         shared by website + app
│   ├── locales/    translations (en, fr, es, pt, de, zh)
│   └── settings.js languages, currencies, order statuses
└── supabase/migrations/  SQL to run in Supabase
```

## Features
- 6 languages, detected automatically from the device/browser, changeable in Settings
- Prices shown in the customer's currency (live exchange rates), charged in USD
- Light / dark / automatic theme
- Account: profile + photo, addresses, orders with tracking, wishlist, notification
  preferences, change / forgot password, delete account, help & FAQ, terms, privacy
- Admin (`/admin`): add products, update order status + tracking number
  (the customer gets a push notification on the app)

## First-time setup
1. **Database** — Supabase → SQL Editor → paste `supabase/migrations/20260929_account_features.sql` → Run.
2. **Password reset links** — Supabase → Authentication → URL Configuration → add
   `http://localhost:5173/reset-password` (and your real domain later) to *Redirect URLs*.
3. **Environment files** — copy each `.env.example` to `.env` and fill it
   (`.env`, `backend/.env`, `mobile/.env`).

## Run
```bash
# API
cd backend && npm install && npm run dev

# Website  → http://localhost:5173
npm install && npm run dev

# Mobile app (scan the QR code with Expo Go)
cd mobile && npm install && npm run setup && npx expo start
```

## Push notifications (mobile)
Link the app to your Expo account once: `cd mobile && npx eas-cli@latest init`.

## Translations
Edit the files in `shared/locales/`. Every language must have the same keys as `en.json`.
