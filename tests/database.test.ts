import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

/**
 * The schema's security boundaries, asserted against real Postgres.
 *
 * PGlite is Postgres compiled to WASM, so this needs no Docker and no network
 * and runs on every `npm test`. It enforces roles, grants and row level
 * security exactly as a server would.
 */

const A = "11111111-1111-1111-1111-111111111111";
const B = "22222222-2222-2222-2222-222222222222";
const C = "33333333-3333-3333-3333-333333333333";

let db: PGlite;

async function as(user: string | null, role: "authenticated" | "anon" | null) {
  await db.exec("reset role");
  await db.exec(`set request.jwt.claim.sub = '${user ?? ""}'`);
  if (role) await db.exec(`set role ${role}`);
}

async function one<T = Record<string, unknown>>(sql: string, params: unknown[] = []) {
  const r = await db.query<T>(sql, params);
  return r.rows[0];
}

async function refused(sql: string, params: unknown[] = []): Promise<string> {
  try {
    await db.query(sql, params);
  } catch (e) {
    return (e as Error).message;
  }
  throw new Error(`expected this to be refused: ${sql}`);
}

beforeAll(async () => {
  db = new PGlite({ extensions: { pgcrypto } });
  await db.exec(readFileSync("supabase/testing/supabase-stub.sql", "utf8"));
  const schema = readFileSync("supabase/schema.sql", "utf8");
  await db.exec(schema);
  // Twice, because it has to be safe to re-run on an existing install.
  await db.exec(schema);

  await db.exec(`insert into auth.users (id, email) values
    ('${A}', 'a@example.test'), ('${B}', 'b@example.test'), ('${C}', 'c@example.test')`);

  await as(A, "authenticated");
  await db.query("select public.load_sample_data()");
}, 60_000);

describe("tenant isolation", () => {
  it("a seller sees her own orders", async () => {
    await as(A, "authenticated");
    expect((await one<{ n: number }>("select count(*)::int n from orders")).n).toBe(5);
  });

  it("a second seller sees none of them, in any table", async () => {
    await as(B, "authenticated");
    const r = await one<{ n: number }>(`select (
      (select count(*) from orders) + (select count(*) from customers) +
      (select count(*) from price_book) + (select count(*) from order_events) +
      (select count(*) from ai_credentials))::int n`);
    expect(r.n).toBe(0);
  });

  it("refuses a write into someone else's account", async () => {
    await as(B, "authenticated");
    await refused("insert into orders (user_id, item) values ($1, 'hijack')", [A]);
  });

  it("keeps rate limit counters out of reach", async () => {
    await as(B, "authenticated");
    await refused("select * from rate_limits");
  });
});

describe("anonymous visitors", () => {
  it("cannot read any table", async () => {
    await as(null, "anon");
    for (const t of ["orders", "profiles", "customers", "price_book", "ai_credentials", "order_events"]) {
      await refused(`select * from ${t}`);
    }
  });

  it("get nothing for an unknown token", async () => {
    await as(null, "anon");
    const r = await db.query("select * from get_public_order($1)", [
      "00000000-0000-0000-0000-000000000000",
    ]);
    expect(r.rows).toHaveLength(0);
  });

  it("see only the narrow summary for a real one", async () => {
    await as(A, "authenticated");
    const { public_token } = await one<{ public_token: string }>(
      "select public_token from orders where status = 'sent' limit 1");
    await as(null, "anon");
    const row = await one("select * from get_public_order($1)", [public_token]);
    expect(Object.keys(row!).sort()).toEqual([
      "business_name", "confirmed_at", "deadline_text", "delivery_area",
      "expired", "is_owner", "item", "payment_method", "quantity", "status",
      "total", "unit", "unit_price",
    ]);
    expect(row!.is_owner).toBe(false);
  });
});

describe("the confirmation cannot be faked", () => {
  it("a seller cannot create an order that is already confirmed", async () => {
    await as(A, "authenticated");
    const msg = await refused(
      "insert into orders (user_id, item, confirmed_at) values ($1, 'x', now())", [A]);
    expect(msg).toMatch(/Only the customer/);
  });

  it("a seller cannot stamp confirmed_at on an existing order", async () => {
    await as(A, "authenticated");
    const msg = await refused(
      "update orders set confirmed_at = now() where status = 'draft'");
    expect(msg).toMatch(/Only the customer/);
  });

  it("a seller cannot mark an order confirmed without a confirmation", async () => {
    await as(A, "authenticated");
    await refused("update orders set status = 'confirmed' where status = 'draft'");
  });

  it("a seller cannot write an event in the customer's name", async () => {
    await as(A, "authenticated");
    const { id } = await one<{ id: string }>("select id from orders limit 1");
    await refused(
      "insert into order_events (order_id, kind, actor) values ($1, 'confirmed', 'customer')", [id]);
  });

  it("the owner cannot confirm her own order through the link", async () => {
    await as(A, "authenticated");
    const { public_token } = await one<{ public_token: string }>(
      "select public_token from orders where status = 'sent' limit 1");
    const r = await one<{ ok: boolean; reason: string }>(
      "select * from confirm_public_order($1)", [public_token]);
    expect(r).toEqual({ ok: false, reason: "own_order" });
  });

  it("the customer can, once, and it is logged", async () => {
    await as(A, "authenticated");
    const { public_token, id } = await one<{ public_token: string; id: string }>(
      "select public_token, id from orders where status = 'sent' limit 1");

    await as(null, "anon");
    expect(await one("select * from confirm_public_order($1)", [public_token]))
      .toEqual({ ok: true, reason: "confirmed" });
    expect(await one("select * from confirm_public_order($1)", [public_token]))
      .toEqual({ ok: true, reason: "already" });

    await as(A, "authenticated");
    const ev = await one<{ actor: string }>(
      "select actor from order_events where order_id = $1 and kind = 'confirmed'", [id]);
    expect(ev?.actor).toBe("customer");
  });

  it("freezes what the customer agreed to", async () => {
    await as(A, "authenticated");
    const msg = await refused(
      "update orders set unit_price = unit_price * 2 where confirmed_at is not null");
    expect(msg).toMatch(/can no longer change/);
  });

  it("still lets her correct her own cost figures afterwards", async () => {
    await as(A, "authenticated");
    const r = await db.query(
      "update orders set material_cost = material_cost + 1 where confirmed_at is not null");
    expect(r.affectedRows).toBeGreaterThan(0);
  });

  it("lets her move a confirmed order along the pipeline", async () => {
    await as(A, "authenticated");
    const r = await db.query(
      "update orders set status = 'in_progress' where confirmed_at is not null and status = 'confirmed'");
    expect(r.affectedRows).toBeGreaterThan(0);
  });
});

describe("links", () => {
  it("an expired link reads as expired and cannot confirm", async () => {
    await as(A, "authenticated");
    const { public_token } = await one<{ public_token: string }>(
      `update orders set share_expires_at = now() - interval '1 day'
       where status = 'draft' returning public_token`);
    await as(null, "anon");
    expect((await one<{ expired: boolean }>(
      "select expired from get_public_order($1)", [public_token]))!.expired).toBe(true);
    expect(await one("select * from confirm_public_order($1)", [public_token]))
      .toEqual({ ok: false, reason: "expired" });
  });

  it("a cancelled order disappears and cannot confirm", async () => {
    await as(A, "authenticated");
    const { public_token } = await one<{ public_token: string }>(
      "update orders set status = 'cancelled' where status = 'draft' returning public_token");
    await as(null, "anon");
    expect((await db.query("select * from get_public_order($1)", [public_token])).rows)
      .toHaveLength(0);
    expect(await one("select * from confirm_public_order($1)", [public_token]))
      .toEqual({ ok: false, reason: "cancelled" });
  });
});

describe("rate limiting", () => {
  it("stops the call after the limit", async () => {
    await as(null, "anon");
    const hits: boolean[] = [];
    for (let i = 0; i < 4; i += 1) {
      hits.push((await one<{ ok: boolean }>(
        "select bump_rate_limit('t:1', 3, 60) ok"))!.ok);
    }
    expect(hits).toEqual([true, true, true, false]);
  });

  it("refuses oversized or nonsense buckets instead of storing them", async () => {
    await as(null, "anon");
    expect((await one<{ ok: boolean }>(
      "select bump_rate_limit($1, 3, 60) ok", ["x".repeat(500)]))!.ok).toBe(false);
    expect((await one<{ ok: boolean }>(
      "select bump_rate_limit('t:2', 3, 999999) ok"))!.ok).toBe(false);
  });
});

describe("account deletion", () => {
  it("removes the account and everything in it", async () => {
    await as(C, "authenticated");
    await db.query("select public.load_sample_data()");
    expect((await one<{ n: number }>("select count(*)::int n from orders")).n).toBe(5);

    await db.query("select public.delete_my_account()");

    await as(null, null);
    const r = await one<{ n: number }>(
      `select ((select count(*) from auth.users where id = $1) +
               (select count(*) from public.orders where user_id = $1) +
               (select count(*) from public.customers where user_id = $1))::int n`, [C]);
    expect(r!.n).toBe(0);
  });

  it("does not touch anyone else", async () => {
    await as(A, "authenticated");
    expect((await one<{ n: number }>("select count(*)::int n from orders")).n).toBe(5);
  });
});
