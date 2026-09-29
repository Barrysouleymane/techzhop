# TechZhop Mobile (Expo / React Native)

iOS + Android app for TechZhop. It uses the **same Supabase project** and the **same backend** as the website.

## Screens
- Home (hero, categories, latest products)
- Products (search + category filter)
- Product details (add to cart, ♥ wishlist)
- Cart (quantities, Stripe checkout in the browser)
- Account (login / sign up, orders, wishlist, logout)

## First run
```bash
cd mobile
npm install
npx expo install --fix   # aligns every package on the installed Expo SDK
npx expo start
```
Scan the QR code with the **Expo Go** app on your phone.

## Configuration (`mobile/.env`)
| Variable | Value |
|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | same as `VITE_SUPABASE_URL` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | same as `VITE_SUPABASE_ANON_KEY` |
| `EXPO_PUBLIC_API_URL` | `http://<your-Mac-IP>:8000` — **not** `localhost`, a phone can't reach your Mac's localhost. Find the IP with `ipconfig getifaddr en0`. |

The backend must be running (`cd backend && npm run dev`).
