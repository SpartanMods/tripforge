-- ============================================================
-- Migration 0002 — richer trip planning data
-- Adds a flexible jsonb `metadata` column to trips.
-- Run in the Supabase SQL editor on existing projects.
--
-- metadata shape (all optional):
--   {
--     "travellers": [{ "id": "t-1", "name": "Alex", "budget": 1200 }],
--     "budgetBreakdown": { "flights": 600, "hotels": 500, ... },
--     "preferredAirlines": ["BA", "AF"],
--     "savedFlights": [{ "id", "airline", "from", "to", "date", "price", "currency" }],
--     "savedHotels":  [{ "id", "name", "city", "pricePerNight", "currency", "rating" }]
--   }
-- ============================================================

alter table public.trips
  add column if not exists metadata jsonb default '{}';
