-- Invory: add a Company Logo field to the Business Profile, editable from
-- Settings and shown in the sidebar (falls back to the "Invory" wordmark
-- when unset).
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.

alter table business_profiles add column if not exists logo_url text;
