-- LovieNGlow: add a Business Type field to the Business Profile, collected
-- at signup alongside Company Name, Owner Name, and Currency.
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.

alter table business_profiles add column if not exists business_type text;
