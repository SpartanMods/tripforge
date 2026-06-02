# TripForge — End-to-End Trip Planning App

## Project overview
A collaborative web app that helps users plan trips from scratch — discovering destinations, comparing costs across flights, hotels, Airbnbs, and trains, finding the best things to do, and inviting friends to contribute to the plan.

## Core user problems this solves
- "I don't know where to go" — help users discover destinations by budget, vibe, season, or interest
- "I can't see total trip cost in one place" — aggregate flights, accommodation, and transport into one view
- "Planning with friends is a mess" — shared trip plans with collaborative suggestions and voting

---

## Tech stack
- **Frontend:** React + Tailwind CSS
- **Backend:** Supabase (database, auth, real-time collaboration)
- **Deployment:** Vercel
- **Language:** JavaScript / TypeScript

## External APIs to integrate
- **Flights:** Amadeus API or Sky Scanner API (search + pricing)
- **Hotels:** Booking.com API or Hotels.com (RapidAPI)
- **Airbnb:** Airbnb unofficial API via RapidAPI
- **Trains:** Trainline API or Rome2rio API
- **Things to do:** Google Places API or Tripadvisor API
- **Destination discovery:** OpenAI or Claude API for natural language queries ("where should I go in Europe under $2k in October?")

---

## App structure (features)

### 1. Destination discovery
- User inputs: budget, travel dates, departure city, trip vibe (beach, city, adventure, culture)
- App suggests destinations with estimated total cost range
- Each destination card shows: avg flight cost, avg hotel/Airbnb cost, estimated daily spend

### 2. Trip planner
- Once destination is selected, user builds a trip itinerary
- Day-by-day planning with cost tracking
- Tabs: Flights | Accommodation | Transport | Things to Do | Budget summary

### 3. Search and compare
- Flight search: depart/return, passengers, class — returns sorted results with links
- Accommodation: date range, guests — shows hotels and Airbnbs side by side
- Trains: origin/destination, date — returns rail options with pricing
- All results show price, rating, key details, and a "Save to trip" button

### 4. Collaborative planning
- Trip owner can invite friends via email or shareable link
- Collaborators can: view the plan, add suggestions, upvote/downvote options
- Real-time updates via Supabase subscriptions
- Activity feed showing who added/changed what
- Comment threads on individual items (flights, hotels, activities)

### 5. Budget tracker
- Running total of saved items vs. user-set budget
- Breakdown by category: flights, accommodation, transport, activities
- Per-person cost split for group trips

---

## Data models (Supabase)

```
trips
  id, title, destination, start_date, end_date, budget, owner_id, created_at

trip_members
  trip_id, user_id, role (owner | collaborator), joined_at

trip_items
  id, trip_id, category (flight | hotel | airbnb | train | activity), title,
  price, currency, url, status (saved | suggested | confirmed), added_by,
  created_at

suggestions
  id, trip_item_id, user_id, comment, upvotes, created_at

itinerary_days
  id, trip_id, date, notes
```

---

## UI principles
- Mobile-first — most users will be on their phones
- Clean, modern travel aesthetic — think a minimal Airbnb/Google Flights hybrid
- Skeleton loaders while API results load
- Clear cost visibility everywhere — price should never be buried
- Optimistic UI for collaborative actions (show changes instantly, sync in background)

---

## Coding conventions
- Components in `/src/components`, pages in `/src/pages`
- One component per file, named in PascalCase
- Supabase client initialized once in `/src/lib/supabase.js`
- API calls wrapped in `/src/services/` (one file per external service)
- Use async/await throughout, no raw .then() chains
- Always add loading and error states to data-fetching components
- Comment any logic that isn't immediately obvious

---

## Dev rules
- Always explain what you're building before writing code
- List files you'll create or modify before touching anything
- Ask before deleting files or making structural changes
- Keep components small and focused — if it's over ~150 lines, suggest splitting it
- Use environment variables for all API keys (never hardcode)
- After each feature, remind me to test it and commit to git

---

## Current status
[x] Project scaffolded
[ ] Supabase project created + schema applied
[x] Auth (sign up / login) working
[x] Destination discovery UI — "Pick a city" (country + 3 interests → best-fit city)
[x] Flight search UX (mock-backed; preferred-airline selection; live API pending key)
[x] Accommodation search UX (mock-backed; live API pending key)
[ ] Train search integrated
[ ] Things to do integrated
[ ] Collaborative planning (invites, suggestions, real-time)
[x] Budget tracker — per-traveller budgets + optional advanced category breakdown
[x] My Trips — save / list / open / delete trips
[x] Profile — update details + reset password while logged in
[ ] Deployed to Vercel

---

## Environment variables needed
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_AMADEUS_API_KEY=
VITE_GOOGLE_PLACES_API_KEY=
VITE_RAPIDAPI_KEY=
ANTHROPIC_API_KEY=
```
