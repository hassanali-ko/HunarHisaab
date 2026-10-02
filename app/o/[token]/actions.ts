"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";
import { uuid } from "@/lib/security/validate";

export type ConfirmState =
  | { ok: true; reason: "confirmed" | "already" }
  | { ok: false; reason: string }
  | undefined;

/**
 * Public confirmation.
 *
 * Runs as whoever is looking: usually nobody, sometimes the seller testing her
 * own link. Passing her session through is what lets the database turn her
 * away, so a seller cannot confirm her own order by accident or on purpose.
 * There is no elevated key here either way.
 */
export async function confirmOrder(
  _prev: ConfirmState,
  form: FormData,
): Promise<ConfirmState> {
  const token = String(form.get("token") ?? "");
  if (!uuid.safeParse(token).success) return { ok: false, reason: "not_found" };

  const { allowed } = await rateLimit("confirm", clientKey(await headers()));
  if (!allowed) return { ok: false, reason: "rate_limited" };

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("confirm_public_order", {
      p_token: token,
    });
    if (error) return { ok: false, reason: "error" };

    const row = Array.isArray(data) ? data[0] : data;
    if (row?.ok) {
      revalidatePath(`/o/${token}`);
      return { ok: true, reason: row.reason === "already" ? "already" : "confirmed" };
    }
    return { ok: false, reason: String(row?.reason ?? "error") };
  } catch {
    return { ok: false, reason: "error" };
  }
}
