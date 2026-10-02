import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Customer, Order, PriceBookEntry, Profile } from "@/lib/types";

/**
 * Every signed in page starts here. One round trip for the user, one for the
 * profile, and the redirect decisions in a single place rather than repeated
 * at the top of a dozen files.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  const profile = (data ?? null) as Profile | null;
  return { supabase, user, profile };
}

/** Signed in, and past the three setup questions. */
export async function requireOnboarded() {
  const ctx = await requireProfile();
  if (!ctx.profile?.onboarded_at) redirect("/onboarding");
  return ctx as typeof ctx & { profile: Profile };
}

export async function getOrders(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Order[]> {
  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

export async function getCustomers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<Customer[]> {
  const { data } = await supabase
    .from("customers")
    .select("*")
    .eq("user_id", userId)
    .order("name");
  return (data ?? []) as Customer[];
}

export async function getPriceBook(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<PriceBookEntry[]> {
  const { data } = await supabase
    .from("price_book")
    .select("*")
    .eq("user_id", userId)
    .order("times_used", { ascending: false });
  return (data ?? []) as PriceBookEntry[];
}

/** Orders that count as money earned rather than money hoped for. */
export const EARNED: string[] = ["confirmed", "in_progress", "delivered", "paid"];
