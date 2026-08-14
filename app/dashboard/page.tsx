import Link from "next/link";
import { redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { LangSwitcher } from "@/components/lang";
import { OrderRow } from "@/components/order-row";
import { Button, ButtonLink, Card, Logo, StatTile } from "@/components/ui";
import { pkrLabel } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { calculatePricing } from "@/lib/pricing";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";
import { signOut } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = getDict(await getLocale());

  const [{ data: profile }, { data: ordersData }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const orders = (ordersData ?? []) as Order[];

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonth = orders.filter((o) => new Date(o.created_at) >= monthStart);
  const confirmed = orders.filter((o) => o.status === "confirmed");

  const sum = (
    list: Order[],
    pick: (p: ReturnType<typeof calculatePricing>) => number,
  ) => list.reduce((acc, o) => acc + pick(calculatePricing(o)), 0);

  const monthRevenue = sum(thisMonth, (p) => p.revenue);
  const monthProfit = sum(thisMonth, (p) => p.profit);
  const confirmedRevenue = sum(confirmed, (p) => p.revenue);
  const confirmedProfit = sum(confirmed, (p) => p.profit);

  const greetingName =
    profile?.display_name || user.email?.split("@")[0] || "Baji";

  return (
    <main className="flex-1 pb-24">
      <AutoRefresh />

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-5 py-4">
          <Logo compact />
          <div className="flex items-center gap-2">
            <LangSwitcher />
            <form action={signOut}>
              <Button variant="ghost" className="text-sm">
                {t.logout}
              </Button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-5 py-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {t.greeting}, {greetingName}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {profile?.business_name ?? t.defaultTagline}
            </p>
          </div>
          <ButtonLink href="/orders/new" className="hidden sm:inline-flex">
            + {t.newOrder}
          </ButtonLink>
        </div>

        <section className="mt-6 grid grid-cols-2 gap-3">
          <StatTile
            label={t.statRevenue}
            value={pkrLabel(monthRevenue)}
            sub={`${thisMonth.length} ${thisMonth.length === 1 ? t.orderWord : t.ordersWord}`}
            tone="primary"
          />
          <StatTile
            label={t.statProfit}
            value={pkrLabel(monthProfit)}
            sub={t.statProfitSub}
          />
          <StatTile label={t.statOrders} value={String(orders.length)} />
          <StatTile
            label={t.statConfirmed}
            value={String(confirmed.length)}
            sub={pkrLabel(confirmedRevenue)}
            tone="accent"
          />
        </section>

        <section className="mt-6">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="font-semibold">{t.recentOrders}</h2>
            {orders.length > 0 ? (
              <span className="text-xs text-muted">{t.autoUpdates}</span>
            ) : null}
          </div>

          <Card className="mt-2 p-2">
            {orders.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-lg font-medium">{t.emptyTitle}</p>
                <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
                  {t.emptyBody}
                </p>
                <ButtonLink href="/orders/new" size="lg" className="mt-5">
                  {t.ctaPrimary}
                </ButtonLink>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {orders.slice(0, 8).map((order) => (
                  <OrderRow key={order.id} order={order} t={t} />
                ))}
              </div>
            )}
          </Card>
        </section>

        {confirmed.length > 0 ? (
          <section className="mt-6">
            <h2 className="px-1 font-semibold">{t.kamaiTitle}</h2>
            <Card className="mt-2">
              <p className="text-sm text-muted">{t.kamaiSub}</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xl font-semibold tabular-nums text-primary sm:text-2xl">
                    {pkrLabel(confirmedRevenue)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">
                    {t.kamaiRevenue}
                  </div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums sm:text-2xl">
                    {pkrLabel(confirmedProfit)}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{t.estProfit}</div>
                </div>
                <div>
                  <div className="text-xl font-semibold tabular-nums sm:text-2xl">
                    {confirmed.length}
                  </div>
                  <div className="mt-0.5 text-xs text-muted">{t.kamaiCount}</div>
                </div>
              </div>
              <p className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted">
                {t.kamaiDisclaimer}
              </p>
            </Card>
          </section>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur sm:hidden">
        <Link
          href="/orders/new"
          className="flex w-full items-center justify-center rounded-xl bg-primary px-5 py-3.5 text-base font-semibold text-white"
        >
          + {t.newOrder}
        </Link>
      </div>
    </main>
  );
}
