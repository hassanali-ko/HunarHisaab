export const ORDER_STATUSES = [
  "draft",
  "sent",
  "confirmed",
  "in_progress",
  "delivered",
  "paid",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** The order the pipeline normally moves in. */
export const STATUS_FLOW: OrderStatus[] = [
  "draft",
  "sent",
  "confirmed",
  "in_progress",
  "delivered",
  "paid",
];

/**
 * Where the seller's own button moves an order. "confirmed" never appears as
 * a destination: only the customer can put an order there, and the database
 * enforces that.
 */
export const NEXT_BY_SELLER: Partial<Record<OrderStatus, OrderStatus>> = {
  draft: "sent",
  sent: "in_progress",
  confirmed: "in_progress",
  in_progress: "delivered",
  delivered: "paid",
};

/** Work the customer has agreed to, which is what counts as earned. */
export const AGREED: OrderStatus[] = ["confirmed", "in_progress", "delivered", "paid"];

export const PAYMENT_METHODS = [
  "Cash",
  "Easypaisa",
  "JazzCash",
  "NayaPay",
  "SadaPay",
  "Raast",
  "Bank transfer",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type Profile = {
  id: string;
  display_name: string | null;
  business_name: string | null;
  city: string | null;
  craft: string | null;
  whatsapp: string | null;
  locale: string;
  theme: string;
  default_hourly_rate: number;
  default_profit_percent: number;
  onboarded_at: string | null;
  created_at: string;
};

export type Order = {
  id: string;
  user_id: string;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  item: string;
  item_category: string | null;
  quantity: number;
  unit: string | null;
  unit_price: number;
  material_cost: number;
  labor_hours: number;
  hourly_labor_value: number;
  packaging_cost: number;
  delivery_cost: number;
  other_cost: number;
  desired_profit_percent: number;
  deadline_text: string | null;
  deadline_date: string | null;
  delivery_area: string | null;
  city: string | null;
  payment_method: string | null;
  amount_paid: number;
  source_text: string | null;
  parse_engine: string | null;
  notes: string | null;
  status: OrderStatus;
  public_token: string;
  share_expires_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Customer = {
  id: string;
  user_id: string;
  name: string;
  phone: string | null;
  area: string | null;
  city: string | null;
  notes: string | null;
  created_at: string;
};

export type PriceBookEntry = {
  id: string;
  user_id: string;
  label: string;
  category: string | null;
  unit: string | null;
  material_cost: number;
  labor_hours: number;
  packaging_cost: number;
  last_price: number;
  times_used: number;
  created_at: string;
  updated_at: string;
};

export type AiCredential = {
  user_id: string;
  provider: string;
  model: string;
  key_hint: string;
  last_used_at: string | null;
  updated_at: string;
};

/** The only fields a buyer is ever shown. */
export type PublicOrder = {
  business_name: string;
  item: string;
  quantity: number;
  unit: string | null;
  unit_price: number;
  total: number;
  deadline_text: string | null;
  delivery_area: string | null;
  payment_method: string | null;
  status: string;
  confirmed_at: string | null;
  expired: boolean;
  /** True only when the seller herself is viewing the link while signed in. */
  is_owner: boolean;
};

export function statusLabel(
  status: string,
  t: Record<string, string>,
): string {
  const map: Record<string, string> = {
    draft: t.statusDraft,
    sent: t.statusSent,
    confirmed: t.statusConfirmed,
    in_progress: t.statusInProgress,
    delivered: t.statusDelivered,
    paid: t.statusPaid,
    cancelled: t.statusCancelled,
  };
  return map[status] ?? status;
}
