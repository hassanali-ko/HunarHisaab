import "server-only";

import { createHmac, randomBytes } from "node:crypto";
import { createAnonClient } from "@/lib/supabase/anon";

/**
 * Rate limiting.
 *
 * Counters live in Postgres rather than in process memory, because the app is
 * expected to run as several short lived instances where an in memory counter
 * resets constantly and protects nothing.
 *
 * Identifiers are hashed before they are stored. A raw IP address is personal
 * data and there is no reason to keep one to count requests.
 */

export type Limit = { limit: number; windowSeconds: number };

export const LIMITS = {
  /** Parsing is cheap locally but can reach a paid provider. */
  parse: { limit: 30, windowSeconds: 60 },
  /** Sign in attempts, to blunt credential stuffing. */
  auth: { limit: 10, windowSeconds: 300 },
  /** Public confirmation, to stop someone walking tokens. */
  confirm: { limit: 20, windowSeconds: 300 },
  /** Writes in general. */
  write: { limit: 60, windowSeconds: 60 },
} satisfies Record<string, Limit>;

export type LimitName = keyof typeof LIMITS;

/**
 * Buckets are keyed with an HMAC, not a bare hash. The counting function is
 * reachable with the public anon key, so with an unsalted hash anyone who
 * knew a person's IP could compute her bucket and lock her out of signing in.
 * The secret comes from APP_ENCRYPTION_KEY when set; otherwise each instance
 * makes its own, which only means instances do not share counts.
 */
const SALT = process.env.APP_ENCRYPTION_KEY || randomBytes(32).toString("base64");

function hashId(value: string): string {
  return createHmac("sha256", SALT).update(value).digest("base64url").slice(0, 24);
}

/**
 * Best effort client identity. Behind a proxy the leftmost forwarded address
 * is the client, and everything after it is infrastructure.
 */
export function clientKey(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  const ip =
    (fwd ? fwd.split(",")[0]?.trim() : "") ||
    headers.get("x-real-ip") ||
    headers.get("cf-connecting-ip") ||
    "unknown";
  return hashId(ip);
}

export type LimitResult = { allowed: boolean; name: LimitName };

/**
 * Counts one hit. Fails open on a database error: a counter being unavailable
 * should slow nobody down, and the real protections are elsewhere.
 */
export async function rateLimit(
  name: LimitName,
  identity: string,
): Promise<LimitResult> {
  const { limit, windowSeconds } = LIMITS[name];
  try {
    const supabase = createAnonClient();
    const { data, error } = await supabase.rpc("bump_rate_limit", {
      p_bucket: `${name}:${identity}`,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
    if (error) return { allowed: true, name };
    return { allowed: data !== false, name };
  } catch {
    return { allowed: true, name };
  }
}

export function tooManyRequests(windowSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: "Too many requests. Wait a moment and try again.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(windowSeconds),
        "Cache-Control": "no-store",
      },
    },
  );
}
