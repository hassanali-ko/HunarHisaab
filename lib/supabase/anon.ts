import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/**
 * A sessionless client for the two things that happen without a signed in
 * user: showing a buyer their confirmation page, and counting rate limits.
 *
 * Both go through security definer functions that expose a fixed, narrow set
 * of columns. The anon role holds no table privileges at all, so this client
 * cannot read an order even if it tried.
 */
export function createAnonClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { "x-hunarhisaab": "public" } },
  });
}
