import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * Anyone running the first version has a database shaped by
 * tests/fixtures/schema-v1.sql. The current schema has to upgrade that in
 * place without losing an order, and the result has to obey every rule a
 * fresh install does.
 */

const SELLER = "44444444-4444-4444-4444-444444444444";

describe("upgrading a first version database", () => {
  it("keeps every order and applies the new rules", async () => {
    const db = new PGlite({ extensions: { pgcrypto } });
    await db.exec(readFileSync("supabase/testing/supabase-stub.sql", "utf8"));
    await db.exec(readFileSync("tests/fixtures/schema-v1.sql", "utf8"));

    await db.exec(`insert into auth.users (id, email) values ('${SELLER}', 'v1@example.test')`);
    await db.exec(`insert into public.orders
      (user_id, item, quantity, unit_price, status, confirmed_at, deadline_text) values
      ('${SELLER}', 'Suit', 3, 4200, 'confirmed', now(), '23rd'),
      ('${SELLER}', 'Cake', 1, 5500, 'pending', null, null),
      ('${SELLER}', 'Mehndi', 1, 12000, 'draft', null, null),
      ('${SELLER}', 'Samosa', 8, null, 'something odd', null, null)`);

    const schema = readFileSync("supabase/schema.sql", "utf8");
    await db.exec(schema);
    await db.exec(schema);

    const rows = await db.query<{ item: string; status: string; unit_price: string }>(
      "select item, status::text, unit_price from public.orders order by item");
    expect(rows.rows.map((r) => [r.item, r.status])).toEqual([
      ["Cake", "draft"],
      ["Mehndi", "draft"],
      ["Samosa", "draft"],
      ["Suit", "confirmed"],
    ]);
    expect(rows.rows.find((r) => r.item === "Samosa")!.unit_price).toBe("0");

    // Fractional quantities fit now.
    await db.exec(`reset role; set request.jwt.claim.sub = '${SELLER}'; set role authenticated;`);
    await db.query("insert into public.orders (user_id, item, quantity) values ($1, 'Rice', 2.5)", [SELLER]);

    // And the confirmation guard holds on upgraded data.
    await expect(
      db.query("update public.orders set unit_price = 1 where item = 'Suit'"),
    ).rejects.toThrow(/can no longer change/);
    await expect(
      db.query("update public.orders set confirmed_at = now() where item = 'Cake'"),
    ).rejects.toThrow(/Only the customer/);

    // The anon role lost the broad grants the first version relied on.
    await db.exec("reset role; set role anon;");
    await expect(db.query("select * from public.orders")).rejects.toThrow(/permission denied/);
  }, 60_000);
});
