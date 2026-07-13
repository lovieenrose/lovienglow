import { createClient } from "@supabase/supabase-js";
let cached = null;
function getSupabaseBrowserClient() {
  if (cached) return cached;
  const url = "https://zdhhfmccabyxcxqnvjff.supabase.co";
  const anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpkaGhmbWNjYWJ5eGN4cW52amZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM4NTczNTYsImV4cCI6MjA5OTQzMzM1Nn0.sV8BlrEbpQooGReU8ZfRWobyft4LIhtrBPPwrQN80PE";
  cached = createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true }
  });
  return cached;
}
export {
  getSupabaseBrowserClient as g
};
