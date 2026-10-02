import { describe, expect, it } from "vitest";
import { parseOrder } from "@/lib/parser";
import { orderInput, parseRequest, profileInput } from "@/lib/security/validate";
import { calculatePricing } from "@/lib/pricing";

/**
 * These are not feature tests. They pin down what happens when the input is
 * hostile, malformed, or just very large, because every one of these values
 * arrives from a browser.
 */

describe("the parser survives hostile input", () => {
  const nasty = [
    "",
    " ",
    "\u0000\u0000\u0000",
    "<script>alert(1)</script> 3 suits 4200",
    "'; DROP TABLE orders; -- 2 cakes 500",
    "{{constructor.constructor('return process')()}}",
    "a".repeat(10000),
    "9".repeat(500),
    "‮‭​ reversed text 3 suits",
    "👗👗👗 3 suits chahiye 4200 each 🎉",
    "../../etc/passwd",
    "%s%s%s%n",
    "0".repeat(40),
    "-".repeat(200),
    "\n\n\n\t\t\t",
  ];

  it("never throws", () => {
    for (const input of nasty) {
      expect(() => parseOrder(input), `threw on: ${input.slice(0, 40)}`).not.toThrow();
    }
  });

  it("never returns NaN or Infinity in a number field", () => {
    for (const input of nasty) {
      const r = parseOrder(input);
      for (const f of [r.quantity, r.unitPrice]) {
        if (f) expect(Number.isFinite(f.value)).toBe(true);
      }
    }
  });

  it("keeps spans inside the original string", () => {
    for (const input of nasty) {
      const r = parseOrder(input);
      const fields = [r.item, r.quantity, r.unitPrice, r.deadlineText, r.deliveryArea];
      for (const f of fields) {
        if (f?.span) {
          expect(f.span.start).toBeGreaterThanOrEqual(0);
          expect(f.span.end).toBeLessThanOrEqual(input.length);
          expect(f.span.end).toBeGreaterThanOrEqual(f.span.start);
        }
      }
    }
  });

  it("does not take unreasonably long on a large message", () => {
    const big = "3 green embroidered suits chahiye 4200 each DHA Lahore. ".repeat(200);
    const started = Date.now();
    parseOrder(big);
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it("passes markup straight through rather than interpreting it", () => {
    const r = parseOrder("<b>3</b> suits 4200 each");
    // React escapes on render; the parser must not try to be clever here.
    expect(r.unitPrice?.value).toBe(4200);
  });
});

describe("input validation", () => {
  it("requires an item", () => {
    const r = orderInput.safeParse({ item: "   " });
    expect(r.success).toBe(false);
  });

  it("rejects an item longer than the column", () => {
    const r = orderInput.safeParse({ item: "x".repeat(500) });
    expect(r.success).toBe(false);
  });

  it("coerces a junk number to a safe default instead of failing open", () => {
    const r = orderInput.safeParse({ item: "Suit", unit_price: "not a number" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.unit_price).toBe(0);
  });

  it("refuses a negative price", () => {
    const r = orderInput.safeParse({ item: "Suit", material_cost: "-999" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.material_cost).toBe(0);
  });

  it("rejects an unknown payment method", () => {
    const r = orderInput.safeParse({ item: "Suit", payment_method: "Bitcoin" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.payment_method).toBeNull();
  });

  it("rejects a malformed date", () => {
    const r = orderInput.safeParse({ item: "Suit", deadline_date: "tomorrow" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.deadline_date).toBeNull();
  });

  it("caps the pasted message so one request cannot be enormous", () => {
    const r = parseRequest.safeParse({ text: "x".repeat(99999) });
    expect(r.success).toBe(false);
  });

  it("turns an empty optional field into null, not an empty string", () => {
    const r = profileInput.safeParse({ display_name: "  ", default_hourly_rate: "200" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.display_name).toBeNull();
  });
});

describe("pricing cannot be pushed into nonsense", () => {
  const hostile = [
    { quantity: Number.NaN },
    { quantity: Infinity },
    { unit_price: -1e12 },
    { labor_hours: Number.MAX_SAFE_INTEGER },
    { hourly_labor_value: -500 },
    { quantity: 1e-12 },
    {},
  ];

  it("always returns finite numbers", () => {
    for (const input of hostile) {
      const p = calculatePricing(input);
      for (const [key, value] of Object.entries(p)) {
        if (typeof value === "number") {
          expect(Number.isFinite(value), `${key} was ${value}`).toBe(true);
        }
      }
    }
  });

  it("never reports a negative amount owed", () => {
    for (const input of hostile) {
      expect(calculatePricing(input).balanceDue).toBeGreaterThanOrEqual(0);
    }
  });
});
