import type { Metadata } from "next";
import { OrderRow } from "@/components/order-row";
import { Card, Notice } from "@/components/ui";
import { OrderFilters } from "./filters";
import { getDict } from "@/lib/i18n";
import { readPrefs } from "@/lib/server-prefs";
import { getOrders, requireOnboarded } from "@/lib/data";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const { supabase, user } = await requireOnboarded();
  const { locale } = await readPrefs();
  const t = getDict(locale);
  const orders = await getOrders(supabase, user.id);

  return (
    <>
      <h1 className="text-[1.6rem] leading-tight">{t.ordersTitle}</h1>
      <p className="mt-1 text-[14px] text-soft">
        {orders.length} {t.ordersCount}
      </p>

      {orders.length === 0 ? (
        <Notice tone="info" className="mt-5">
          {t.emptyBody}
        </Notice>
      ) : (
        <div className="mt-5">
          <OrderFilters orders={orders} t={t} />
        </div>
      )}
    </>
  );
}
