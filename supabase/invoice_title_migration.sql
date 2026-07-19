-- Invory: per-order editable invoice title override, and removal of the
-- (now unused) invoice banner feature.
-- Paste this entire file into the Supabase SQL editor and run it. Safe to
-- re-run.
--
-- invoice_title defaults to null, meaning "use the business name" (the
-- InvoiceModal falls back to businessProfile.business_name automatically).
-- Set it per-order for an occasional co-branded sale, e.g. "LOVIE X PINC",
-- without touching the actual Business Profile.
--
-- business_profiles.invoice_banner_url is left in place (harmless, unused)
-- rather than dropped — the banner upload UI has been removed from the app,
-- but no data migration is needed since nothing reads/writes that column
-- anymore.

alter table sales_orders add column if not exists invoice_title text;
