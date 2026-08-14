"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/uuid";

export type ConfirmState = { error?: string; confirmed?: boolean } | undefined;

/**
 * Public, unauthenticated confirmation. Scoped strictly to one public_token;
 * it can only ever flip status/confirmed_at and never returns seller data.
 */
export async function confirmOrder(
  _prev: ConfirmState,
  formData: FormData,
): Promise<ConfirmState> {
  const token = String(formData.get("token") ?? "");
  if (!isUuid(token)) return { error: "This confirmation link is not valid." };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Confirmation is unavailable right now." };
  }

  const { data, error } = await admin
    .from("orders")
    .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
    .eq("public_token", token)
    .is("confirmed_at", null)
    .select("id")
    .maybeSingle();

  if (error) return { error: "Could not confirm. Please try again." };
  if (!data) return { confirmed: true };

  revalidatePath(`/o/${token}`);
  return { confirmed: true };
}
