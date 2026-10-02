import "server-only";

import { field, type ParsedOrder } from "@/lib/parser/types";
import { askProvider, type AiFields, type ProviderId } from "./providers";

/**
 * Folds an AI reply into a parsed order.
 *
 * The rule based result wins wherever it was confident, because it can point
 * at the exact words it read and a model cannot. The model is only allowed to
 * fill blanks and to overrule genuinely shaky guesses.
 */

const CONFIDENT = 0.75;

const text = (v: unknown): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  return s.length > 0 && s.toLowerCase() !== "null" ? s : null;
};

const positive = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const PAYMENTS = [
  "Cash", "Easypaisa", "JazzCash", "NayaPay", "SadaPay", "Raast", "Bank transfer",
];

export function mergeAi(base: ParsedOrder, ai: AiFields | null): ParsedOrder {
  if (!ai) return base;
  const out: ParsedOrder = { ...base, engine: `${base.engine}+ai` };

  const take = <T>(
    current: ParsedOrder[keyof ParsedOrder],
    value: T | null,
  ): boolean => {
    if (value === null) return false;
    const f = current as { confidence: number } | null;
    return !f || f.confidence < CONFIDENT;
  };

  const item = text(ai.item);
  if (take(out.item, item)) out.item = field(item!, 0.8, null);

  const qty = positive(ai.quantity);
  if (take(out.quantity, qty)) out.quantity = field(Math.round(qty!), 0.8, null);

  const price = positive(ai.unit_price);
  if (take(out.unitPrice, price)) out.unitPrice = field(price!, 0.8, null);

  const due = text(ai.deadline_text);
  if (take(out.deadlineText, due)) out.deadlineText = field(due!, 0.75, null);

  const area = text(ai.delivery_area);
  if (take(out.deliveryArea, area)) out.deliveryArea = field(area!, 0.8, null);

  const payRaw = text(ai.payment_method);
  const pay = payRaw
    ? PAYMENTS.find((p) => p.toLowerCase() === payRaw.toLowerCase()) ?? null
    : null;
  if (take(out.paymentMethod, pay)) out.paymentMethod = field(pay!, 0.8, null);

  const name = text(ai.customer_name);
  if (take(out.customerName, name)) out.customerName = field(name!, 0.7, null);

  const notes = text(ai.notes);
  if (notes && !out.notes) out.notes = field(notes, 0.6, null);

  const filled = [
    out.item, out.quantity, out.unitPrice,
    out.deadlineText, out.deliveryArea, out.paymentMethod,
  ].filter(Boolean).length;
  out.coverage = filled / 6;

  return out;
}

/** True when the rule pass left enough gaps that a model is worth the call. */
export function worthAsking(parsed: ParsedOrder): boolean {
  const weak = [
    parsed.item, parsed.quantity, parsed.unitPrice, parsed.deadlineText,
  ].filter((f) => !f || f.confidence < CONFIDENT).length;
  return weak >= 1;
}

export async function enhance(
  parsed: ParsedOrder,
  message: string,
  provider: ProviderId,
  key: string,
  model: string,
): Promise<{ result: ParsedOrder; error: string | null }> {
  try {
    const ai = await askProvider(provider, key, model, message, parsed);
    return { result: mergeAi(parsed, ai), error: null };
  } catch (err) {
    // A provider failure is never fatal. She still has the rule based result.
    const reason = err instanceof Error ? err.message : "AI assist failed";
    return { result: parsed, error: reason };
  }
}
