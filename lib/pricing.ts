/**
 * Deterministic pricing math. No AI anywhere in this file.
 *
 * Cost model, stated plainly so the UI can label it honestly:
 *   material, labour and packaging are entered PER UNIT
 *   delivery and other costs apply ONCE PER ORDER
 */

export type CostInputs = {
  quantity: number;
  material_cost: number;
  labor_hours: number;
  hourly_labor_value: number;
  packaging_cost: number;
  delivery_cost: number;
  other_cost: number;
  desired_profit_percent: number;
  unit_price: number;
};

export type Pricing = {
  quantity: number;
  laborValuePerUnit: number;
  costPerUnit: number;
  orderExtras: number;
  totalCost: number;
  breakEvenPerUnit: number;
  suggestedPricePerUnit: number;
  chosenPricePerUnit: number;
  revenue: number;
  profit: number;
  profitPerUnit: number;
  marginPercent: number;
  /** true when the chosen price does not even cover cost */
  belowBreakEven: boolean;
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

export function calculatePricing(input: Partial<CostInputs>): Pricing {
  const quantity = Math.max(1, Math.round(num(input.quantity) || 1));
  const laborValuePerUnit = num(input.labor_hours) * num(input.hourly_labor_value);
  const costPerUnit =
    num(input.material_cost) + laborValuePerUnit + num(input.packaging_cost);
  const orderExtras = num(input.delivery_cost) + num(input.other_cost);

  const totalCost = costPerUnit * quantity + orderExtras;
  const breakEvenPerUnit = totalCost / quantity;
  const suggestedPricePerUnit =
    breakEvenPerUnit * (1 + num(input.desired_profit_percent) / 100);

  const chosenPricePerUnit = num(input.unit_price);
  const revenue = chosenPricePerUnit * quantity;
  const profit = revenue - totalCost;

  return {
    quantity,
    laborValuePerUnit,
    costPerUnit,
    orderExtras,
    totalCost,
    breakEvenPerUnit,
    suggestedPricePerUnit,
    chosenPricePerUnit,
    revenue,
    profit,
    profitPerUnit: profit / quantity,
    marginPercent: revenue > 0 ? (profit / revenue) * 100 : 0,
    belowBreakEven: chosenPricePerUnit > 0 && chosenPricePerUnit < breakEvenPerUnit,
  };
}

/** Round up to a price that feels natural to quote in a WhatsApp message. */
export function roundToNiceprice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 100) return Math.ceil(value / 5) * 5;
  if (value < 1000) return Math.ceil(value / 25) * 25;
  return Math.ceil(value / 50) * 50;
}
