import { describe, expect, it } from "vitest";
import { calculatePricing, roundToQuotable, summarise } from "@/lib/pricing";

const order = {
  quantity: 3,
  unit_price: 4200,
  material_cost: 2200,
  labor_hours: 6,
  hourly_labor_value: 200,
  packaging_cost: 120,
  delivery_cost: 350,
  other_cost: 0,
  desired_profit_percent: 25,
  amount_paid: 6000,
};

describe("the worked example from the product", () => {
  const p = calculatePricing(order);

  it("values her time as a cost", () => {
    expect(p.laborValuePerUnit).toBe(1200);
  });

  it("adds per unit costs", () => {
    expect(p.costPerUnit).toBe(3520);
  });

  it("applies delivery once, not per unit", () => {
    expect(p.totalCost).toBe(3520 * 3 + 350);
  });

  it("finds the floor price", () => {
    expect(Math.round(p.breakEvenPerUnit)).toBe(3637);
  });

  it("suggests a price with the margin she asked for", () => {
    expect(Math.round(p.suggestedPricePerUnit)).toBe(4546);
    expect(roundToQuotable(p.suggestedPricePerUnit)).toBe(4550);
  });

  it("reports the real profit on the offered price", () => {
    expect(p.profit).toBe(4200 * 3 - (3520 * 3 + 350));
    expect(p.profit).toBe(1690);
    expect(Math.round(p.marginPercent)).toBe(13);
  });

  it("tracks what is still owed", () => {
    expect(p.revenue).toBe(12600);
    expect(p.balanceDue).toBe(6600);
  });

  it("works out what an hour actually paid her", () => {
    // 18 hours of work, revenue less everything that was not her labour.
    const nonLabour = 2200 * 3 + 120 * 3 + 350;
    expect(Math.round(p.effectiveHourlyRate)).toBe(
      Math.round((12600 - nonLabour) / 18),
    );
  });
});

describe("guard rails", () => {
  it("flags a price below break even", () => {
    const p = calculatePricing({ ...order, unit_price: 3000 });
    expect(p.belowBreakEven).toBe(true);
    expect(p.profit).toBeLessThan(0);
  });

  it("ties the break even flag to her hourly rate, because they are the same thing", () => {
    // Break even already pays her hours at her own rate, so a price above it
    // always works out above that rate. This pins that down so nobody later
    // adds a second, contradictory warning.
    for (const unit_price of [2000, 3000, 3636, 3700, 4200, 9000]) {
      const p = calculatePricing({ ...order, unit_price });
      expect(p.belowBreakEven).toBe(p.effectiveHourlyRate < order.hourly_labor_value);
    }
  });

  it("never divides by a zero quantity", () => {
    const p = calculatePricing({ ...order, quantity: 0 });
    expect(Number.isFinite(p.breakEvenPerUnit)).toBe(true);
  });

  it("ignores negative inputs instead of paying her to work", () => {
    const p = calculatePricing({ ...order, material_cost: -5000 });
    expect(p.costPerUnit).toBe(1200 + 120);
  });

  it("never reports a negative balance when overpaid", () => {
    const p = calculatePricing({ ...order, amount_paid: 99999 });
    expect(p.balanceDue).toBe(0);
  });

  it("handles an empty order without producing NaN", () => {
    const p = calculatePricing({});
    expect(Object.values(p).every((v) =>
      typeof v === "boolean" || Number.isFinite(v),
    )).toBe(true);
  });
});

describe("rounding to something quotable", () => {
  it("rounds up, never down, so she is never short", () => {
    expect(roundToQuotable(4546)).toBe(4550);
    expect(roundToQuotable(321)).toBe(325);
    expect(roundToQuotable(63)).toBe(65);
    expect(roundToQuotable(12345)).toBe(12400);
  });
});

describe("totals across many orders", () => {
  it("adds up revenue, profit and what is outstanding", () => {
    const s = summarise([order, { ...order, amount_paid: 0 }]);
    expect(s.count).toBe(2);
    expect(s.revenue).toBe(25200);
    expect(s.profit).toBe(3380);
    expect(s.outstanding).toBe(6600 + 12600);
  });
});
