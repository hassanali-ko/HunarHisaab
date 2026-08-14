export type OrderStatus = "draft" | "pending" | "confirmed" | "completed";

export type Order = {
  id: string;
  user_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  item: string;
  quantity: number;
  unit_price: number;
  material_cost: number;
  labor_hours: number;
  hourly_labor_value: number;
  packaging_cost: number;
  delivery_cost: number;
  other_cost: number;
  desired_profit_percent: number;
  deadline_text: string | null;
  delivery_area: string | null;
  payment_method: string | null;
  source_text: string | null;
  notes: string | null;
  status: OrderStatus;
  public_token: string;
  confirmed_at: string | null;
  created_at: string;
};

/** The only fields the public confirmation page is ever allowed to see. */
export type PublicOrder = {
  business_name: string;
  item: string;
  quantity: number;
  unit_price: number;
  total: number;
  deadline_text: string | null;
  payment_method: string | null;
  delivery_area: string | null;
  status: OrderStatus;
  confirmed_at: string | null;
};

/** Shape Gemini is asked to return. Every field may be null. */
export type ExtractedOrder = {
  customer_name: string | null;
  item: string | null;
  quantity: number | null;
  offered_price: number | null;
  deadline_text: string | null;
  delivery_area: string | null;
  payment_method: string | null;
  notes: string | null;
};

export const PAYMENT_METHODS = [
  "Cash",
  "Easypaisa",
  "JazzCash",
  "Bank transfer",
] as const;

export const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
] as const;
