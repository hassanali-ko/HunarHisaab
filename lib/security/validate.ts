import { z } from "zod";

/**
 * Input validation.
 *
 * Every value that crosses from a browser into the database passes through
 * one of these. The database has its own constraints as a second line, but
 * rejecting bad input early gives a readable message instead of a 500.
 */

const trimmed = (max: number) =>
  z.string().trim().max(max, `Keep this under ${max} characters.`);

/**
 * A field that may be absent, empty, or null, and always comes out as either
 * a trimmed string or null. A value that is present but too long is still
 * rejected rather than silently truncated.
 */
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters.`)
    .nullable()
    .optional()
    .transform((v) => {
      const s = (v ?? "").trim();
      return s.length > 0 ? s : null;
    });

/** Money and counts arrive from number inputs as strings. */
const money = z.coerce
  .number()
  .finite("That is not a number.")
  .min(0, "This cannot be negative.")
  .max(1_000_000_000, "That is larger than this app can track.")
  .catch(0);

const count = z.coerce
  .number()
  .finite()
  .positive("Quantity must be more than zero.")
  .max(1_000_000)
  .catch(1);

export const ORDER_STATUSES = [
  "draft", "sent", "confirmed", "in_progress", "delivered", "paid", "cancelled",
] as const;

export const PAYMENT_METHODS = [
  "Cash", "Easypaisa", "JazzCash", "NayaPay", "SadaPay", "Raast", "Bank transfer",
] as const;

export const orderInput = z.object({
  item: trimmed(160).min(1, "Give this work a name."),
  item_category: optionalText(60),
  quantity: count,
  unit: optionalText(24),
  unit_price: money,

  customer_name: optionalText(120),
  customer_phone: optionalText(32),

  material_cost: money,
  labor_hours: z.coerce.number().finite().min(0).max(100000).catch(0),
  hourly_labor_value: money,
  packaging_cost: money,
  delivery_cost: money,
  other_cost: money,
  desired_profit_percent: z.coerce.number().finite().min(0).max(1000).catch(25),

  deadline_text: optionalText(80),
  deadline_date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a yyyy-mm-dd date.")
    .nullable()
    .catch(null),
  delivery_area: optionalText(160),
  city: optionalText(80),

  payment_method: z.enum(PAYMENT_METHODS).nullable().catch(null),
  amount_paid: money,

  source_text: optionalText(4000),
  parse_engine: optionalText(40),
  notes: optionalText(2000),
});

export type OrderInput = z.infer<typeof orderInput>;

export const profileInput = z.object({
  display_name: optionalText(80),
  business_name: optionalText(120),
  city: optionalText(80),
  craft: optionalText(80),
  whatsapp: optionalText(32),
  default_hourly_rate: money,
  default_profit_percent: z.coerce.number().finite().min(0).max(1000).catch(25),
});

export const priceBookInput = z.object({
  label: trimmed(120).min(1, "Give this a name."),
  category: optionalText(60),
  unit: optionalText(24),
  material_cost: money,
  labor_hours: z.coerce.number().finite().min(0).max(100000).catch(0),
  packaging_cost: money,
  last_price: money,
});

export const parseRequest = z.object({
  text: trimmed(4000).min(2, "Paste the message first."),
  useAi: z.boolean().optional().default(false),
});

export const paymentInput = z.object({
  amount: money,
});

export const uuid = z.string().uuid("That link is not valid.");

/** Turns a zod failure into one short sentence for the interface. */
export function firstError(err: z.ZodError): string {
  return err.issues[0]?.message ?? "Check the details and try again.";
}

/** Reads a FormData into a plain object zod can parse. */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) {
    if (typeof value === "string") out[key] = value;
  }
  return out;
}
