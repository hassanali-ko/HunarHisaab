"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/data";

const schema = z.object({
  display_name: z.string().trim().max(80).optional().default(""),
  business_name: z.string().trim().max(120).optional().default(""),
  craft: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  default_hourly_rate: z.coerce.number().finite().min(0).max(1_000_000).catch(0),
});

export type OnboardState = { error?: string } | undefined;

export async function finishOnboarding(
  _prev: OnboardState,
  form: FormData,
): Promise<OnboardState> {
  const { supabase, user } = await requireUser();

  const parsed = schema.safeParse(Object.fromEntries(form.entries()));
  if (!parsed.success) return { error: "Check those answers and try again." };

  const v = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: v.display_name || null,
      business_name: v.business_name || null,
      craft: v.craft || null,
      city: v.city || null,
      default_hourly_rate: v.default_hourly_rate,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

/** Lets someone in without answering, rather than trapping them on a form. */
export async function skipOnboarding() {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("id", user.id);
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
