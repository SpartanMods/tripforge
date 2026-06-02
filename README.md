# TripForge

**Collaborative trip planning — from "where should we go?" to "we're booked."**

TripForge is a full-stack web app that helps individuals and groups plan trips end-to-end. It aggregates flights, hotels, Airbnbs, trains, and activities into a single view, lets friends vote on options in real time, and tracks the total cost as you build.

---

## What it does

### Destination discovery
Not sure where to go? Describe what you want — budget, vibe, travel dates, departure city — and TripForge suggests destinations with estimated total costs. Each suggestion shows the average flight cost, nightly accommodation cost, and estimated daily spend so you can compare at a glance.

### Multi-stage trip planner
Planning a trip that hits multiple cities? TripForge treats each destination as a stop in a sequence, with its own arrival and departure dates. Flights, accommodation, and activities are organised per leg, and a day-by-day itinerary view ties everything together.

### Search and compare
- **Flights** — search by route, dates, passengers, and class. Results are sorted by price and include airline, duration, stops, and a direct booking link.
- **Hotels & Airbnbs** — search by destination and dates. Hotels and Airbnbs are shown side by side so you can compare on price, rating, and room type without switching tabs.
- **Trains** — search rail connections between any two cities. Results show operator, journey time, price, and a booking link.
- **Things to do** — search nearby attractions, restaurants, and experiences powered by Google Places.

Every result has a **"Save to trip"** button that adds it to your itinerary with one tap.

### Collaborative planning
- Invite friends by email or a shareable link
- Collaborators can add suggestions, upvote or downvote options, and leave comment threads on individual items
- Changes appear in real time for everyone in the trip — no refreshing
- An activity feed shows who added or changed what and when

### Budget tracker
- Set a total budget for the trip at the start
- A running total updates as items are saved or confirmed
- Breakdown by category: flights, accommodation, transport, activities
- Per-person cost split calculated automatically from the travellers count

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Styling | Tailwind CSS v3 + shadcn/ui |
| Routing | React Router v6 |
| Backend / Auth | Supabase (PostgreSQL, Auth, Real-time) |
| Deployment | Vercel |
| Flights | Amadeus API |
| Hotels | Hotels.com via RapidAPI |
| Airbnb | Airbnb scraper via RapidAPI |
| Trains | Rome2rio API |
| Things to do | Google Places API |
| AI discovery | Anthropic Claude API (server-side Edge Function) |

---

## Project structure

```
src/
├── lib/
│   └── supabase.ts          # Single Supabase client instance
├── services/                # One file per external API
│   ├── amadeus.ts           # Flight search (Amadeus)
│   ├── hotels.ts            # Hotel search (Hotels.com / RapidAPI)
│   ├── airbnb.ts            # Airbnb listings (RapidAPI)
│   ├── trains.ts            # Rail search (Rome2rio)
│   ├── places.ts            # Attractions & dining (Google Places)
│   └── discovery.ts        # AI destination suggestions (Claude)
├── components/
│   ├── ui/                  # shadcn/ui primitives (button, input, card…)
│   ├── layout/              # Header, Layout wrapper
│   └── auth/                # LoginForm, SignupForm
└── pages/
    ├── Auth.tsx             # Sign in / Create account page
    └── Home.tsx             # Trip creation + dashboard

supabase/
└── schema.sql               # Full database schema with RLS policies
```

---

## Database schema

```
profiles          — username, phone, avatar (extends auth.users)
trips             — title, destinations (jsonb), budget, owner
trip_members      — who's in each trip and their role
trip_items        — saved flights / hotels / trains / activities
suggestions       — comments and upvotes on trip items
itinerary_days    — day-by-day notes for each leg of the trip
```

`trips.destinations` is stored as a JSON array to support multi-stage itineraries natively:

```json
[
  { "city": "Paris",  "country": "France", "from": "2026-09-01", "to": "2026-09-05" },
  { "city": "Rome",   "country": "Italy",  "from": "2026-09-05", "to": "2026-09-10" }
]
```

All tables have Row Level Security (RLS) enabled. Trip owners have full access; collaborators can view and contribute but not delete the trip.

---

## Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- API keys for the external services you want to use (see below)

### 1. Clone and install

```bash
git clone <your-repo-url>
cd TripForge
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your keys:

```env
# Supabase — Settings > API in your Supabase dashboard
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Amadeus — https://developers.amadeus.com (free sandbox available)
VITE_AMADEUS_API_KEY=
VITE_AMADEUS_API_SECRET=

# RapidAPI — used for Hotels.com and Airbnb
VITE_RAPIDAPI_KEY=

# Google Places — https://console.cloud.google.com
VITE_GOOGLE_PLACES_API_KEY=

# Anthropic — server-side only, never expose in the browser
ANTHROPIC_API_KEY=
```

### 3. Apply the database schema

In your Supabase dashboard, go to **SQL Editor** and run the contents of `supabase/schema.sql`. This creates all tables, RLS policies, triggers, and enables real-time on the relevant tables.

### 4. Configure Google OAuth (optional)

In your Supabase dashboard go to **Authentication → Providers → Google** and add your Google OAuth client ID and secret. Add `http://localhost:5173` as an authorised redirect URL in the Google Cloud Console.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Auth

TripForge supports three sign-in methods:

| Method | Notes |
|---|---|
| **Email + password** | Works out of the box once Supabase is configured |
| **Username + password** | Requires a Supabase Edge Function (`username-signin`) to look up the user's email — not yet deployed |
| **Phone OTP** | Requires Twilio configured in Supabase Authentication settings |
| **Google OAuth** | Requires Google OAuth app configured in Supabase |

All accounts have a `username` field (set at sign-up) that appears in the app greeting and is used for `@mentions` in comments.

---

## Feature roadmap

| Feature | Status |
|---|---|
| Project scaffold + auth | ✅ Complete |
| Supabase schema + RLS | ✅ Complete |
| Multi-stage trip creation | ✅ Complete |
| Destination discovery (AI) | 🔲 Next |
| Flight search (Amadeus) | 🔲 Next |
| Hotel + Airbnb search | 🔲 Planned |
| Train search | 🔲 Planned |
| Things to do | 🔲 Planned |
| Collaborative invites + voting | 🔲 Planned |
| Real-time activity feed | 🔲 Planned |
| Budget tracker | 🔲 Planned |
| Username sign-in Edge Function | 🔲 Planned |
| Vercel deployment | 🔲 Planned |

---

## Development conventions

- Components live in `src/components/`, pages in `src/pages/`
- One component per file, named in PascalCase
- API calls live in `src/services/` — one file per external service
- `async/await` throughout — no `.then()` chains
- All data-fetching components handle loading and error states
- Environment variables for all API keys — never hardcoded
- Components are kept under ~150 lines; anything larger is split

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite dev server on port 5173 |
| `npm run build` | TypeScript check + production build |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
