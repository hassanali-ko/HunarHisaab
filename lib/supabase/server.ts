import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

/** Session aware client for server components and server actions. */
export async function createClient() {
  const jar = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => jar.set(name, value, options));
        } catch {
          // Called from a server component. The proxy refreshes the session.
        }
      },
    },
  });
}
