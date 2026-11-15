# Connect TravelSphere to Supabase

TravelSphere uses Supabase Auth for real email/password accounts and Supabase Postgres for profiles, preferences, and saved destinations. A `trip_plans` table is also included for the next planning feature. The static pages remain hosted on Vercel.

## 1. Create the Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Open **Project Settings → API** (or **API Keys**) and copy the project URL and the **publishable** key.
3. In **Authentication → URL Configuration**, add your Vercel website URL to **Site URL** and **Redirect URLs**. Add `http://localhost:8000/**` for local development.
4. In **SQL Editor**, open `supabase/schema.sql` from this repository, paste it into a new query, and run it once.

The schema enables Row Level Security on each user-data table. Keep those policies enabled so accounts can only read and change their own rows.

## 2. Confirm the browser connection

The TravelSphere project URL and publishable key are already filled in `assets/js/supabase-config.js`. Check those values against **Project Settings → API Keys** if you rotate the key or connect a different project:

```js
window.TRAVELSPHERE_SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT.supabase.co',
  publishableKey: 'sb_publishable_...'
};
```

The publishable key is designed for use in browser code. **Never put a `service_role` key, secret key, database password, or other privileged credential in this file.** Browser configuration is public; the database Row Level Security policies provide the user-data boundary.

If either value is blank, sign-in is intentionally unavailable and protected pages send visitors to the sign-in screen.

## 3. Verify authentication

1. Serve the repository locally with `python -m http.server 8000` and open `http://localhost:8000`.
2. Create an account from `signup.html`. If email confirmation is enabled, confirm the message Supabase sends before signing in.
3. Sign in, save a destination, then sign out and sign back in. Saved destinations and profile/preferences should come from Supabase and remain available on another device.
4. In Supabase **Table Editor**, inspect `profiles` and `saved_destinations`. Do not disable RLS to make an error disappear; fix the relevant policy or SQL instead.

## What is connected

- Email/password account creation, sign-in, restored sessions, and sign-out use Supabase Auth.
- Profile name and phone, currency/language preferences, and saved destinations sync to Supabase.
- Each user’s rows are protected by Row Level Security.
- `trip_plans` is ready in the database schema but the website does not yet have trip-plan create/edit screens.
- Password reset, social sign-in, two-factor authentication, notifications, and booking payments are not implemented.

The calculator’s route estimate is an independent planning aid. Enter city, state/country when names are ambiguous (for example, `Kochi, India`). The shown range uses straight-line distance and destination-level cost assumptions; it is not a live airfare or hotel-price feed. A flight-search link is provided for current fares.
