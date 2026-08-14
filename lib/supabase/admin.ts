import "server-only";

import { createClient } from "@supabase/supabase-js";
import { requireServiceKey, SUPABASE_URL } from "./env";

/**
 * Service-role client. Bypasses RLS, so every call site must scope the query
 * itself. In this app that means: only ever by a single public_token, and
 * only selecting fields listed in PublicOrder.
 */
export function createAdminClient() {
  return createClient(SUPABASE_URL, requireServiceKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
