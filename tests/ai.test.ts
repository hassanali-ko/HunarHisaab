import { beforeAll, describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";

beforeAll(() => {
  process.env.APP_ENCRYPTION_KEY = randomBytes(32).toString("base64");
});

describe("stored provider keys", () => {
  it("round trips", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/ai/crypto");
    const key = "sk-test-abcdefghijklmnopqrstuvwxyz";
    expect(decryptSecret(encryptSecret(key))).toBe(key);
  });

  it("never stores the same ciphertext twice for the same key", async () => {
    const { encryptSecret } = await import("@/lib/ai/crypto");
    expect(encryptSecret("same")).not.toBe(encryptSecret("same"));
  });

  it("refuses a tampered blob instead of returning garbage", async () => {
    const { encryptSecret, decryptSecret } = await import("@/lib/ai/crypto");
    const blob = Buffer.from(encryptSecret("sk-secret-value-123456"), "base64");
    blob[blob.length - 1] ^= 0xff;
    expect(() => decryptSecret(blob.toString("base64"))).toThrow();
  });

  it("only ever shows a hint", async () => {
    const { maskKey } = await import("@/lib/ai/crypto");
    const hint = maskKey("sk-abcdefghijklmnop1234");
    expect(hint).toBe("sk-a••••1234");
    expect(hint).not.toContain("efghijkl");
  });
});

describe("merging an AI reply", () => {
  it("never overrules a field the rules were sure about", async () => {
    const { parseOrder } = await import("@/lib/parser");
    const { mergeAi } = await import("@/lib/ai/enhance");
    const base = parseOrder("3 suits chahiye 4200 each DHA Lahore easypaisa");
    const merged = mergeAi(base, { unit_price: 99, quantity: 50, item: "Something else" });
    expect(merged.unitPrice?.value).toBe(4200);
    expect(merged.quantity?.value).toBe(3);
    expect(merged.engine).toBe("builtin+ai");
  });

  it("fills what the rules left blank", async () => {
    const { parseOrder } = await import("@/lib/parser");
    const { mergeAi } = await import("@/lib/ai/enhance");
    const base = parseOrder("baji kuch banwana hai");
    const merged = mergeAi(base, { item: "Kurti", unit_price: 1800, deadline_text: "Friday" });
    expect(merged.item?.value).toBe("Kurti");
    expect(merged.unitPrice?.value).toBe(1800);
    expect(merged.deadlineText?.value).toBe("Friday");
  });

  it("ignores payment methods that are not real options", async () => {
    const { parseOrder } = await import("@/lib/parser");
    const { mergeAi } = await import("@/lib/ai/enhance");
    const merged = mergeAi(parseOrder("2 cakes"), { payment_method: "Bitcoin" });
    expect(merged.paymentMethod).toBeNull();
  });

  it("treats junk numbers as missing", async () => {
    const { parseOrder } = await import("@/lib/parser");
    const { mergeAi } = await import("@/lib/ai/enhance");
    const merged = mergeAi(parseOrder("kuch chahiye"), { unit_price: -5, quantity: "lots" as unknown as number });
    expect(merged.unitPrice).toBeNull();
    expect(merged.quantity).toBeNull();
  });
});
