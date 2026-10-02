"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export type AuthState = { error?: string } | undefined;

const credentials = z.object({
  email: z.string().trim().email("That does not look like an email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

const signupFields = credentials.extend({
  display_name: z.string().trim().max(80).optional(),
  business_name: z.string().trim().max(120).optional(),
  city: z.string().trim().max(80).optional(),
});

async function limited(): Promise<boolean> {
  const h = await headers();
  const { allowed } = await rateLimit("auth", clientKey(h));
  return !allowed;
}

/**
 * Supabase distinguishes a wrong password from an unknown address. The
 * interface does not, because telling an attacker which emails have accounts
 * is a free gift.
 */
const GENERIC = "Those details did not match. Check and try again.";

export async function signIn(
  _prev: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (await limited()) {
    return { error: "Too many attempts. Wait five minutes." };
  }

  const parsed = credentials.safeParse({
    email: form.get("email"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: GENERIC };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { error: GENERIC };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function signUp(
  _prev: AuthState,
  form: FormData,
): Promise<AuthState> {
  if (await limited()) {
    return { error: "Too many attempts. Wait five minutes." };
  }

  const parsed = signupFields.safeParse({
    email: form.get("email"),
    password: form.get("password"),
    display_name: form.get("display_name") ?? undefined,
    business_name: form.get("business_name") ?? undefined,
    city: form.get("city") ?? undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? GENERIC };
  }

  const { email, password, ...meta } = parsed.data;
  const supabase = await createClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: meta },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { error: "That email already has a register. Try logging in." };
    }
    return { error: error.message };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    return {
      error:
        "Account created, but sign in did not complete. Turn off email confirmation in Supabase, then log in.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/onboarding");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
