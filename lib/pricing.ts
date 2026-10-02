/**
 * Pricing.
 *
 * Nothing in this file is a guess. Every figure the product shows comes from
 * here, by arithmetic anyone can redo on paper. That is deliberate: a model
 * that invents a price would be worse than useless to someone deciding
 * whether a job is worth taking.
 *
 * The cost model, stated plainly so the interface can label it honestly:
 *   material, labour and packaging are entered PER UNIT
 *   delivery and anything else apply ONCE PER ORDER
 */

export type CostInputs = {
  quantity: number;
  unit_price: number;
  material_cost: number;
  labor_hours: number;
  hourly_labor_value: number;
  packaging_cost: number;
  delivery_cost: number;
  other_cost: number;
  desired_profit_percent: number;
  amount_paid: number;
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
  /** What her hours worked out to once materials were paid for. */
  effectiveHourlyRate: number;
  amountPaid: number;
  balanceDue: number;
  belowBreakEven: boolean;
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : 0;
};

const clampPositive = (n: number) => (n > 0 ? n : 0);

export function calculatePricing(input: Partial<CostInputs>): Pricing {
  const quantity = Math.max(0.0001, num(input.quantity) || 1);
  const hours = clampPositive(num(input.labor_hours));
  const rate = clampPositive(num(input.hourly_labor_value));

  const laborValuePerUnit = hours * rate;
  const costPerUnit =
    clampPositive(num(input.material_cost)) +
    laborValuePerUnit +
    clampPositive(num(input.packaging_cost));

  const orderExtras =
    clampPositive(num(input.delivery_cost)) + clampPositive(num(input.other_cost));

  const totalCost = costPerUnit * quantity + orderExtras;
  const breakEvenPerUnit = totalCost / quantity;
  const suggestedPricePerUnit =
    breakEvenPerUnit * (1 + clampPositive(num(input.desired_profit_percent)) / 100);

  const chosenPricePerUnit = clampPositive(num(input.unit_price));
  const revenue = chosenPricePerUnit * quantity;
  const profit = revenue - totalCost;

  // What her time actually earned: revenue, less everything except her labour,
  // divided by the hours she put in.
  //
  // Note this is not a second safety check. Break even already prices her
  // hours at her own rate, so a price above break even always works out above
  // that rate and vice versa. This number is here because "Rs 210 an hour" is
  // a fact she can act on, while "profitable" is not.
  const nonLabourCost = totalCost - laborValuePerUnit * quantity;
  const totalHours = hours * quantity;
  const effectiveHourlyRate =
    totalHours > 0 ? (revenue - nonLabourCost) / totalHours : 0;

  const amountPaid = clampPositive(num(input.amount_paid));

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
    effectiveHourlyRate,
    amountPaid,
    balanceDue: Math.max(0, revenue - amountPaid),
    belowBreakEven: chosenPricePerUnit > 0 && chosenPricePerUnit < breakEvenPerUnit,
  };
}

/** Rounds up to a figure that is natural to quote in a message. */
export function roundToQuotable(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  if (value < 100) return Math.ceil(value / 5) * 5;
  if (value < 1000) return Math.ceil(value / 25) * 25;
  if (value < 10000) return Math.ceil(value / 50) * 50;
  return Math.ceil(value / 100) * 100;
}

/** Totals a list of orders without recomputing the same thing three times. */
export function summarise(rows: Partial<CostInputs>[]) {
  let revenue = 0;
  let profit = 0;
  let cost = 0;
  let paid = 0;
  let outstanding = 0;
  let hours = 0;
  let nonLabourCost = 0;

  for (const row of rows) {
    const p = calculatePricing(row);
    revenue += p.revenue;
    profit += p.profit;
    cost += p.totalCost;
    paid += Math.min(p.amountPaid, p.revenue);
    outstanding += p.balanceDue;
    hours += clampPositive(num(row.labor_hours)) * p.quantity;
    nonLabourCost += p.totalCost - p.laborValuePerUnit * p.quantity;
  }

  return {
    revenue,
    profit,
    cost,
    paid,
    outstanding,
    hours,
    count: rows.length,
    /** What an hour of her time actually earned across this set of work. */
    averageHourly: hours > 0 ? (revenue - nonLabourCost) / hours : 0,
  };
}
