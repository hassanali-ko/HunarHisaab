import { NextResponse } from "next/server";
import { parseOrder } from "@/lib/parser";
import { enhance, worthAsking } from "@/lib/ai/enhance";
import { decryptSecret, encryptionAvailable } from "@/lib/ai/crypto";
import { isProviderId } from "@/lib/ai/providers";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { parseRequest } from "@/lib/security/validate";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });

/**
 * Order parsing.
 *
 * The browser already runs the built in parser on its own, so this route only
 * exists for the optional AI pass, which needs a key that must never reach
 * the client. It still returns a rule based result if anything goes wrong.
 */
export async function POST(request: Request) {
  const { allowed } = await rateLimit("parse", clientKey(request.headers));
  if (!allowed) {
    return json({ error: "Too many requests. Wait a moment." }, 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const parsedBody = parseRequest.safeParse(body);
  if (!parsedBody.success) {
    return json({ error: parsedBody.error.issues[0]?.message }, 400);
  }

  const { text, useAi } = parsedBody.data;
  const local = parseOrder(text);

  if (!useAi) return json({ data: local });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return json({ data: local, warning: "Sign in to use AI assist." });

  if (!encryptionAvailable()) {
    return json({ data: local, warning: "This server cannot store AI keys." });
  }

  const { data: cred } = await supabase
    .from("ai_credentials")
    .select("provider, model, encrypted_key")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!cred || !isProviderId(cred.provider)) {
    return json({ data: local, warning: "No AI key saved." });
  }

  // Nothing to gain from a network call when the rules already read it all.
  if (!worthAsking(local)) return json({ data: local });

  let key: string;
  try {
    key = decryptSecret(cred.encrypted_key as string);
  } catch {
    return json({ data: local, warning: "Saved key could not be read." });
  }

  const { result, error } = await enhance(
    local,
    text,
    cred.provider,
    key,
    cred.model as string,
  );

  if (!error) {
    await supabase
      .from("ai_credentials")
      .update({ last_used_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  return json({ data: result, warning: error ?? undefined });
}
