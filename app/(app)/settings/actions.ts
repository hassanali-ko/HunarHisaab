"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/data";
import {
  encryptionAvailable,
  encryptSecret,
  maskKey,
} from "@/lib/ai/crypto";
import { isProviderId, PROVIDERS } from "@/lib/ai/providers";
import { firstError, formToObject, profileInput } from "@/lib/security/validate";

export type SettingsState = { error?: string; ok?: string } | undefined;

export async function saveProfile(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const { supabase, user } = await requireUser();
  const parsed = profileInput.safeParse(formToObject(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: "saved" };
}

const keyInput = z.object({
  provider: z.string(),
  model: z.string().trim().min(1).max(80),
  api_key: z.string().trim().min(10, "That key looks too short.").max(400),
});

export async function saveAiKey(
  _prev: SettingsState,
  form: FormData,
): Promise<SettingsState> {
  const { supabase, user } = await requireUser();

  if (!encryptionAvailable()) {
    return {
      error:
        "This server has no APP_ENCRYPTION_KEY set, so keys cannot be stored safely.",
    };
  }

  const parsed = keyInput.safeParse(formToObject(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { provider, model, api_key } = parsed.data;
  if (!isProviderId(provider)) return { error: "Unknown provider." };
  // Only models we have actually offered, so the value cannot be used to
  // steer a request somewhere unexpected.
  if (!PROVIDERS[provider].models.includes(model)) {
    return { error: "Pick one of the listed models." };
  }

  // A cheap shape check catches a pasted mistake before a failed API call.
  if (!PROVIDERS[provider].keyPattern.test(api_key)) {
    return { error: `That does not look like a ${PROVIDERS[provider].label} key.` };
  }

  const { error } = await supabase.from("ai_credentials").upsert(
    {
      user_id: user.id,
      provider,
      model,
      encrypted_key: encryptSecret(api_key),
      key_hint: maskKey(api_key),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { ok: "saved" };
}

export async function removeAiKey() {
  const { supabase, user } = await requireUser();
  await supabase.from("ai_credentials").delete().eq("user_id", user.id);
  revalidatePath("/settings");
}

/** Everything the account holds, in one file she owns. */
export async function exportEverything(): Promise<string> {
  const { supabase, user } = await requireUser();

  const [orders, customers, priceBook, profile] = await Promise.all([
    supabase.from("orders").select("*").eq("user_id", user.id),
    supabase.from("customers").select("*").eq("user_id", user.id),
    supabase.from("price_book").select("*").eq("user_id", user.id),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ]);

  return JSON.stringify(
    {
      exported_at: new Date().toISOString(),
      app: "HunarHisaab",
      profile: profile.data ?? null,
      orders: orders.data ?? [],
      customers: customers.data ?? [],
      price_book: priceBook.data ?? [],
    },
    null,
    2,
  );
}

/** Removes the account and, by cascade, everything in it. */
export async function deleteAccount(confirmation: string) {
  if (confirmation !== "DELETE") return;
  const { supabase } = await requireUser();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return;
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
