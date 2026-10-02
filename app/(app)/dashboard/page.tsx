import type { Metadata } from "next";
import Link from "next/link";
import { OrderRow } from "@/components/order-row";
import { ButtonLink, Card, Notice, Sheet, Stat } from "@/components/ui";
import { Star } from "@/components/marks";
import { SampleDataButton } from "@/components/sample-data";
import { daysUntil, rs, rsShort } from "@/lib/format";
import { getDict, greeting } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { summarise } from "@/lib/pricing";
import { EARNED, getOrders, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "Home" };
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const { supabase, user, profile } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);
  const orders = await getOrders(supabase, user.id);

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const live = orders.filter((o) => o.status !== "cancelled");
  const thisMonth = live.filter((o) => new Date(o.created_at) >= monthStart);
  const earned = live.filter((o) => EARNED.includes(o.status));

  const month = summarise(thisMonth);
  const all = summarise(live);

  const dueSoon = live
    .filter((o) => o.status !== "paid" && o.deadline_date)
    .map((o) => ({ order: o, days: daysUntil(o.deadline_date) ?? 9999 }))
    .filter((x) => x.days <= 7)
    .sort((a, b) => a.days - b.days);

  const name = profile.display_name?.split(" ")[0] ?? "";
  const hello = `${greeting(t)}${name ? `, ${name}` : ""}`;

  if (orders.length === 0) {
    return (
      <>
        <h1 className="text-[1.75rem] leading-tight">{hello}</h1>
        <Card className="enter mt-6 p-7 text-center">
          <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-green-wash">
            <Star size={18} className="text-green" />
          </span>
          <p className="mt-4 text-[17px] font-medium">{t.emptyTitle}</p>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-soft">
            {t.emptyBody}
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <ButtonLink href="/orders/new" size="lg">
              {t.emptyCta}
            </ButtonLink>
            <SampleDataButton label={t.emptySample} />
          </div>
        </Card>
      </>
    );
  }

  return (
    <>
      <div>
        <h1 className="text-[1.75rem] leading-tight">{hello}</h1>
        <p className="mt-1 text-[14px] text-soft">
          {profile.business_name ?? t.tagline}
        </p>
      </div>

      <section className="mt-5 grid grid-cols-2 gap-3">
        <Stat
          label={t.dashThisMonth}
          value={rs(month.revenue)}
          sub={`${thisMonth.length} ${t.ordersCount}`}
          tone="green"
        />
        <Stat label={t.dashProfit} value={rs(month.profit)} sub={t.dashProfitSub} />
        <Stat
          label={t.dashOutstanding}
          value={rs(all.outstanding)}
          sub={t.dashOutstandingSub}
          tone={all.outstanding > 0 ? "marigold" : "plain"}
        />
        <Stat
          label={t.dashHourly}
          value={month.hours > 0 ? `${rsShort(month.averageHourly)}/hr` : "·"}
          sub={t.dashHourlySub}
        />
      </section>

      {dueSoon.length > 0 ? (
        <Sheet className="mt-6" title={t.dashDueSoon}>
          <Card className="p-2">
            <div className="divide-y divide-rule">
              {dueSoon.slice(0, 4).map(({ order }) => (
                <OrderRow key={order.id} order={order} t={t} />
              ))}
            </div>
          </Card>
        </Sheet>
      ) : null}

      <Sheet
        className="mt-6"
        title={t.dashRecent}
        action={
          <Link href="/orders" className="text-[13px] font-medium text-green">
            {t.dashSeeAll}
          </Link>
        }
      >
        <Card className="p-2">
          <div className="divide-y divide-rule">
            {orders.slice(0, 6).map((order) => (
              <OrderRow key={order.id} order={order} t={t} />
            ))}
          </div>
        </Card>
      </Sheet>

      {earned.length > 0 ? (
        <Notice tone="info" className="mt-6">
          <span className="ledger font-medium text-ink">
            {rs(summarise(earned).revenue)}
          </span>{" "}
          {t.incomeConfirmedTotal.toLowerCase()}.{" "}
          <Link
            href="/income"
            className="font-medium text-green underline underline-offset-4"
          >
            {t.incomeTitle}
          </Link>
        </Notice>
      ) : null}
    </>
  );
}
