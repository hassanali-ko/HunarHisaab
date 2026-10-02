import type { Metadata } from "next";
import Link from "next/link";
import { Card, Notice, StatusPill } from "@/components/ui";
import { Star } from "@/components/marks";
import { rs, shortDate } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { summarise } from "@/lib/pricing";
import { getCustomers, getOrders, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "Customers" };
export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  const { supabase, user } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const [customers, orders] = await Promise.all([
    getCustomers(supabase, user.id),
    getOrders(supabase, user.id),
  ]);

  // Built from orders rather than stored, so the numbers cannot drift.
  const rows = customers
    .map((c) => {
      const theirs = orders.filter(
        (o) => o.customer_id === c.id && o.status !== "cancelled",
      );
      const sum = summarise(theirs);
      return {
        customer: c,
        count: theirs.length,
        spent: sum.revenue,
        outstanding: sum.outstanding,
        last: theirs[0]?.created_at ?? c.created_at,
      };
    })
    .sort((a, b) => b.spent - a.spent);

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.customersTitle}</h1>
      <p className="mt-1 text-[14px] text-soft">{t.customersSub}</p>

      {rows.length === 0 ? (
        <Notice tone="info" className="mt-5">
          {t.customersEmpty}
        </Notice>
      ) : (
        <Card className="mt-5 p-2">
          <ul className="divide-y divide-rule">
            {rows.map(({ customer, count, spent, outstanding, last }) => (
              <li key={customer.id}>
                <Link
                  href={`/orders?q=${encodeURIComponent(customer.name)}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-green-wash/50"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-wash text-[13px] font-semibold uppercase text-green">
                    {customer.name.slice(0, 2)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14.5px] font-medium">
                      {customer.name}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[12px] text-faint">
                      <span>
                        {count} {t.customerOrders}
                      </span>
                      {customer.area || customer.city ? (
                        <>
                          <Star size={5} className="text-rule-strong" />
                          <span>
                            {[customer.area, customer.city]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </>
                      ) : null}
                      <Star size={5} className="text-rule-strong" />
                      <span>
                        {t.customerLast} {shortDate(last)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-end">
                    <div className="ledger text-[14.5px] font-semibold">
                      {rs(spent)}
                    </div>
                    {outstanding > 0 ? (
                      <div className="ledger mt-0.5 text-[11px] text-marigold">
                        {rs(outstanding)} {t.stillOwed.toLowerCase()}
                      </div>
                    ) : null}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
