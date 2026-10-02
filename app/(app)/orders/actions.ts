"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/data";
import {
  firstError,
  formToObject,
  orderInput,
  paymentInput,
  priceBookInput,
  uuid,
} from "@/lib/security/validate";
import { ORDER_STATUSES } from "@/lib/types";

export type SaveState = { error?: string } | undefined;

/**
 * Keeps the customer book in step with orders, so the Customers screen is
 * never a second thing to maintain by hand.
 */
async function upsertCustomer(
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
  userId: string,
  name: string | null,
  phone: string | null,
  area: string | null,
  city: string | null,
): Promise<string | null> {
  if (!name) return null;

  // ilike treats % and _ as wildcards. A customer called "100%" should match
  // only herself, not everyone.
  const literal = name.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("user_id", userId)
    .ilike("name", literal)
    .maybeSingle();

  if (existing?.id) {
    if (phone || area || city) {
      await supabase
        .from("customers")
        .update({
          ...(phone ? { phone } : {}),
          ...(area ? { area } : {}),
          ...(city ? { city } : {}),
        })
        .eq("id", existing.id);
    }
    return existing.id as string;
  }

  const { data } = await supabase
    .from("customers")
    .insert({ user_id: userId, name, phone, area, city })
    .select("id")
    .maybeSingle();
  return (data?.id as string) ?? null;
}

export async function createOrder(
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const { supabase, user } = await requireUser();

  const parsed = orderInput.safeParse(formToObject(form));
  if (!parsed.success) return { error: firstError(parsed.error) };
  const v = parsed.data;

  const customerId = await upsertCustomer(
    supabase,
    user.id,
    v.customer_name,
    v.customer_phone,
    v.delivery_area,
    v.city,
  );

  const { data, error } = await supabase
    .from("orders")
    .insert({ ...v, user_id: user.id, customer_id: customerId, status: "draft" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (form.get("save_to_pricebook") === "on") {
    await savePriceBookEntry(form, user.id, supabase);
  }

  revalidatePath("/", "layout");
  redirect(`/orders/${data.id}?new=1`);
}

export async function updateOrder(
  orderId: string,
  _prev: SaveState,
  form: FormData,
): Promise<SaveState> {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(orderId).success) return { error: "Unknown order." };

  const parsed = orderInput.safeParse(formToObject(form));
  if (!parsed.success) return { error: firstError(parsed.error) };

  const { error } = await supabase
    .from("orders")
    .update(parsed.data)
    .eq("id", orderId)
    .eq("user_id", user.id);

  // The confirmation guard explains itself in plain words, so pass it on.
  if (error) return { error: error.message };

  if (form.get("save_to_pricebook") === "on") {
    await savePriceBookEntry(form, user.id, supabase);
  }

  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}`);
}

async function savePriceBookEntry(
  form: FormData,
  userId: string,
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"],
) {
  const parsed = priceBookInput.safeParse({
    label: form.get("item"),
    category: form.get("item_category"),
    unit: form.get("unit"),
    material_cost: form.get("material_cost"),
    labor_hours: form.get("labor_hours"),
    packaging_cost: form.get("packaging_cost"),
    last_price: form.get("unit_price"),
  });
  if (!parsed.success) return;

  // The unique index is on lower(label), which PostgREST cannot target with
  // on conflict, so this looks first and then updates or inserts.
  const literal = parsed.data.label.replace(/[\\%_]/g, (c) => `\\${c}`);
  const { data: existing } = await supabase
    .from("price_book")
    .select("id, times_used")
    .eq("user_id", userId)
    .ilike("label", literal)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("price_book")
      .update({ ...parsed.data, times_used: Number(existing.times_used) + 1 })
      .eq("id", existing.id)
      .eq("user_id", userId);
  } else {
    await supabase
      .from("price_book")
      .insert({ ...parsed.data, user_id: userId, times_used: 1 });
  }
}

export async function deletePriceBookEntry(entryId: string) {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(entryId).success) return;
  await supabase.from("price_book").delete().eq("id", entryId).eq("user_id", user.id);
  revalidatePath("/pricebook");
}

const statusSchema = z.enum(ORDER_STATUSES).refine((v) => v !== "confirmed", {
  message: "Only the customer can confirm an order.",
});

export async function setStatus(orderId: string, status: string) {
  const { supabase, user } = await requireUser();
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success || !uuid.safeParse(orderId).success) return;

  await supabase
    .from("orders")
    .update({ status: parsed.data })
    .eq("id", orderId)
    .eq("user_id", user.id);
  await supabase
    .from("order_events")
    .insert({ order_id: orderId, kind: `status:${parsed.data}`, actor: "seller" });

  revalidatePath("/", "layout");
}

export async function recordPayment(orderId: string, form: FormData) {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(orderId).success) return;

  const parsed = paymentInput.safeParse({ amount: form.get("amount") });
  if (!parsed.success) return;

  const { data: order } = await supabase
    .from("orders")
    .select("amount_paid, unit_price, quantity, status")
    .eq("id", orderId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!order) return;

  const total = Number(order.unit_price) * Number(order.quantity);
  const paid = Math.min(total, Number(order.amount_paid) + parsed.data.amount);

  await supabase
    .from("orders")
    .update({
      amount_paid: paid,
      ...(paid >= total && total > 0 ? { status: "paid" } : {}),
    })
    .eq("id", orderId)
    .eq("user_id", user.id);

  await supabase.from("order_events").insert({
    order_id: orderId,
    kind: "payment",
    actor: "seller",
    meta: { amount: parsed.data.amount },
  });

  revalidatePath("/", "layout");
}

/** Sharing the link is the moment an order starts waiting on the customer. */
export async function markSent(orderId: string) {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(orderId).success) return;
  await supabase
    .from("orders")
    .update({ status: "sent" })
    .eq("id", orderId)
    .eq("user_id", user.id)
    .eq("status", "draft");
  revalidatePath("/", "layout");
}

/** Turns a shared link off without deleting the order it belongs to. */
export async function revokeShareLink(orderId: string) {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(orderId).success) return;
  await supabase
    .from("orders")
    .update({ share_expires_at: new Date().toISOString() })
    .eq("id", orderId)
    .eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function deleteOrder(orderId: string) {
  const { supabase, user } = await requireUser();
  if (!uuid.safeParse(orderId).success) return;
  await supabase.from("orders").delete().eq("id", orderId).eq("user_id", user.id);
  revalidatePath("/", "layout");
  redirect("/orders");
}
