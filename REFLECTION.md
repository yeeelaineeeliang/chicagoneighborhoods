# HW3 Reflection — Chicago Neighborhood Intelligence

## Project Overview

Chicago Neighborhood Intelligence is a full-stack web app that helps people — especially newcomers like grad students relocating to Chicago — explore and compare the city's 77 community areas using real civic data. Instead of bouncing between separate websites for crime stats, housing info, and transit access, users can browse all neighborhoods in one place, see how each one ranks relative to others (e.g. "Safer than 72% of neighborhoods"), and dive into a detail page with live crime breakdowns pulled directly from the Chicago Data Portal's Socrata API. Logged-in users can save neighborhoods they're interested in to a personal favorites list stored in Supabase, scoped to their Clerk account. The app is built with Next.js, Tailwind CSS, and shadcn/ui, deployed on Vercel, and designed so that any classmate can sign up and start using it immediately.

## Reflection Questions

### 1. Trace a request: a user searches, saves, and views it on their profile. What systems are involved?

When a user searches for a neighborhood, the browser sends a GET request to `/api/neighborhoods?q=hyde`. Next.js (on Vercel) handles this route, which uses the Supabase JS client to query the `neighborhoods` and `neighborhood_stats` tables in Supabase (Postgres). Supabase's PostgREST layer executes the SQL and returns the results as JSON, which the API route sends back to the browser.

When the user saves a favorite, the browser sends a POST to `/api/favorites` with the neighborhood ID. The Next.js route first calls Clerk's `auth()` to verify the user is logged in and get their `userId`. It then inserts a row into the `user_favorites` table in Supabase with that `userId` and `neighborhood_id`.

When the user views their favorites, the browser hits GET `/api/favorites`. The route again calls Clerk's `auth()` to get the `userId`, then queries Supabase for all `user_favorites` rows matching that `userId`, joined with `neighborhoods` and `neighborhood_stats` for display data. The results flow back through Next.js to the browser.

Systems involved: **Browser → Vercel (Next.js) → Clerk (auth) → Supabase (Postgres database)**. For the detail page, there's also a live call to the **Chicago Socrata API** for crime breakdown data.

### 2. Why should your app call the external API from the server (API route) instead of directly from the browser?

Our app's external API is the **Chicago Socrata Open Data API** (data.cityofchicago.org). The City of Chicago publishes civic datasets — crime reports, affordable housing developments, community area boundaries — through Socrata, a platform that provides free, structured REST endpoints for public government data. We chose Socrata because it gives us access to real, city-maintained data that updates daily, which is exactly what a neighborhood comparison tool needs. The alternative would be scraping websites or using static datasets that go stale.

To access the Socrata API with higher rate limits, we registered for a free app token (`SOCRATA_APP_TOKEN`). If we called the API directly from the browser, that token would be exposed in the client-side JavaScript — anyone could extract it from the network tab and abuse our rate limit. By routing through a Next.js API route (`/api/neighborhoods/[id]/crime`), the token stays in the server environment (`process.env`) and is never sent to the browser.

Server-side proxying also lets us control caching (we use `next: { revalidate: 3600 }` to cache Socrata responses for 1 hour so we don't hit their rate limits on every page view), handle errors gracefully, and shape the response before sending it to the client. If the Socrata API changed its format or went down, we'd only need to update one route handler instead of every client component.

### 3. A classmate signs up on your app. What data does Clerk store vs. what does Supabase store? How are they connected?

**Clerk** stores the user's identity: email, password hash (or OAuth tokens if they used Google), profile picture, session tokens, and metadata like sign-up date. Clerk handles all the authentication logic — sign up, sign in, sign out, session management.

**Supabase** stores the application data: the 77 neighborhoods, their crime and housing stats, and the `user_favorites` table. When a user saves a neighborhood, Supabase stores a row with `user_id` (a text string), `neighborhood_id`, and `saved_at`.

They're connected through the `userId`. When a user is signed in, Clerk provides a unique `userId` (like `user_2x...`) via `auth()` on the server. Our API routes use this `userId` to filter Supabase queries — `INSERT INTO user_favorites (user_id, ...) VALUES ('user_2x...', ...)` and `SELECT * FROM user_favorites WHERE user_id = 'user_2x...'`. Clerk owns "who is this person?", Supabase owns "what did they save?"

### 4. Ask Claude (with MCP) to describe your database. Paste the response. Does it match your mental model?

**Claude MCP describes 4 tables in the public schema:**

- `neighborhoods` (77 rows) — `id`, `area_number` (unique), `name`, `created_at`. Has foreign keys from `neighborhood_stats` and `user_favorites`.
- `neighborhood_stats` (77 rows) — `id`, `neighborhood_id` (unique FK → neighborhoods), `crime_count`, `affordable_housing_units`, `updated_at`.
- `user_favorites` (0 rows) — `id`, `user_id` (text), `neighborhood_id` (FK → neighborhoods), `saved_at`.
- `favorites` (2 rows) — legacy table from a previous project with `user_id`, `title`, `author`, `cover_url`, `ol_key`. Not used by this app.

All tables have RLS enabled. This matches my mental model: `neighborhoods` is the reference table (77 Chicago community areas), `neighborhood_stats` holds pre-aggregated data from the Socrata API (one row per neighborhood), and `user_favorites` is the user-scoped join table linking Clerk users to neighborhoods. The `favorites` table is a leftover from a previous assignment and should be ignored. The schema is intentionally simple — three tables with clear foreign key relationships.
