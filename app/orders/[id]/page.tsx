import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AutoRefresh } from "@/components/auto-refresh";
import { LangSwitcher } from "@/components/lang";
import { ShareCard } from "@/components/share-card";
import { Card, Logo, StatusBadge, statusLabel } from "@/components/ui";
import { pkr, pkrLabel } from "@/lib/format";
import { getDict } from "@/lib/i18n";
import { getLocale } from "@/lib/locale-server";
import { calculatePricing } from "@/lib/pricing";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const query = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = getDict(await getLocale());

  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from("orders").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("profiles")
      .select("business_name, display_name")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (!data) notFound();
  const order = data as Order;
  const p = calculatePricing(order);

  const siteUrl = await getSiteUrl();
  const shareUrl = `${siteUrl}/o/${order.public_token}`;

  const whatsappText = [
    `${t.waGreeting}${order.customer_name ? ` ${order.customer_name}` : ""}!`,
    `${t.waYourOrder}: ${order.item}${order.quantity > 1 ? ` × ${order.quantity}` : ""}, ${pkrLabel(p.revenue)}.`,
    t.waConfirmTap,
  ].join("\n");

  return (
    <main className="flex-1 pb-10">
      <AutoRefresh />

      <header className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-3 px-5 py-4">
          <Link href="/dashboard">
            <Logo compact />
          </Link>
          <div className="flex items-center gap-3">
            <LangSwitcher />
            <Link href="/dashboard" className="text-sm font-medium text-muted">
              {t.dashboard}
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-2xl px-5 py-6">
        {query?.created === "1" ? (
          <p className="mb-4 rounded-xl bg-primary-soft px-4 py-3 text-sm font-medium text-primary-deep">
            {t.orderSaved}
          </p>
        ) : null}

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              {order.item}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {order.customer_name || t.customerWord}
              {order.delivery_area ? ` · ${order.delivery_area}` : ""}
            </p>
          </div>
          <StatusBadge
            status={order.status}
            label={statusLabel(order.status, t)}
          />
        </div>

        {order.status === "confirmed" ? (
          <div className="mt-5 rounded-2xl border border-primary/25 bg-primary-soft p-4">
            <p className="font-medium text-primary-deep">
              {t.customerConfirmed}
            </p>
            <p className="mt-1 text-sm text-primary-deep/80">
              {t.customerConfirmedSub}
            </p>
          </div>
        ) : (
          <Card className="mt-5">
            <h2 className="font-semibold">{t.confirmSectionTitle}</h2>
            <div className="mt-4">
              <ShareCard url={shareUrl} whatsappText={whatsappText} />
            </div>
          </Card>
        )}

        <Card className="mt-4">
          <h2 className="font-semibold">{t.orderSection}</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              [t.pubQuantity, String(order.quantity)],
              [t.pricePerUnit, pkrLabel(p.chosenPricePerUnit)],
              [t.totalWord, pkrLabel(p.revenue)],
              [t.deadlineLabel, order.deadline_text || "-"],
              [t.paymentLabel, order.payment_method || "-"],
              [t.notesLabel, order.notes || "-"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="text-end font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="mt-4">
          <h2 className="font-semibold">{t.hisaabSection}</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            {[
              [t.costPerUnit, pkrLabel(p.costPerUnit)],
              [t.timeValuePerUnit, pkrLabel(p.laborValuePerUnit)],
              [t.totalCost, pkrLabel(p.totalCost)],
              [t.breakEvenShort, pkrLabel(p.breakEvenPerUnit)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-end justify-between gap-3 rounded-xl bg-primary-soft/60 p-3">
            <div>
              <div className="text-xs text-muted">{t.estProfit}</div>
              <div className="text-2xl font-semibold tabular-nums text-primary">
                {pkrLabel(p.profit)}
              </div>
            </div>
            <div className="text-end text-xs tabular-nums text-muted">
              {pkr(p.marginPercent)}% {t.marginWord}
            </div>
          </div>
        </Card>

        {order.source_text ? (
          <Card className="mt-4">
            <h2 className="font-semibold">{t.originalMessage}</h2>
            <p
              dir="auto"
              className="mt-3 rounded-2xl rounded-tl-sm bg-[#dcf8c6] p-4 text-start text-[15px] leading-relaxed text-[#1d2521]"
              style={{ fontFamily: "var(--font-sans)" }}
            >
              {order.source_text}
            </p>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
