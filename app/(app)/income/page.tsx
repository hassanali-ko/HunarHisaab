import type { Metadata } from "next";
import { Card, Notice, Sheet, Stat } from "@/components/ui";
import { Seam } from "@/components/marks";
import { ExportButtons } from "./export";
import { longDate, pkr, rs, rsShort } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { calculatePricing, summarise } from "@/lib/pricing";
import { EARNED, getOrders, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "Income record" };
export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);

  const orders = await getOrders(supabase, user.id);
  const earned = orders.filter((o) => EARNED.includes(o.status));
  const total = summarise(earned);

  // Group by calendar month, newest first.
  const byMonth = new Map<string, typeof earned>();
  for (const o of earned) {
    const d = new Date(o.confirmed_at ?? o.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    byMonth.set(key, [...(byMonth.get(key) ?? []), o]);
  }
  const months = [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  const monthLabel = (key: string) => {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("en-PK", {
      month: "long",
      year: "numeric",
    });
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[1.6rem] leading-tight">{t.incomeTitle}</h1>
          <p className="mt-1 text-[14px] text-soft">{t.incomeSub}</p>
        </div>
        {earned.length > 0 ? (
          <ExportButtons
            orders={earned.map((o) => {
              const p = calculatePricing(o);
              return {
                date: (o.confirmed_at ?? o.created_at).slice(0, 10),
                item: o.item,
                customer: o.customer_name ?? "",
                quantity: o.quantity,
                unit_price: o.unit_price,
                total: p.revenue,
                cost: p.totalCost,
                profit: p.profit,
                hours: o.labor_hours * o.quantity,
                status: o.status,
              };
            })}
            labels={{ csv: t.incomeExport, print: t.incomePrint }}
            businessName={profile.business_name ?? profile.display_name ?? "HunarHisaab"}
          />
        ) : null}
      </div>

      {earned.length === 0 ? (
        <Notice tone="info" className="mt-5">
          {t.incomeEmpty}
        </Notice>
      ) : (
        <>
          <section className="mt-5 grid grid-cols-2 gap-3">
            <Stat
              label={t.incomeConfirmedTotal}
              value={rs(total.revenue)}
              tone="green"
            />
            <Stat label={t.incomeProfitTotal} value={rs(total.profit)} />
            <Stat label={t.incomeOrdersTotal} value={String(earned.length)} />
            <Stat
              label={t.incomeAvgHourly}
              value={total.hours > 0 ? `${rsShort(total.averageHourly)}/hr` : "·"}
              sub={`${pkr(total.hours)} ${t.incomeHoursTotal.toLowerCase()}`}
            />
          </section>

          <Sheet className="mt-6" title={t.incomeByMonth}>
            <Card className="p-4">
              {months.map(([key, list], i) => {
                const m = summarise(list);
                return (
                  <div key={key}>
                    {i > 0 ? <Seam className="my-4" /> : null}
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[15px] font-semibold">
                        {monthLabel(key)}
                      </h3>
                      <span className="ledger text-[15px] font-semibold text-green">
                        {rs(m.revenue)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12px] text-faint">
                      {list.length} {t.ordersCount} &middot; {rs(m.profit)}{" "}
                      {t.incomeProfitTotal.toLowerCase()}
                    </p>
                    <ul className="mt-2.5 space-y-1.5">
                      {list.map((o) => {
                        const p = calculatePricing(o);
                        return (
                          <li
                            key={o.id}
                            className="flex items-baseline justify-between gap-3 text-[13px]"
                          >
                            <span className="min-w-0 truncate text-soft">
                              {o.item}
                              {o.customer_name ? (
                                <span className="text-faint">
                                  {" "}
                                  &middot; {o.customer_name}
                                </span>
                              ) : null}
                            </span>
                            <span className="ledger shrink-0 font-medium">
                              {rs(p.revenue)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </Card>
          </Sheet>
        </>
      )}

      <Notice tone="info" className="mt-6">
        {t.incomeDisclaimer}
      </Notice>

      <p className="mt-4 hidden text-[11px] text-faint print:block">
        {longDate(new Date().toISOString())}
      </p>
    </>
  );
}
