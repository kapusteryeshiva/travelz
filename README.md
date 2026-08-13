# Where We've Been 🌍

A shared friend-group travel map.

## Stack

- Next.js
- TypeScript
- Supabase
- react-svg-map
- @svg-maps/world

## Run locally

1. Install Node.js 20+.
2. Create a Supabase project.
3. In Supabase, enable **Anonymous Sign-Ins** under Authentication → Providers.
4. Open Supabase SQL Editor and run `supabase/schema.sql`.
5. Copy `.env.local.example` to `.env.local`.
6. Put your Supabase URL and publishable/anon key in `.env.local`.
7. Run:

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## How persistence works

Each browser receives a Supabase anonymous-auth user. Your display name is stored in `people`, and every visited country is stored in `visited_countries`.

The app subscribes to Supabase Realtime, so changes made by one friend can appear for everyone without manually refreshing.

## Next upgrades

The foundation is intentionally small. Good next features:

- group/invite links
- proper accounts
- country search
- continent statistics
- percentage of world visited
- visit dates
- notes/photos per country
- activity feed
- achievements
- friend-specific colors
- server-side leaderboard counts
