"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const num = (fd: FormData, key: string): number => {
  const n = parseFloat(String(fd.get(key) ?? ""));
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const text = (fd: FormData, key: string): string | null => {
  const v = String(fd.get(key) ?? "").trim();
  return v.length > 0 ? v : null;
};

export type SaveState = { error?: string } | undefined;

export async function createOrder(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const item = text(formData, "item");
  if (!item) return { error: "Item ka naam zaruri hai." };

  const quantity = Math.max(1, Math.round(num(formData, "quantity") || 1));

  const { data, error } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      item,
      quantity,
      customer_name: text(formData, "customer_name"),
      customer_phone: text(formData, "customer_phone"),
      unit_price: num(formData, "unit_price"),
      material_cost: num(formData, "material_cost"),
      labor_hours: num(formData, "labor_hours"),
      hourly_labor_value: num(formData, "hourly_labor_value"),
      packaging_cost: num(formData, "packaging_cost"),
      delivery_cost: num(formData, "delivery_cost"),
      other_cost: num(formData, "other_cost"),
      desired_profit_percent: num(formData, "desired_profit_percent"),
      deadline_text: text(formData, "deadline_text"),
      delivery_area: text(formData, "delivery_area"),
      payment_method: text(formData, "payment_method"),
      source_text: text(formData, "source_text"),
      notes: text(formData, "notes"),
      status: "draft",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  redirect(`/orders/${data.id}?created=1`);
}

export async function markAwaitingConfirmation(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase
    .from("orders")
    .update({ status: "pending" })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("status", "draft");

  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/dashboard");
}

export async function deleteOrder(orderId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  await supabase.from("orders").delete().eq("id", orderId).eq("user_id", user.id);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
