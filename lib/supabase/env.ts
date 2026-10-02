/**
 * Environment access in one place, so a missing value fails with a sentence
 * someone can act on instead of a stack trace.
 *
 * Only two values are required to run this app. There is deliberately no
 * service role key in the runtime path.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  "";

export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function requireConfig(): { url: string; key: string } {
  if (!isConfigured) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, then restart.",
    );
  }
  return { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
}
